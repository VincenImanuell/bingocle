// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {BingocleTypes} from "./lib/BingocleTypes.sol";
import {IEventFactory, IWordPool, IOracleRegistry, IWordMarket, SCALE} from "./interfaces/IBingocle.sol";

/// @title WordMarket (dynamic-parimutuel curve market)
/// @notice Each word is an independent tradable outcome. Buying mints shares along a
///         linear bonding curve `price = base + slope·supply`, so the price RISES with
///         demand; selling burns shares and refunds the exact curve area vacated —
///         so an early buyer profits when later buyers push the price up. At
///         settlement, every validated word's holders split that word's reserve PLUS a
///         pro-rata cut of the losing words' reserves; the sum of all payouts equals the
///         total reserve exactly (minus rounding dust), so the market is always solvent.
/// @dev Reserve_w == area under word w's curve == base·S/ONE + slope·S²/(2·ONE²), which
///      is path-independent: the contract's balance for an event always equals
///      totalReserve == Σ reserve_w. (Design chosen by an adversarial judge-panel.)
contract WordMarket is IWordMarket, ReentrancyGuard {
    using SafeERC20 for IERC20;

    uint256 internal constant ONE = 1e18; // fixed-point for shares / price / reserve
    uint256 internal constant PRICE_UP = 1e14; // lift WordPool 1e4 price -> 1e18
    uint256 internal constant MAX_SUPPLY = 1e30; // per-word supply cap (overflow guard)
    uint256 internal constant TARGET_SHARES = 1000e18; // price ~doubles after this many shares
    uint256 public constant CLAIM_GRACE = 30 days;

    IEventFactory public immutable factory;

    // --- curve / trading state (event => word => ...) ---
    mapping(uint256 => mapping(uint256 => uint256)) public supply; // shares outstanding (1e18)
    mapping(uint256 => mapping(uint256 => mapping(address => uint256))) private _shares;
    mapping(uint256 => mapping(uint256 => uint256)) public reserve; // token held == curve area
    mapping(uint256 => uint256) public totalReserve; // event => Σ reserve_w == token held for event
    mapping(uint256 => mapping(uint256 => uint256)) public base; // frozen at first touch (1e18)
    mapping(uint256 => mapping(uint256 => uint256)) public slope; // frozen at first touch (1e18)
    mapping(uint256 => mapping(uint256 => bool)) public curveInit;

    // --- founder free-seed rail (sponsor-funded via RewardVault; unchanged) ---
    mapping(uint256 => mapping(uint256 => mapping(address => bool))) private _founderSeed;

    // --- settlement (frozen at settle) ---
    mapping(uint256 => bool) public settled;
    mapping(uint256 => uint256) public freedPool; // Σ losing-word reserves (the prize)
    mapping(uint256 => uint256) public winnerReserveSum; // Σ validated-word reserves (denominator)
    mapping(uint256 => bool) public noWinners;
    mapping(uint256 => mapping(address => bool)) public claimed;

    event Bought(uint256 indexed eventId, uint256 indexed word, address indexed buyer, uint256 shares, uint256 cost);
    event Sold(uint256 indexed eventId, uint256 indexed word, address indexed seller, uint256 shares, uint256 refund);
    event FounderSeedClaimed(uint256 indexed eventId, uint256 indexed word, address indexed founder);
    event Settled(uint256 indexed eventId, uint256 winnerReserveSum, uint256 freedPool);
    event Redeemed(uint256 indexed eventId, address indexed user, uint256 payout);
    event Refunded(uint256 indexed eventId, address indexed user, uint256 amount);
    event ResidualSwept(uint256 indexed eventId, address indexed organizer, uint256 amount);

    error NotExist();
    error NotCommitted();
    error BadWord();
    error BadPhase();
    error ZeroAmount();
    error WrongValue();
    error NotFounder();
    error SeedTaken();
    error Slippage();
    error Insufficient();
    error NotSettled();
    error NotCancelled();
    error AlreadyClaimed();
    error NothingToClaim();
    error HasWinners();
    error NoWinners();
    error NotOrganizer();
    error AlreadySwept();
    error GraceNotPassed();
    error CapExceeded();

    constructor(address factory_) {
        factory = IEventFactory(factory_);
    }

    function _pool() internal view returns (IWordPool) {
        return IWordPool(factory.wordPool());
    }

    function _oracle() internal view returns (IOracleRegistry) {
        return IOracleRegistry(factory.oracleRegistry());
    }

    // --- curve math ---

    function _ensureCurve(uint256 eventId, uint256 w) internal {
        if (curveInit[eventId][w]) return;
        uint256 b = _pool().priceOf(eventId, w) * PRICE_UP; // 1e4 -> 1e18
        uint256 s = Math.mulDiv(b, ONE, TARGET_SHARES); // slope so price ~doubles at TARGET_SHARES
        if (s == 0) s = 1;
        base[eventId][w] = b;
        slope[eventId][w] = s;
        curveInit[eventId][w] = true;
    }

    /// @dev Cost to move supply from s0 to s1 (s1 >= s0): ∫ (base + slope·s/ONE) ds / ONE.
    function _cost(uint256 b, uint256 s, uint256 s0, uint256 s1) internal pure returns (uint256) {
        uint256 dq = s1 - s0;
        uint256 linear = Math.mulDiv(b, dq, ONE);
        // slope term = slope·(s1+s0)·(s1-s0) / (2·ONE²); factored difference-of-squares, overflow-safe
        uint256 quad = Math.mulDiv(Math.mulDiv(s, s1 + s0, ONE), dq, 2 * ONE);
        return linear + quad;
    }

    // --- trading ---

    /// @notice Buy `sharesOut` shares of word `w`; pays the curve cost (capped by maxCost).
    function buy(uint256 eventId, uint256 w, uint256 sharesOut, uint256 maxCost)
        external
        payable
        nonReentrant
        returns (uint256 cost)
    {
        if (!factory.exists(eventId)) revert NotExist();
        IWordPool pool = _pool();
        if (!pool.isCommitted(eventId)) revert NotCommitted();
        if (w >= pool.wordCount(eventId)) revert BadWord();
        if (sharesOut == 0) revert ZeroAmount();

        BingocleTypes.Phase phase = factory.phaseOf(eventId);
        BingocleTypes.EventConfig memory c = factory.getConfig(eventId);
        if (phase == BingocleTypes.Phase.Founder) {
            // founder window: only that word's founder may buy (cheapest, earliest entry)
            if (pool.founderOf(eventId, w) != msg.sender) revert BadPhase();
        } else if (phase != BingocleTypes.Phase.Market) {
            revert BadPhase();
        }

        _ensureCurve(eventId, w);
        uint256 s = supply[eventId][w];
        if (s + sharesOut > MAX_SUPPLY) revert CapExceeded();
        cost = _cost(base[eventId][w], slope[eventId][w], s, s + sharesOut);
        if (cost > maxCost) revert Slippage();

        // collect exact cost (fee-on-transfer would break the reserve==area invariant)
        if (c.token == address(0)) {
            if (msg.value != cost) revert WrongValue();
        } else {
            if (msg.value != 0) revert WrongValue();
            uint256 bal = IERC20(c.token).balanceOf(address(this));
            IERC20(c.token).safeTransferFrom(msg.sender, address(this), cost);
            if (IERC20(c.token).balanceOf(address(this)) - bal != cost) revert WrongValue();
        }

        supply[eventId][w] = s + sharesOut;
        _shares[eventId][w][msg.sender] += sharesOut;
        reserve[eventId][w] += cost;
        totalReserve[eventId] += cost;
        emit Bought(eventId, w, msg.sender, sharesOut, cost);
    }

    /// @notice Sell `sharesIn` shares of word `w` back to the curve before lock; refunds
    ///         the exact area vacated (your realized profit/loss vs entry).
    function sell(uint256 eventId, uint256 w, uint256 sharesIn, uint256 minRefund)
        external
        nonReentrant
        returns (uint256 refundAmt)
    {
        if (!factory.exists(eventId)) revert NotExist();
        BingocleTypes.Phase phase = factory.phaseOf(eventId);
        if (phase != BingocleTypes.Phase.Founder && phase != BingocleTypes.Phase.Market) revert BadPhase();
        if (sharesIn == 0) revert ZeroAmount();
        if (_shares[eventId][w][msg.sender] < sharesIn) revert Insufficient();

        uint256 s = supply[eventId][w];
        refundAmt = _cost(base[eventId][w], slope[eventId][w], s - sharesIn, s);
        if (refundAmt > reserve[eventId][w]) refundAmt = reserve[eventId][w]; // invariant guard
        if (refundAmt < minRefund) revert Slippage();

        supply[eventId][w] = s - sharesIn;
        _shares[eventId][w][msg.sender] -= sharesIn;
        reserve[eventId][w] -= refundAmt;
        totalReserve[eventId] -= refundAmt;
        _pay(factory.getConfig(eventId).token, msg.sender, refundAmt);
        emit Sold(eventId, w, msg.sender, sharesIn, refundAmt);
    }

    /// @notice A word's founder records their free seed (sponsor-funded by RewardVault).
    function claimFounderSeed(uint256 eventId, uint256 w) external {
        if (!factory.exists(eventId)) revert NotExist();
        IWordPool pool = _pool();
        if (!pool.isCommitted(eventId)) revert NotCommitted();
        if (pool.founderOf(eventId, w) != msg.sender) revert NotFounder();
        BingocleTypes.Phase phase = factory.phaseOf(eventId);
        if (phase != BingocleTypes.Phase.Founder && phase != BingocleTypes.Phase.Market) revert BadPhase();
        if (_founderSeed[eventId][w][msg.sender]) revert SeedTaken();
        _founderSeed[eventId][w][msg.sender] = true;
        emit FounderSeedClaimed(eventId, w, msg.sender);
    }

    // --- settlement ---

    /// @notice Freeze the winner/loser split once the dispute window has closed.
    function settle(uint256 eventId) public {
        if (factory.phaseOf(eventId) != BingocleTypes.Phase.Settled) revert NotSettled();
        if (settled[eventId]) return;
        IWordPool pool = _pool();
        uint256 n = pool.wordCount(eventId);
        uint256 bitmap = _oracle().validatedBitmap(eventId);
        uint256 winners;
        uint256 freed;
        for (uint256 w = 0; w < n; w++) {
            uint256 r = reserve[eventId][w];
            if (bitmap & (uint256(1) << w) != 0) winners += r;
            else freed += r;
        }
        winnerReserveSum[eventId] = winners;
        freedPool[eventId] = freed;
        noWinners[eventId] = winners == 0;
        settled[eventId] = true;
        emit Settled(eventId, winners, freed);
    }

    /// @notice Redeem your share of every validated word (its reserve + a pro-rata cut of
    ///         the losing words' reserves). Losing-word shares pay nothing.
    function redeem(uint256 eventId) external nonReentrant returns (uint256 payout) {
        if (factory.phaseOf(eventId) != BingocleTypes.Phase.Settled) revert NotSettled();
        if (!settled[eventId]) settle(eventId);
        if (noWinners[eventId]) revert NoWinners();
        if (claimed[eventId][msg.sender]) revert AlreadyClaimed();
        if (residualSwept[eventId]) revert AlreadySwept(); // explicit, not an opaque underflow

        IWordPool pool = _pool();
        uint256 n = pool.wordCount(eventId);
        uint256 bitmap = _oracle().validatedBitmap(eventId);
        uint256 wsum = winnerReserveSum[eventId];
        uint256 freed = freedPool[eventId];

        for (uint256 w = 0; w < n; w++) {
            if (bitmap & (uint256(1) << w) == 0) continue;
            uint256 sh = _shares[eventId][w][msg.sender];
            if (sh == 0) continue;
            uint256 r = reserve[eventId][w];
            uint256 poolW = r + Math.mulDiv(freed, r, wsum); // this word's reserve + its cut of losers
            payout += Math.mulDiv(poolW, sh, supply[eventId][w]); // user's pro-rata of the word
        }
        if (payout == 0) revert NothingToClaim();

        claimed[eventId][msg.sender] = true; // effects before interaction
        totalReserve[eventId] -= payout;
        _pay(factory.getConfig(eventId).token, msg.sender, payout);
        emit Redeemed(eventId, msg.sender, payout);
    }

    /// @notice If NO word was validated, every holder reclaims their own reserve share.
    function refundNoWinners(uint256 eventId) external nonReentrant returns (uint256 amount) {
        if (factory.phaseOf(eventId) != BingocleTypes.Phase.Settled) revert NotSettled();
        if (!settled[eventId]) settle(eventId);
        if (!noWinners[eventId]) revert HasWinners();
        amount = _ownReserveShare(eventId, msg.sender);
        emit Refunded(eventId, msg.sender, amount);
    }

    /// @notice If the organizer cancelled, reclaim your reserve share at the frozen supply.
    function refund(uint256 eventId) external nonReentrant returns (uint256 amount) {
        if (factory.phaseOf(eventId) != BingocleTypes.Phase.Cancelled) revert NotCancelled();
        amount = _ownReserveShare(eventId, msg.sender);
        emit Refunded(eventId, msg.sender, amount);
    }

    function _ownReserveShare(uint256 eventId, address user) internal returns (uint256 amount) {
        if (claimed[eventId][user]) revert AlreadyClaimed();
        if (residualSwept[eventId]) revert AlreadySwept(); // explicit, not an opaque underflow
        IWordPool pool = _pool();
        uint256 n = pool.wordCount(eventId);
        for (uint256 w = 0; w < n; w++) {
            uint256 sh = _shares[eventId][w][user];
            uint256 sup = supply[eventId][w];
            if (sh != 0 && sup != 0) amount += Math.mulDiv(reserve[eventId][w], sh, sup);
        }
        if (amount == 0) revert NothingToClaim();
        claimed[eventId][user] = true;
        totalReserve[eventId] -= amount;
        _pay(factory.getConfig(eventId).token, user, amount);
    }

    /// @notice After a long grace past settlement, the organizer sweeps the unclaimed
    ///         remainder (rounding dust + abandoned positions).
    function sweepResidual(uint256 eventId) external nonReentrant returns (uint256 dust) {
        if (factory.phaseOf(eventId) != BingocleTypes.Phase.Settled) revert NotSettled();
        if (!factory.isOrganizer(eventId, msg.sender)) revert NotOrganizer();
        if (block.timestamp < factory.getConfig(eventId).disputeEnd + CLAIM_GRACE) revert GraceNotPassed();
        if (residualSwept[eventId]) revert AlreadySwept();
        residualSwept[eventId] = true;
        dust = totalReserve[eventId];
        if (dust == 0) revert NothingToClaim();
        totalReserve[eventId] = 0;
        _pay(factory.getConfig(eventId).token, msg.sender, dust);
        emit ResidualSwept(eventId, msg.sender, dust);
    }

    mapping(uint256 => bool) public residualSwept;

    // --- fund movement ---

    function _pay(address token, address to, uint256 amount) internal {
        if (amount == 0) return;
        if (token == address(0)) {
            (bool ok,) = payable(to).call{value: amount}("");
            require(ok, "native transfer failed");
        } else {
            IERC20(token).safeTransfer(to, amount);
        }
    }

    // --- views ---

    function quoteBuy(uint256 eventId, uint256 w, uint256 sharesOut) external view returns (uint256) {
        (uint256 b, uint256 s) = _curveParams(eventId, w);
        uint256 sup = supply[eventId][w];
        return _cost(b, s, sup, sup + sharesOut);
    }

    function quoteSell(uint256 eventId, uint256 w, uint256 sharesIn) external view returns (uint256) {
        (uint256 b, uint256 s) = _curveParams(eventId, w);
        uint256 sup = supply[eventId][w];
        if (sharesIn > sup) sharesIn = sup;
        uint256 r = _cost(b, s, sup - sharesIn, sup);
        uint256 res = reserve[eventId][w];
        return r > res ? res : r;
    }

    function spotPrice(uint256 eventId, uint256 w) external view returns (uint256) {
        (uint256 b, uint256 s) = _curveParams(eventId, w);
        return b + Math.mulDiv(s, supply[eventId][w], ONE);
    }

    function sharesOf(uint256 eventId, uint256 w, address user) external view returns (uint256) {
        return _shares[eventId][w][user];
    }

    function hasFounderSeed(uint256 eventId, uint256 w, address user) external view returns (bool) {
        return _founderSeed[eventId][w][user];
    }

    /// @notice Preview a user's redeemable payout (computed live from the current bitmap).
    /// @dev Note: per-word reserve[] is intentionally frozen at settlement and NOT
    ///      decremented on redeem/refund (only totalReserve is), so post-settlement only
    ///      `balance == totalReserve` holds, not `totalReserve == Σ reserve`.
    function previewRedeem(uint256 eventId, address user) external view returns (uint256 payout) {
        if (claimed[eventId][user] || residualSwept[eventId]) return 0; // matches what redeem would pay
        IWordPool pool = _pool();
        uint256 n = pool.wordCount(eventId);
        uint256 bitmap = _oracle().validatedBitmap(eventId);
        uint256 wsum;
        uint256 freed;
        for (uint256 w = 0; w < n; w++) {
            if (bitmap & (uint256(1) << w) != 0) wsum += reserve[eventId][w];
            else freed += reserve[eventId][w];
        }
        if (wsum == 0) return _ownReserveShareView(eventId, user); // no-winners refund preview
        for (uint256 w = 0; w < n; w++) {
            if (bitmap & (uint256(1) << w) == 0) continue;
            uint256 sh = _shares[eventId][w][user];
            if (sh == 0) continue;
            uint256 r = reserve[eventId][w];
            uint256 poolW = r + Math.mulDiv(freed, r, wsum);
            payout += Math.mulDiv(poolW, sh, supply[eventId][w]);
        }
    }

    function _ownReserveShareView(uint256 eventId, address user) internal view returns (uint256 amount) {
        uint256 n = _pool().wordCount(eventId);
        for (uint256 w = 0; w < n; w++) {
            uint256 sh = _shares[eventId][w][user];
            uint256 sup = supply[eventId][w];
            if (sh != 0 && sup != 0) amount += Math.mulDiv(reserve[eventId][w], sh, sup);
        }
    }

    /// @dev Curve params for a word: frozen if touched, else the opening values.
    function _curveParams(uint256 eventId, uint256 w) internal view returns (uint256 b, uint256 s) {
        if (curveInit[eventId][w]) return (base[eventId][w], slope[eventId][w]);
        b = _pool().priceOf(eventId, w) * PRICE_UP;
        s = Math.mulDiv(b, ONE, TARGET_SHARES);
        if (s == 0) s = 1;
    }
}
