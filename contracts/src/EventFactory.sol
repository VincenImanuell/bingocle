// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {BingocleTypes} from "./lib/BingocleTypes.sol";
import {IEventFactory} from "./interfaces/IBingocle.sol";

/// @title EventFactory
/// @notice Source of truth for event config + lifecycle. Each event is keyed by an
///         incrementing id (no per-event deploy). Phase is derived purely from
///         on-chain timestamps, so all deadlines are contract-enforced.
contract EventFactory is IEventFactory, Ownable {
    // --- module registry (wired once after deploy) ---
    address public wordPool;
    address public wordMarket;
    address public oracleRegistry;
    address public cardNFT;
    address public rewardVault;
    address public agentIdentity;
    bool public modulesWired;

    uint256 public eventCount;
    mapping(uint256 => BingocleTypes.EventConfig) private _config;
    mapping(uint256 => bool) public cancelled;

    event ModulesWired(
        address wordPool,
        address wordMarket,
        address oracleRegistry,
        address cardNFT,
        address rewardVault,
        address agentIdentity
    );
    event EventCreated(uint256 indexed eventId, address indexed organizer, address token);
    event EventCancelled(uint256 indexed eventId);

    error AlreadyWired();
    error ZeroModule();
    error NotExist();
    error NotOrganizer();
    error BadTiming();
    error BadCardSize();
    error TooLate();

    constructor(address owner_) Ownable(owner_) {}

    /// @notice One-time wiring of the module contracts after they are deployed.
    function wireModules(
        address _wordPool,
        address _wordMarket,
        address _oracleRegistry,
        address _cardNFT,
        address _rewardVault,
        address _agentIdentity
    ) external onlyOwner {
        if (modulesWired) revert AlreadyWired();
        if (
            _wordPool == address(0) || _wordMarket == address(0) || _oracleRegistry == address(0)
                || _cardNFT == address(0) || _rewardVault == address(0) || _agentIdentity == address(0)
        ) revert ZeroModule();
        wordPool = _wordPool;
        wordMarket = _wordMarket;
        oracleRegistry = _oracleRegistry;
        cardNFT = _cardNFT;
        rewardVault = _rewardVault;
        agentIdentity = _agentIdentity;
        modulesWired = true;
        emit ModulesWired(_wordPool, _wordMarket, _oracleRegistry, _cardNFT, _rewardVault, _agentIdentity);
    }

    /// @notice Create an event. Caller becomes the organizer. Reward pool is funded
    ///         separately via RewardVault.fund().
    function createEvent(
        address token,
        uint64 submissionEnd,
        uint64 founderEnd,
        uint64 marketLock,
        uint64 eventEnd,
        uint64 disputeEnd,
        uint16 maxWordsPerUser,
        uint16 cardSize,
        uint128 founderSeedUnit,
        BingocleTypes.BonusTiers calldata bonus
    ) external returns (uint256 eventId) {
        // Strictly increasing schedule so every phase has positive width — equal
        // boundaries would collapse a phase (phaseOf uses strict <), e.g. a zero-width
        // Live window means no word can ever be validated and stakes would trap.
        if (
            !(block.timestamp < submissionEnd && submissionEnd < founderEnd && founderEnd < marketLock
                && marketLock < eventEnd && eventEnd < disputeEnd)
        ) revert BadTiming();
        if (cardSize != 25) revert BadCardSize();

        eventId = ++eventCount;
        _config[eventId] = BingocleTypes.EventConfig({
            organizer: msg.sender,
            token: token,
            createdAt: uint64(block.timestamp),
            submissionEnd: submissionEnd,
            founderEnd: founderEnd,
            marketLock: marketLock,
            eventEnd: eventEnd,
            disputeEnd: disputeEnd,
            maxWordsPerUser: maxWordsPerUser == 0 ? 3 : maxWordsPerUser,
            cardSize: cardSize,
            founderSeedUnit: founderSeedUnit,
            bonus: bonus
        });
        emit EventCreated(eventId, msg.sender, token);
    }

    /// @notice Organizer may cancel before the event ends (enables refunds).
    function cancel(uint256 eventId) external {
        if (!exists(eventId)) revert NotExist();
        if (_config[eventId].organizer != msg.sender) revert NotOrganizer();
        if (block.timestamp >= _config[eventId].eventEnd) revert TooLate();
        cancelled[eventId] = true;
        emit EventCancelled(eventId);
    }

    // --- views ---

    function exists(uint256 eventId) public view returns (bool) {
        return eventId != 0 && eventId <= eventCount;
    }

    function getConfig(uint256 eventId) external view returns (BingocleTypes.EventConfig memory) {
        if (!exists(eventId)) revert NotExist();
        return _config[eventId];
    }

    function isOrganizer(uint256 eventId, address who) external view returns (bool) {
        return exists(eventId) && _config[eventId].organizer == who;
    }

    function phaseOf(uint256 eventId) external view returns (BingocleTypes.Phase) {
        if (!exists(eventId)) return BingocleTypes.Phase.None;
        if (cancelled[eventId]) return BingocleTypes.Phase.Cancelled;
        BingocleTypes.EventConfig storage c = _config[eventId];
        uint256 t = block.timestamp;
        if (t < c.submissionEnd) return BingocleTypes.Phase.Submission;
        if (t < c.founderEnd) return BingocleTypes.Phase.Founder;
        if (t < c.marketLock) return BingocleTypes.Phase.Market;
        if (t < c.eventEnd) return BingocleTypes.Phase.Live;
        if (t < c.disputeEnd) return BingocleTypes.Phase.Dispute;
        return BingocleTypes.Phase.Settled;
    }
}
