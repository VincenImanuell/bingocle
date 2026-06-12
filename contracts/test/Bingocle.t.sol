// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Test} from "forge-std/Test.sol";
import {EventFactory} from "../src/EventFactory.sol";
import {WordPool} from "../src/WordPool.sol";
import {WordMarket} from "../src/WordMarket.sol";
import {OracleRegistry} from "../src/OracleRegistry.sol";
import {BingoCardNFT} from "../src/BingoCardNFT.sol";
import {RewardVault} from "../src/RewardVault.sol";
import {AgentIdentity} from "../src/AgentIdentity.sol";
import {BingocleTypes} from "../src/lib/BingocleTypes.sol";
import {BingoLib} from "../src/lib/BingoLib.sol";

contract BingocleTest is Test {
    EventFactory factory;
    WordPool wordPool;
    WordMarket market;
    OracleRegistry oracle;
    BingoCardNFT cards;
    RewardVault vault;
    AgentIdentity identity;

    address owner = address(this);
    address organizer = makeAddr("organizer");
    address curator = makeAddr("curator");
    address oracleOp = makeAddr("oracle");
    address alice = makeAddr("alice");
    address bob = makeAddr("bob");

    uint64 t0;

    function setUp() public {
        identity = new AgentIdentity(owner);
        factory = new EventFactory(owner);
        wordPool = new WordPool(owner, address(factory));
        market = new WordMarket(address(factory));
        oracle = new OracleRegistry(owner, address(factory));
        cards = new BingoCardNFT(address(factory));
        vault = new RewardVault(address(factory));

        factory.wireModules(
            address(wordPool),
            address(market),
            address(oracle),
            address(cards),
            address(vault),
            address(identity)
        );
        identity.setUpdater(address(oracle));
        identity.registerAgent(oracleOp, "ipfs://oracle");
        wordPool.setCurator(curator);

        t0 = uint64(block.timestamp);
        vm.deal(organizer, 100 ether);
        vm.deal(alice, 100 ether);
        vm.deal(bob, 100 ether);
    }

    // --- helpers ---

    function _createEvent() internal returns (uint256 id) {
        return _createEventToken(address(0));
    }

    function _createEventToken(address token) internal returns (uint256 id) {
        BingocleTypes.BonusTiers memory bonus = BingocleTypes.BonusTiers({
            line: 5 ether,
            diagonal: 7 ether,
            doubleLine: 10 ether,
            fullCard: 50 ether
        });
        vm.prank(organizer);
        id = factory.createEvent(
            token,
            t0 + 100, // submissionEnd
            t0 + 200, // founderEnd
            t0 + 300, // marketLock
            t0 + 400, // eventEnd
            t0 + 500, // disputeEnd
            3,
            25,
            1 ether, // founderSeedUnit
            bonus
        );
    }

    function _commitPool(uint256 id) internal {
        uint256 n = 24;
        bytes32[] memory hashes = new bytes32[](n);
        uint16[] memory prices = new uint16[](n);
        uint16[] memory mults = new uint16[](n);
        address[] memory founders = new address[](n);
        for (uint256 i = 0; i < n; i++) {
            hashes[i] = keccak256(abi.encodePacked("w", i));
            prices[i] = 5000; // 0.5
            mults[i] = 20000; // 2.0x
            founders[i] = address(0);
        }
        founders[0] = alice; // alice founds word 0
        vm.prank(curator);
        wordPool.commitPool(id, hashes, prices, mults, founders, bytes32(uint256(1)));
    }

    // --- tests ---

    /// helper: buy `shares` of word `w` for `who` at the current curve price.
    function _buy(uint256 id, uint256 w, address who, uint256 shares) internal returns (uint256 cost) {
        cost = market.quoteBuy(id, w, shares);
        vm.prank(who);
        market.buy{value: cost}(id, w, shares, cost);
    }

    function test_FullLifecycle() public {
        uint256 id = _createEvent();
        vm.prank(organizer);
        vault.fund{value: 60 ether}(id, 60 ether);
        _commitPool(id);

        // Founder window: alice founds word0, claims seed + buys cheap
        vm.warp(t0 + 150);
        assertEq(uint256(factory.phaseOf(id)), uint256(BingocleTypes.Phase.Founder));
        vm.prank(alice);
        market.claimFounderSeed(id, 0);
        uint256 aCost = _buy(id, 0, alice, 10e18);

        // Market: bob buys word0 (pushes price up) + word1 (a loser); both mint cards
        vm.warp(t0 + 250);
        assertEq(uint256(factory.phaseOf(id)), uint256(BingocleTypes.Phase.Market));
        _buy(id, 0, bob, 10e18);
        _buy(id, 1, bob, 10e18);
        vm.prank(bob);
        cards.mint(id);
        vm.prank(alice);
        cards.mint(id);

        // Live: oracle validates word0 only
        vm.warp(t0 + 350);
        vm.prank(oracleOp);
        oracle.commitValidation(id, 0, 9700, "the AI flagged it");
        assertEq(identity.agentIdOf(oracleOp), 1);

        // Settled
        vm.warp(t0 + 550);
        market.settle(id);

        // alice + bob each hold 10 shares of validated word0 (equal shares => equal payout),
        // and they split word0's reserve PLUS the freed losing word1 reserve => profit.
        uint256 aBefore = alice.balance;
        vm.prank(alice);
        uint256 aPay = market.redeem(id);
        uint256 bBefore = bob.balance;
        vm.prank(bob);
        uint256 bPay = market.redeem(id);
        assertEq(aPay, bPay); // equal shares of the winning word
        assertEq(alice.balance - aBefore, aPay);
        assertGt(aPay, aCost); // winners profit from the losing word's freed reserve

        // founder seed on validated word0 pays from the reward pool (unchanged rail)
        uint256 aVaultBefore = alice.balance;
        vm.prank(alice);
        vault.claim(id);
        assertGe(alice.balance - aVaultBefore, 2 ether); // 1 ether seed * 2x mult

        // double redeem reverts
        vm.prank(alice);
        vm.expectRevert(WordMarket.AlreadyClaimed.selector);
        market.redeem(id);

        // winners exist => refundNoWinners reverts
        vm.prank(bob);
        vm.expectRevert(WordMarket.HasWinners.selector);
        market.refundNoWinners(id);
    }

    function test_NoWinnersRefund() public {
        uint256 id = _createEvent();
        _commitPool(id);

        vm.warp(t0 + 250); // Market
        uint256 cost = _buy(id, 3, alice, 5e18);

        // no oracle validation at all
        vm.warp(t0 + 550); // Settled
        uint256 before = alice.balance;
        vm.prank(alice);
        market.refundNoWinners(id);
        assertEq(alice.balance - before, cost); // full reserve back
    }

    function test_CardIsSoulbound() public {
        uint256 id = _createEvent();
        _commitPool(id);
        vm.warp(t0 + 250);
        vm.startPrank(alice);
        uint256 tokenId = cards.mint(id);
        vm.expectRevert(BingoCardNFT.Soulbound.selector);
        cards.transferFrom(alice, bob, tokenId);
        vm.stopPrank();
    }

    function test_RejectsNonMonotonicSchedule() public {
        BingocleTypes.BonusTiers memory bonus;
        vm.prank(organizer);
        vm.expectRevert(EventFactory.BadTiming.selector);
        factory.createEvent(address(0), t0 + 100, t0 + 100, t0 + 200, t0 + 300, t0 + 400, 3, 25, 1 ether, bonus);
    }

    function test_OnlyOracleCanValidate() public {
        uint256 id = _createEvent();
        _commitPool(id);
        vm.warp(t0 + 350); // Live
        vm.prank(bob);
        vm.expectRevert(OracleRegistry.NotOracle.selector);
        oracle.commitValidation(id, 0, 9000, "nope");
    }

    function test_OnlyCuratorCommitsPool() public {
        uint256 id = _createEvent();
        bytes32[] memory h = new bytes32[](24);
        uint16[] memory p = new uint16[](24);
        uint16[] memory m = new uint16[](24);
        address[] memory f = new address[](24);
        for (uint256 i = 0; i < 24; i++) {
            h[i] = keccak256(abi.encodePacked("w", i));
            p[i] = 5000;
            m[i] = 20000;
        }
        vm.prank(bob);
        vm.expectRevert(WordPool.NotCurator.selector);
        wordPool.commitPool(id, h, p, m, f, bytes32(uint256(1)));
    }

    function test_TokenURIIsOnChainJson() public {
        uint256 id = _createEvent();
        _commitPool(id);
        vm.warp(t0 + 250);
        vm.prank(alice);
        uint256 tokenId = cards.mint(id);
        string memory uri = cards.tokenURI(tokenId);
        // data URI prefix => renders in wallets without a metadata server
        assertEq(_substr(uri, 29), "data:application/json;base64,");
    }

    function _substr(string memory s, uint256 n) internal pure returns (string memory) {
        bytes memory b = bytes(s);
        bytes memory out = new bytes(n);
        for (uint256 i = 0; i < n; i++) out[i] = b[i];
        return string(out);
    }

    function test_BingoLibLines() public pure {
        // a full top row (cells 0-4) completes line 0
        uint32 marked = 0x1F; // bits 0..4
        assertEq(BingoLib.completedLineCount(marked), 1);
        assertFalse(BingoLib.isFull(marked));
        // full card
        assertTrue(BingoLib.isFull(0x1FFFFFF));
    }

    function test_DisputeReversesVerdict() public {
        uint256 id = _createEvent();
        _commitPool(id);
        vm.warp(t0 + 350); // Live
        vm.prank(oracleOp);
        oracle.commitValidation(id, 0, 9700, "said it");
        assertTrue(oracle.isValidated(id, 0));
        assertEq(oracle.validatedCount(id), 1);

        vm.warp(t0 + 450); // Dispute
        oracle.raiseDispute(id, 0);
        // organizer upholds the dispute -> verdict reversed
        vm.prank(organizer);
        oracle.resolveDispute(id, 0, true);
        assertFalse(oracle.isValidated(id, 0));
        assertEq(oracle.validatedCount(id), 0);
        (,,,, uint256 agentId) = oracle.verdicts(id, 0);
        (,, uint64 disputesUpheld) = identity.reputation(agentId);
        assertEq(disputesUpheld, 1);
    }

    function test_CancelRefunds() public {
        uint256 id = _createEvent();
        // fund the reward pool, then cancel
        vm.prank(organizer);
        vault.fund{value: 20 ether}(id, 20 ether);
        _commitPool(id);

        vm.warp(t0 + 250); // Market
        uint256 cost = _buy(id, 2, alice, 8e18);

        // organizer cancels (before eventEnd)
        vm.prank(organizer);
        factory.cancel(id);
        assertEq(uint256(factory.phaseOf(id)), uint256(BingocleTypes.Phase.Cancelled));

        // alice refunds her position; organizer reclaims the reward pool
        uint256 aBefore = alice.balance;
        vm.prank(alice);
        market.refund(id);
        assertEq(alice.balance - aBefore, cost);

        uint256 oBefore = organizer.balance;
        vm.prank(organizer);
        vault.withdrawOnCancel(id);
        assertEq(organizer.balance - oBefore, 20 ether);
    }

    function test_FounderWindowGatesNonFounders() public {
        uint256 id = _createEvent();
        _commitPool(id);
        vm.warp(t0 + 150); // Founder window
        uint256 c = market.quoteBuy(id, 0, 1e18);
        // bob is not the founder of word 0 -> cannot buy yet
        vm.prank(bob);
        vm.expectRevert(WordMarket.BadPhase.selector);
        market.buy{value: c}(id, 0, 1e18, c);
        // alice (founder of word 0) can
        vm.prank(alice);
        market.buy{value: c}(id, 0, 1e18, c);
        assertEq(market.sharesOf(id, 0, alice), 1e18);
    }

    function test_FundRejectedOnceLive() public {
        uint256 id = _createEvent();
        _commitPool(id);
        vm.warp(t0 + 350); // Live
        vm.prank(organizer);
        vm.expectRevert(RewardVault.AfterSettlement.selector);
        vault.fund{value: 1 ether}(id, 1 ether);
    }

    function test_ERC20FullPath() public {
        MockERC20 token = new MockERC20();
        token.mint(organizer, 1000 ether);
        token.mint(alice, 1000 ether);
        token.mint(bob, 1000 ether);

        uint256 id = _createEventToken(address(token));

        // organizer funds the reward pool in ERC20
        vm.startPrank(organizer);
        token.approve(address(vault), 60 ether);
        vault.fund(id, 60 ether);
        vm.stopPrank();

        _commitPool(id);

        vm.warp(t0 + 250); // Market
        uint256 aCost = market.quoteBuy(id, 0, 10e18);
        vm.startPrank(alice);
        token.approve(address(market), aCost);
        market.buy(id, 0, 10e18, aCost); // winner; no msg.value for ERC20
        vm.stopPrank();
        uint256 bCost = market.quoteBuy(id, 1, 10e18);
        vm.startPrank(bob);
        token.approve(address(market), bCost);
        market.buy(id, 1, 10e18, bCost); // loser, freed into the winner pool
        vm.stopPrank();
        assertEq(market.sharesOf(id, 0, alice), 10e18);

        vm.warp(t0 + 350); // Live
        vm.prank(oracleOp);
        oracle.commitValidation(id, 0, 9000, "erc20 word");

        vm.warp(t0 + 550); // Settled
        market.settle(id);
        uint256 before = token.balanceOf(alice);
        vm.prank(alice);
        uint256 pay = market.redeem(id); // alice (sole word0 holder) takes word0 + freed word1
        assertEq(token.balanceOf(alice) - before, pay);
        assertEq(pay, aCost + bCost); // sole winner gets everything (full conservation)
    }
}

/// @dev Minimal mintable ERC20 for the token-path test.
contract MockERC20 {
    string public name = "Mock USD";
    string public symbol = "mUSD";
    uint8 public decimals = 18;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    function mint(address to, uint256 amt) external {
        balanceOf[to] += amt;
    }

    function approve(address spender, uint256 amt) external returns (bool) {
        allowance[msg.sender][spender] = amt;
        return true;
    }

    function transfer(address to, uint256 amt) external returns (bool) {
        balanceOf[msg.sender] -= amt;
        balanceOf[to] += amt;
        return true;
    }

    function transferFrom(address from, address to, uint256 amt) external returns (bool) {
        allowance[from][msg.sender] -= amt;
        balanceOf[from] -= amt;
        balanceOf[to] += amt;
        return true;
    }
}
