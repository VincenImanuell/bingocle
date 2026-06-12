// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Test} from "forge-std/Test.sol";
import {StdInvariant} from "forge-std/StdInvariant.sol";
import {EventFactory} from "../src/EventFactory.sol";
import {WordPool} from "../src/WordPool.sol";
import {WordMarket} from "../src/WordMarket.sol";
import {OracleRegistry} from "../src/OracleRegistry.sol";
import {BingoCardNFT} from "../src/BingoCardNFT.sol";
import {RewardVault} from "../src/RewardVault.sol";
import {AgentIdentity} from "../src/AgentIdentity.sol";
import {BingocleTypes} from "../src/lib/BingocleTypes.sol";

/// Shared deploy + a committed event in the Market phase.
contract MarketBase is Test {
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

    function _deploy() internal {
        identity = new AgentIdentity(owner);
        factory = new EventFactory(owner);
        wordPool = new WordPool(owner, address(factory));
        market = new WordMarket(address(factory));
        oracle = new OracleRegistry(owner, address(factory));
        cards = new BingoCardNFT(address(factory));
        vault = new RewardVault(address(factory));
        factory.wireModules(
            address(wordPool), address(market), address(oracle), address(cards), address(vault), address(identity)
        );
        identity.setUpdater(address(oracle));
        identity.registerAgent(oracleOp, "ipfs://o");
        wordPool.setCurator(curator);
        t0 = uint64(block.timestamp);
    }

    function _createAndCommit() internal returns (uint256 id) {
        BingocleTypes.BonusTiers memory bonus;
        vm.prank(organizer);
        id = factory.createEvent(
            address(0), t0 + 100, t0 + 200, t0 + 300, t0 + 400, t0 + 500, 3, 25, 1 ether, bonus
        );
        uint256 n = 24;
        bytes32[] memory h = new bytes32[](n);
        uint16[] memory p = new uint16[](n);
        uint16[] memory m = new uint16[](n);
        address[] memory f = new address[](n);
        for (uint256 i = 0; i < n; i++) {
            h[i] = keccak256(abi.encodePacked("w", i));
            p[i] = 5000; // 0.5 opening price
            m[i] = 20000;
        }
        vm.prank(curator);
        wordPool.commitPool(id, h, p, m, f, bytes32(uint256(1)));
    }
}

contract MarketTest is MarketBase {
    function setUp() public {
        _deploy();
        vm.deal(alice, 1_000_000 ether);
        vm.deal(bob, 1_000_000 ether);
    }

    function _buy(uint256 id, uint256 w, address who, uint256 shares) internal returns (uint256 cost) {
        cost = market.quoteBuy(id, w, shares);
        vm.prank(who);
        market.buy{value: cost}(id, w, shares, cost);
    }

    function test_BuyRaisesPrice() public {
        uint256 id = _createAndCommit();
        vm.warp(t0 + 250); // Market
        uint256 p0 = market.spotPrice(id, 0);
        _buy(id, 0, alice, 50e18);
        uint256 p1 = market.spotPrice(id, 0);
        assertGt(p1, p0); // price rose with demand
        // a second identical buy costs strictly more than the first
        uint256 first = market.quoteBuy(id, 1, 50e18);
        _buy(id, 1, alice, 50e18);
        uint256 second = market.quoteBuy(id, 1, 50e18);
        assertGt(second, first);
    }

    function test_SellRealizesProfit() public {
        uint256 id = _createAndCommit();
        vm.warp(t0 + 250);
        // alice buys cheap at low supply
        uint256 aCost = _buy(id, 0, alice, 10e18);
        // bob pushes the price up
        _buy(id, 0, bob, 200e18);
        // alice sells her 10 shares at the now-higher price -> profit
        uint256 refund = market.quoteSell(id, 0, 10e18);
        assertGt(refund, aCost); // realized profit
        uint256 before = alice.balance;
        vm.prank(alice);
        market.sell(id, 0, 10e18, refund);
        assertEq(alice.balance - before, refund);
        assertEq(market.sharesOf(id, 0, alice), 0);
    }

    function test_MultiWordConservation() public {
        uint256 id = _createAndCommit();
        vm.warp(t0 + 250);
        // 3 words bought by alice+bob; words 0 and 2 will be validated, 1 not
        _buy(id, 0, alice, 30e18);
        _buy(id, 0, bob, 10e18);
        _buy(id, 1, bob, 40e18); // loser, funds winners
        _buy(id, 2, alice, 20e18);
        uint256 total = market.totalReserve(id);
        assertEq(address(market).balance, total); // solvency: balance == reserve

        vm.warp(t0 + 350); // Live
        vm.startPrank(oracleOp);
        oracle.commitValidation(id, 0, 9000, "w0");
        oracle.commitValidation(id, 2, 9000, "w2");
        vm.stopPrank();

        vm.warp(t0 + 550); // Settled
        market.settle(id);
        vm.prank(alice);
        uint256 aPay = market.redeem(id);
        vm.prank(bob);
        uint256 bPay = market.redeem(id);
        // sum of payouts never exceeds the frozen reserve; dust is tiny
        assertLe(aPay + bPay, total);
        assertGe(aPay + bPay, total - 8); // <= a few wei rounding dust
    }

    function test_PhaseGatingBuySell() public {
        uint256 id = _createAndCommit();
        // Submission: buy reverts
        uint256 c = market.quoteBuy(id, 0, 1e18);
        vm.prank(alice);
        vm.expectRevert(WordMarket.BadPhase.selector);
        market.buy{value: c}(id, 0, 1e18, c);
        // Live: buy + sell revert
        vm.warp(t0 + 250);
        _buy(id, 0, alice, 1e18);
        vm.warp(t0 + 350); // Live
        vm.prank(alice);
        vm.expectRevert(WordMarket.BadPhase.selector);
        market.sell(id, 0, 1e18, 0);
        // Settled: redeem requires settle (no winners here) -> NoWinners
        vm.warp(t0 + 550);
        market.settle(id);
        vm.prank(alice);
        vm.expectRevert(WordMarket.NoWinners.selector);
        market.redeem(id);
    }

    function test_SlippageGuards() public {
        uint256 id = _createAndCommit();
        vm.warp(t0 + 250);
        uint256 c = market.quoteBuy(id, 0, 50e18);
        // maxCost too low -> Slippage
        vm.prank(alice);
        vm.expectRevert(WordMarket.Slippage.selector);
        market.buy{value: c}(id, 0, 50e18, c - 1);
    }

    /// fuzz: arbitrary buy then partial sell keeps balance == totalReserve == Σ reserve.
    function testFuzz_ReserveSolvent(uint96 buyShares, uint96 sellShares) public {
        uint256 id = _createAndCommit();
        vm.warp(t0 + 250);
        uint256 b = bound(uint256(buyShares), 1e12, 500e18);
        uint256 cost = market.quoteBuy(id, 5, b);
        vm.prank(alice);
        market.buy{value: cost}(id, 5, b, cost);
        uint256 s = bound(uint256(sellShares), 0, b);
        if (s > 0) {
            vm.prank(alice);
            market.sell(id, 5, s, 0);
        }
        assertEq(address(market).balance, market.totalReserve(id));
        assertEq(market.totalReserve(id), market.reserve(id, 5));
    }
}

/// Stateful invariant: random buy/sell across words must always keep
/// market balance == totalReserve == Σ reserve (the solvency invariant).
contract MarketInvariantTest is StdInvariant, MarketBase {
    MarketHandler handler;
    uint256 id;

    function setUp() public {
        _deploy();
        id = _createAndCommit();
        vm.warp(t0 + 250); // Market phase (trading open)
        handler = new MarketHandler(market, id);
        vm.deal(address(handler), 1_000_000 ether);
        targetContract(address(handler));
    }

    function invariant_balanceEqualsReserve() public view {
        uint256 sum;
        for (uint256 w = 0; w < 24; w++) sum += market.reserve(id, w);
        assertEq(market.totalReserve(id), sum);
        assertEq(address(market).balance, market.totalReserve(id));
    }
}

contract MarketHandler is Test {
    WordMarket market;
    uint256 id;

    constructor(WordMarket m, uint256 id_) {
        market = m;
        id = id_;
    }

    receive() external payable {}

    function buy(uint256 wordSeed, uint256 shareSeed) public {
        uint256 w = wordSeed % 24;
        uint256 shares = bound(shareSeed, 1e12, 200e18);
        if (market.supply(id, w) + shares > 1e30) return;
        uint256 cost = market.quoteBuy(id, w, shares);
        if (cost > address(this).balance) return;
        market.buy{value: cost}(id, w, shares, cost);
    }

    function sell(uint256 wordSeed, uint256 shareSeed) public {
        uint256 w = wordSeed % 24;
        uint256 held = market.sharesOf(id, w, address(this));
        if (held == 0) return;
        uint256 shares = bound(shareSeed, 1, held);
        market.sell(id, w, shares, 0);
    }
}
