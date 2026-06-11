// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {BingocleTypes} from "./lib/BingocleTypes.sol";
import {IEventFactory, IWordPool, IOracleRegistry, IWordMarket, SCALE} from "./interfaces/IBingocle.sol";

/// @title WordMarket
/// @notice Buy-only parimutuel market on the curated words, plus the bought-prediction
///         payout rail. Buyers stake MNT/USDC on words; a winning word pays
///         `stake * mult`, funded from the whole event's stakes (losers fund winners).
///         A global solvency scale, fixed at settlement, guarantees the contract never
///         owes more than it holds.
contract WordMarket is IWordMarket, ReentrancyGuard {
    using SafeERC20 for IERC20;

    uint256 internal constant ONE = 1e18; // fixed-point for payoutScale

    IEventFactory public immutable factory;

    mapping(uint256 => mapping(uint256 => mapping(address => uint256))) private _stake; // event=>word=>user
    mapping(uint256 => mapping(uint256 => uint256)) private _poolTotal; // event=>word
    mapping(uint256 => uint256) public totalDeposited; // event => sum of all buys
    mapping(uint256 => mapping(address => uint256)) public userDeposited; // event=>user (for refunds)
    mapping(uint256 => mapping(uint256 => mapping(address => bool))) private _founderSeed; // event=>word=>user

    mapping(uint256 => bool) public finalized;
    mapping(uint256 => uint256) public payoutScale; // 1e18 == 100% ; <1e18 => pro-rata
    mapping(uint256 => uint256) public winnerOwed; // total owed to winners, fixed at finalize
    mapping(uint256 => bool) public residualSwept; // loser-funded residual claimed by organizer
    mapping(uint256 => mapping(address => bool)) public claimed;

    event Bought(uint256 indexed eventId, uint256 indexed wordIndex, address indexed buyer, uint256 amount);
    event FounderSeedClaimed(uint256 indexed eventId, uint256 indexed wordIndex, address indexed founder);
    event Finalized(uint256 indexed eventId, uint256 totalOwed, uint256 balance, uint256 scale);
    event PredictionClaimed(uint256 indexed eventId, address indexed user, uint256 payout);
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
    error NotCancelled();
    error AlreadyClaimed();
    error NotSettled();
    error NothingToClaim();
    error HasWinners();
    error NoWinners();
    error NotOrganizer();
    error AlreadySwept();

    constructor(address factory_) {
        factory = IEventFactory(factory_);
    }

    function _pool() internal view returns (IWordPool) {
        return IWordPool(factory.wordPool());
    }

    function _oracle() internal view returns (IOracleRegistry) {
        return IOracleRegistry(factory.oracleRegistry());
    }

    /// @notice Stake `amount` on a word. Native value if token==address(0), else ERC20.
    function buy(uint256 eventId, uint256 wordIndex, uint256 amount) external payable nonReentrant {
        if (!factory.exists(eventId)) revert NotExist();
        IWordPool pool = _pool();
        if (!pool.isCommitted(eventId)) revert NotCommitted();
        if (wordIndex >= pool.wordCount(eventId)) revert BadWord();
        if (amount == 0) revert ZeroAmount();

        BingocleTypes.Phase phase = factory.phaseOf(eventId);
        BingocleTypes.EventConfig memory c = factory.getConfig(eventId);
        // Founder window: only that word's founder may buy (cheapest, early entry).
        // Public market: anyone may buy.
        if (phase == BingocleTypes.Phase.Founder) {
            if (pool.founderOf(eventId, wordIndex) != msg.sender) revert BadPhase();
        } else if (phase != BingocleTypes.Phase.Market) {
            revert BadPhase();
        }

        // Credit the amount actually received (fee-on-transfer tokens deliver less).
        uint256 received = _collect(c.token, amount);

        _stake[eventId][wordIndex][msg.sender] += received;
        _poolTotal[eventId][wordIndex] += received;
        totalDeposited[eventId] += received;
        userDeposited[eventId][msg.sender] += received;
        emit Bought(eventId, wordIndex, msg.sender, received);
    }

    /// @notice A word's founder records their free seed (a notional stake paid by the
    ///         sponsor pool in RewardVault, never from buyers' funds). One per word.
    function claimFounderSeed(uint256 eventId, uint256 wordIndex) external {
        if (!factory.exists(eventId)) revert NotExist();
        IWordPool pool = _pool();
        if (!pool.isCommitted(eventId)) revert NotCommitted();
        if (pool.founderOf(eventId, wordIndex) != msg.sender) revert NotFounder();
        BingocleTypes.Phase phase = factory.phaseOf(eventId);
        if (phase != BingocleTypes.Phase.Founder && phase != BingocleTypes.Phase.Market) revert BadPhase();
        if (_founderSeed[eventId][wordIndex][msg.sender]) revert SeedTaken();
        _founderSeed[eventId][wordIndex][msg.sender] = true;
        emit FounderSeedClaimed(eventId, wordIndex, msg.sender);
    }

    /// @notice Fix the global payout scale once the dispute window has closed.
    function finalize(uint256 eventId) public {
        if (factory.phaseOf(eventId) != BingocleTypes.Phase.Settled) revert NotSettled();
        if (finalized[eventId]) return;
        uint256 owed = _totalOwed(eventId);
        uint256 bal = totalDeposited[eventId];
        uint256 scale = owed == 0 ? ONE : (bal >= owed ? ONE : (bal * ONE) / owed);
        finalized[eventId] = true;
        payoutScale[eventId] = scale;
        winnerOwed[eventId] = owed;
        emit Finalized(eventId, owed, bal, scale);
    }

    /// @notice Claim bought-prediction rewards for every validated word you staked on.
    function claim(uint256 eventId) external nonReentrant {
        if (factory.phaseOf(eventId) != BingocleTypes.Phase.Settled) revert NotSettled();
        if (!finalized[eventId]) finalize(eventId);
        if (claimed[eventId][msg.sender]) revert AlreadyClaimed();

        uint256 gross = _grossOwedTo(eventId, msg.sender);
        if (gross == 0) revert NothingToClaim();
        uint256 payout = (gross * payoutScale[eventId]) / ONE;

        // Mark claimed even if rounding leaves a dust-zero payout, so the caller
        // can't loop on a position that will always pay 0.
        claimed[eventId][msg.sender] = true; // effects before interaction
        if (payout != 0) _pay(factory.getConfig(eventId).token, msg.sender, payout);
        emit PredictionClaimed(eventId, msg.sender, payout);
    }

    /// @notice If settlement produced NO winners, stakes are refunded in full
    ///         (otherwise they would be trapped — claim needs a winning word and
    ///         refund() needs a cancellation).
    function refundIfNoWinners(uint256 eventId) external nonReentrant {
        if (factory.phaseOf(eventId) != BingocleTypes.Phase.Settled) revert NotSettled();
        if (!finalized[eventId]) finalize(eventId);
        if (winnerOwed[eventId] != 0) revert HasWinners();
        if (claimed[eventId][msg.sender]) revert AlreadyClaimed();
        uint256 amount = userDeposited[eventId][msg.sender];
        if (amount == 0) revert NothingToClaim();
        claimed[eventId][msg.sender] = true;
        _pay(factory.getConfig(eventId).token, msg.sender, amount);
        emit Refunded(eventId, msg.sender, amount);
    }

    /// @notice Organizer sweeps the loser-funded residual (totalDeposited - winnerOwed)
    ///         once settled. This never touches winners' liabilities; it is the house
    ///         take when winners exist. Use refundIfNoWinners when there are none.
    function sweepResidual(uint256 eventId) external nonReentrant {
        if (factory.phaseOf(eventId) != BingocleTypes.Phase.Settled) revert NotSettled();
        if (!factory.isOrganizer(eventId, msg.sender)) revert NotOrganizer();
        if (!finalized[eventId]) finalize(eventId);
        if (winnerOwed[eventId] == 0) revert NoWinners();
        if (residualSwept[eventId]) revert AlreadySwept();
        uint256 owed = winnerOwed[eventId];
        uint256 bal = totalDeposited[eventId];
        uint256 residual = bal > owed ? bal - owed : 0;
        residualSwept[eventId] = true;
        if (residual != 0) _pay(factory.getConfig(eventId).token, msg.sender, residual);
        emit ResidualSwept(eventId, msg.sender, residual);
    }

    /// @notice If the organizer cancelled, refund the caller's full stake.
    function refund(uint256 eventId) external nonReentrant {
        if (factory.phaseOf(eventId) != BingocleTypes.Phase.Cancelled) revert NotCancelled();
        if (claimed[eventId][msg.sender]) revert AlreadyClaimed();
        uint256 amount = userDeposited[eventId][msg.sender];
        if (amount == 0) revert NothingToClaim();
        claimed[eventId][msg.sender] = true;
        _pay(factory.getConfig(eventId).token, msg.sender, amount);
        emit Refunded(eventId, msg.sender, amount);
    }

    // --- internal math ---

    /// @dev Sum over validated words of poolTotal * mult / SCALE.
    function _totalOwed(uint256 eventId) internal view returns (uint256 owed) {
        IWordPool pool = _pool();
        uint256 n = pool.wordCount(eventId);
        uint256 bitmap = _oracle().validatedBitmap(eventId);
        for (uint256 w = 0; w < n; w++) {
            if (bitmap & (uint256(1) << w) != 0) {
                owed += (_poolTotal[eventId][w] * pool.multOf(eventId, w)) / SCALE;
            }
        }
    }

    /// @dev Caller's gross (pre-scale) winnings across validated words.
    function _grossOwedTo(uint256 eventId, address user) internal view returns (uint256 gross) {
        IWordPool pool = _pool();
        uint256 n = pool.wordCount(eventId);
        uint256 bitmap = _oracle().validatedBitmap(eventId);
        for (uint256 w = 0; w < n; w++) {
            if (bitmap & (uint256(1) << w) != 0) {
                uint256 s = _stake[eventId][w][user];
                if (s != 0) gross += (s * pool.multOf(eventId, w)) / SCALE;
            }
        }
    }

    // --- fund movement ---

    /// @return received the actual amount credited (measured for ERC20 so
    ///         fee-on-transfer tokens can't overstate balances).
    function _collect(address token, uint256 amount) internal returns (uint256 received) {
        if (token == address(0)) {
            if (msg.value != amount) revert WrongValue();
            return amount;
        }
        if (msg.value != 0) revert WrongValue();
        uint256 before = IERC20(token).balanceOf(address(this));
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        return IERC20(token).balanceOf(address(this)) - before;
    }

    function _pay(address token, address to, uint256 amount) internal {
        if (token == address(0)) {
            (bool ok,) = payable(to).call{value: amount}("");
            require(ok, "native transfer failed");
        } else {
            IERC20(token).safeTransfer(to, amount);
        }
    }

    // --- views ---

    function stakeOf(uint256 eventId, uint256 wordIndex, address user) external view returns (uint256) {
        return _stake[eventId][wordIndex][user];
    }

    function wordPoolTotal(uint256 eventId, uint256 wordIndex) external view returns (uint256) {
        return _poolTotal[eventId][wordIndex];
    }

    function hasFounderSeed(uint256 eventId, uint256 wordIndex, address user) external view returns (bool) {
        return _founderSeed[eventId][wordIndex][user];
    }

    /// @notice Preview the caller's claimable prediction payout (post-scale once finalized).
    function previewClaim(uint256 eventId, address user) external view returns (uint256) {
        uint256 gross = _grossOwedTo(eventId, user);
        uint256 scale = finalized[eventId] ? payoutScale[eventId] : ONE;
        return (gross * scale) / ONE;
    }
}
