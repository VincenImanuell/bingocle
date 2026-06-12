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

    function test_FullLifecycle() public {
        uint256 id = _createEvent();

        // organizer funds the reward/sponsor pool during submission
        vm.prank(organizer);
        vault.fund{value: 60 ether}(id, 60 ether);

        // curator commits the AI-curated pool (still pre-market)
        _commitPool(id);

        // Founder window: alice claims her free seed + buys her founded word
        vm.warp(t0 + 150);
        assertEq(uint256(factory.phaseOf(id)), uint256(BingocleTypes.Phase.Founder));
        vm.startPrank(alice);
        market.claimFounderSeed(id, 0);
        market.buy{value: 10 ether}(id, 0, 10 ether);
        vm.stopPrank();

        // Public market: bob buys the winning word and a losing word; both mint cards
        vm.warp(t0 + 250);
        assertEq(uint256(factory.phaseOf(id)), uint256(BingocleTypes.Phase.Market));
        vm.startPrank(bob);
        market.buy{value: 10 ether}(id, 0, 10 ether); // winner
        market.buy{value: 10 ether}(id, 1, 10 ether); // loser
        cards.mint(id);
        vm.stopPrank();
        vm.prank(alice);
        cards.mint(id);

        // Live: oracle validates word 0 only
        vm.warp(t0 + 350);
        assertEq(uint256(factory.phaseOf(id)), uint256(BingocleTypes.Phase.Live));
        vm.prank(oracleOp);
        oracle.commitValidation(id, 0, 9700, "the AI flagged it");
        assertTrue(oracle.isValidated(id, 0));
        assertEq(identity.agentIdOf(oracleOp), 1);

        // Settled: claims open
        vm.warp(t0 + 550);
        assertEq(uint256(factory.phaseOf(id)), uint256(BingocleTypes.Phase.Settled));

        // word0 pool = 20 ether (alice 10 + bob 10), mult 2x => owed 40 ether.
        // total deposited = 30 ether (word0 20 + word1 10) < 40 => scale < 1.
        // alice gross = 10*2 = 20 ; bob gross = 10*2 = 20 ; totalOwed = 40.
        // scale = 30/40 = 0.75 ; each gets 15 ether.
        uint256 aliceBefore = alice.balance;
        vm.prank(alice);
        market.claim(id);
        assertApproxEqAbs(alice.balance - aliceBefore, 15 ether, 1);

        uint256 bobBefore = bob.balance;
        vm.prank(bob);
        market.claim(id);
        assertApproxEqAbs(bob.balance - bobBefore, 15 ether, 1);

        // alice's founder seed on validated word0 pays from the reward pool:
        // seedUnit 1 ether * mult 2x = 2 ether.
        uint256 aliceVaultBefore = alice.balance;
        vm.prank(alice);
        vault.claim(id);
        assertGe(alice.balance - aliceVaultBefore, 2 ether);

        // double claim reverts
        vm.prank(alice);
        vm.expectRevert(WordMarket.AlreadyClaimed.selector);
        market.claim(id);

        // there ARE winners, so refundIfNoWinners reverts
        vm.prank(bob);
        vm.expectRevert(WordMarket.HasWinners.selector);
        market.refundIfNoWinners(id);

        // organizer sweeps residual: market took 30, owed 40 -> capped, residual 0.
        // (Underfunded case: nothing to sweep. Just assert it doesn't revert.)
        vm.prank(organizer);
        market.sweepResidual(id);
    }

    function test_NoWinnersRefund() public {
        uint256 id = _createEvent();
        _commitPool(id);

        vm.warp(t0 + 250); // Market
        vm.prank(alice);
        market.buy{value: 5 ether}(id, 3, 5 ether);

        // no oracle validation at all
        vm.warp(t0 + 550); // Settled
        uint256 before = alice.balance;
        vm.prank(alice);
        market.refundIfNoWinners(id);
        assertEq(alice.balance - before, 5 ether);
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
        vm.prank(alice);
        market.buy{value: 8 ether}(id, 2, 8 ether);

        // organizer cancels (before eventEnd)
        vm.prank(organizer);
        factory.cancel(id);
        assertEq(uint256(factory.phaseOf(id)), uint256(BingocleTypes.Phase.Cancelled));

        // alice refunds her stake; organizer reclaims the reward pool
        uint256 aBefore = alice.balance;
        vm.prank(alice);
        market.refund(id);
        assertEq(alice.balance - aBefore, 8 ether);

        uint256 oBefore = organizer.balance;
        vm.prank(organizer);
        vault.withdrawOnCancel(id);
        assertEq(organizer.balance - oBefore, 20 ether);
    }

    function test_FounderWindowGatesNonFounders() public {
        uint256 id = _createEvent();
        _commitPool(id);
        vm.warp(t0 + 150); // Founder window
        // bob is not the founder of word 0 -> cannot buy yet
        vm.prank(bob);
        vm.expectRevert(WordMarket.BadPhase.selector);
        market.buy{value: 1 ether}(id, 0, 1 ether);
        // alice (founder of word 0) can
        vm.prank(alice);
        market.buy{value: 1 ether}(id, 0, 1 ether);
        assertEq(market.wordPoolTotal(id, 0), 1 ether);
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
        vm.startPrank(alice);
        token.approve(address(market), 10 ether);
        market.buy(id, 0, 10 ether); // winner; no msg.value for ERC20
        vm.stopPrank();
        vm.startPrank(bob);
        token.approve(address(market), 10 ether);
        market.buy(id, 1, 10 ether); // loser, funds the winner's mult
        vm.stopPrank();
        assertEq(market.wordPoolTotal(id, 0), 10 ether);

        vm.warp(t0 + 350); // Live
        vm.prank(oracleOp);
        oracle.commitValidation(id, 0, 9000, "erc20 word");

        vm.warp(t0 + 550); // Settled — market holds 20, owes 20 (scale 1)
        uint256 before = token.balanceOf(alice);
        vm.prank(alice);
        market.claim(id); // stake 10 * mult 2x = 20 ether
        assertEq(token.balanceOf(alice) - before, 20 ether);
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
