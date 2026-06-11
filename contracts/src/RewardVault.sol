// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {BingocleTypes} from "./lib/BingocleTypes.sol";
import {BingoLib} from "./lib/BingoLib.sol";
import {
    IEventFactory,
    IWordPool,
    IWordMarket,
    IOracleRegistry,
    IBingoCardNFT,
    SCALE
} from "./interfaces/IBingocle.sol";

/// @title RewardVault
/// @notice Custodian of the organizer/sponsor reward pool. Pays the two pool-funded
///         rails at settlement: (1) tiered, stackable bingo bonuses from a player's card,
///         and (2) founder free-seed payouts (sponsor-funded, never from buyers' stakes).
///         Bought-prediction payouts are the separate WordMarket rail.
contract RewardVault is ReentrancyGuard {
    using SafeERC20 for IERC20;

    IEventFactory public immutable factory;

    /// @dev How long after the dispute window winners can still claim before the
    ///      organizer may reclaim the unclaimed remainder.
    uint256 public constant CLAIM_GRACE = 30 days;

    mapping(uint256 => uint256) public poolBalance; // event => sponsor/reward pool balance
    mapping(uint256 => mapping(address => uint8)) public claimedTiers; // event => user => bonus tier bitmask paid
    mapping(uint256 => mapping(uint256 => mapping(address => bool))) public seedPaid; // event=>word=>founder

    event Funded(uint256 indexed eventId, address indexed from, uint256 amount);
    event Claimed(uint256 indexed eventId, address indexed user, uint256 bonus, uint256 seed);
    event PoolWithdrawn(uint256 indexed eventId, address indexed organizer, uint256 amount);

    error NotExist();
    error WrongValue();
    error AfterSettlement();
    error NotSettled();
    error NotCancelled();
    error NotOrganizer();
    error NothingToClaim();
    error PoolUnderfunded();
    error ClaimWindowOpen();

    constructor(address factory_) {
        factory = IEventFactory(factory_);
    }

    /// @notice Fund an event's reward/sponsor pool (organizer or any sponsor).
    /// @dev Allowed only before the event goes Live (Submission/Founder/Market), so funds
    ///      can't be stranded by depositing after settlement or into a cancelled event.
    function fund(uint256 eventId, uint256 amount) external payable {
        if (!factory.exists(eventId)) revert NotExist();
        BingocleTypes.Phase phase = factory.phaseOf(eventId);
        if (
            phase != BingocleTypes.Phase.Submission && phase != BingocleTypes.Phase.Founder
                && phase != BingocleTypes.Phase.Market
        ) revert AfterSettlement();
        address token = factory.getConfig(eventId).token;
        uint256 received = amount;
        if (token == address(0)) {
            if (msg.value != amount) revert WrongValue();
        } else {
            if (msg.value != 0) revert WrongValue();
            uint256 before = IERC20(token).balanceOf(address(this));
            IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
            received = IERC20(token).balanceOf(address(this)) - before; // fee-on-transfer safe
        }
        poolBalance[eventId] += received;
        emit Funded(eventId, msg.sender, received);
    }

    /// @notice Claim pool-funded rewards: bingo bonuses + founder seed payouts.
    function claim(uint256 eventId) external nonReentrant {
        if (factory.phaseOf(eventId) != BingocleTypes.Phase.Settled) revert NotSettled();

        (uint256 bonus, uint8 newTiers) = _bonusOwed(eventId, msg.sender);
        uint256 seed = _seedOwed(eventId, msg.sender);
        uint256 total = bonus + seed;
        if (total == 0) revert NothingToClaim();
        if (poolBalance[eventId] < total) revert PoolUnderfunded();

        // effects
        if (newTiers != 0) claimedTiers[eventId][msg.sender] |= newTiers;
        _markSeeds(eventId, msg.sender);
        poolBalance[eventId] -= total;

        // interaction
        _pay(factory.getConfig(eventId).token, msg.sender, total);
        emit Claimed(eventId, msg.sender, bonus, seed);
    }

    /// @notice After a long grace period past settlement, the organizer reclaims any
    ///         reward pool that nobody claimed. The grace window keeps the claim path
    ///         open for legitimate winners well after the event.
    function withdrawResidual(uint256 eventId) external nonReentrant {
        if (factory.phaseOf(eventId) != BingocleTypes.Phase.Settled) revert NotSettled();
        if (!factory.isOrganizer(eventId, msg.sender)) revert NotOrganizer();
        if (block.timestamp < factory.getConfig(eventId).disputeEnd + CLAIM_GRACE) revert ClaimWindowOpen();
        uint256 amount = poolBalance[eventId];
        if (amount == 0) revert NothingToClaim();
        poolBalance[eventId] = 0;
        _pay(factory.getConfig(eventId).token, msg.sender, amount);
        emit PoolWithdrawn(eventId, msg.sender, amount);
    }

    /// @notice On cancellation, the organizer reclaims the unspent reward pool.
    function withdrawOnCancel(uint256 eventId) external nonReentrant {
        if (factory.phaseOf(eventId) != BingocleTypes.Phase.Cancelled) revert NotCancelled();
        if (!factory.isOrganizer(eventId, msg.sender)) revert NotOrganizer();
        uint256 amount = poolBalance[eventId];
        if (amount == 0) revert NothingToClaim();
        poolBalance[eventId] = 0;
        _pay(factory.getConfig(eventId).token, msg.sender, amount);
        emit PoolWithdrawn(eventId, msg.sender, amount);
    }

    // --- internal computation ---

    /// @dev Newly-earned (unpaid) bingo bonus for `user`, and the tier bitmask to mark.
    function _bonusOwed(uint256 eventId, address user) internal view returns (uint256 amount, uint8 newTiers) {
        IBingoCardNFT cards = IBingoCardNFT(factory.cardNFT());
        if (!cards.hasCard(eventId, user)) return (0, 0);
        uint256 tokenId = cards.cardOf(eventId, user);
        uint32 marked = cards.markedMask(tokenId);
        uint8 earned = BingoLib.earnedTiers(marked);
        newTiers = earned & ~claimedTiers[eventId][user];
        if (newTiers == 0) return (0, 0);
        amount = BingoLib.bonusAmount(newTiers, factory.getConfig(eventId).bonus);
    }

    /// @dev Founder free-seed payout: for each validated word the user founded + seeded.
    function _seedOwed(uint256 eventId, address user) internal view returns (uint256 amount) {
        IWordPool pool = IWordPool(factory.wordPool());
        IWordMarket market = IWordMarket(factory.wordMarket());
        IOracleRegistry oracle = IOracleRegistry(factory.oracleRegistry());
        uint128 unit = factory.getConfig(eventId).founderSeedUnit;
        if (unit == 0) return 0;
        uint256 bitmap = oracle.validatedBitmap(eventId);
        uint256 n = pool.wordCount(eventId);
        for (uint256 w = 0; w < n; w++) {
            if (bitmap & (uint256(1) << w) == 0) continue;
            if (seedPaid[eventId][w][user]) continue;
            if (pool.founderOf(eventId, w) != user) continue;
            if (!market.hasFounderSeed(eventId, w, user)) continue;
            amount += (uint256(unit) * pool.multOf(eventId, w)) / SCALE;
        }
    }

    /// @dev Mark every seed counted by _seedOwed as paid (same predicate).
    function _markSeeds(uint256 eventId, address user) internal {
        IWordPool pool = IWordPool(factory.wordPool());
        IWordMarket market = IWordMarket(factory.wordMarket());
        IOracleRegistry oracle = IOracleRegistry(factory.oracleRegistry());
        if (factory.getConfig(eventId).founderSeedUnit == 0) return;
        uint256 bitmap = oracle.validatedBitmap(eventId);
        uint256 n = pool.wordCount(eventId);
        for (uint256 w = 0; w < n; w++) {
            if (bitmap & (uint256(1) << w) == 0) continue;
            if (seedPaid[eventId][w][user]) continue;
            if (pool.founderOf(eventId, w) != user) continue;
            if (!market.hasFounderSeed(eventId, w, user)) continue;
            seedPaid[eventId][w][user] = true;
        }
    }

    function _pay(address token, address to, uint256 amount) internal {
        if (token == address(0)) {
            (bool ok,) = payable(to).call{value: amount}("");
            require(ok, "native transfer failed");
        } else {
            IERC20(token).safeTransfer(to, amount);
        }
    }

    /// @notice Preview a user's pool-funded claim (bonus + founder seed).
    function previewClaim(uint256 eventId, address user) external view returns (uint256 bonus, uint256 seed) {
        (bonus,) = _bonusOwed(eventId, user);
        seed = _seedOwed(eventId, user);
    }
}
