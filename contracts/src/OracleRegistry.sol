// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {BingocleTypes} from "./lib/BingocleTypes.sol";
import {IEventFactory, IWordPool, IAgentIdentity, IOracleRegistry} from "./interfaces/IBingocle.sol";

/// @title OracleRegistry
/// @notice The on-chain record of every AI Validation Oracle verdict — word, confidence,
///         transcript proof, timestamp, and the agent that committed it. This is the
///         "AI function callable on-chain": an ERC-8004 agent writes its verdicts here,
///         and that write is what triggers settlement. Radical transparency by design.
contract OracleRegistry is IOracleRegistry, Ownable {
    IEventFactory public immutable factory;

    struct Verdict {
        bool validated;
        bool disputed;
        uint16 confidence; // 1e4 scale (9700 == 0.97)
        uint64 timestamp;
        uint256 agentId; // committing agent
    }

    mapping(uint256 => uint256) public override validatedBitmap; // event => bit w set if word w spoken
    mapping(uint256 => uint256) public override validatedCount; // event => count
    mapping(uint256 => mapping(uint256 => Verdict)) public verdicts; // event => word => verdict
    mapping(uint256 => mapping(uint256 => bool)) private _served; // event => agentId => served?

    event ValidationCommitted(
        uint256 indexed eventId,
        uint256 indexed wordIndex,
        uint256 indexed agentId,
        uint16 confidence,
        string snippet,
        uint64 timestamp
    );
    event DisputeRaised(uint256 indexed eventId, uint256 indexed wordIndex, address by);
    event DisputeResolved(uint256 indexed eventId, uint256 indexed wordIndex, bool upheld);

    error NotOracle();
    error NotExist();
    error NotCommitted();
    error BadWord();
    error NotLive();
    error AlreadyValidated();
    error NotDisputeWindow();
    error NotValidated();
    error NotAuthorized();

    constructor(address owner_, address factory_) Ownable(owner_) {
        factory = IEventFactory(factory_);
    }

    function _identity() internal view returns (IAgentIdentity) {
        return IAgentIdentity(factory.agentIdentity());
    }

    /// @notice Commit a verdict that word `wordIndex` was spoken. Oracle agents only,
    ///         only while the event is Live. Every write is permanent + auditable.
    function commitValidation(uint256 eventId, uint256 wordIndex, uint16 confidence, string calldata snippet)
        external
    {
        IAgentIdentity id = _identity();
        if (!id.isOracle(msg.sender)) revert NotOracle();
        if (!factory.exists(eventId)) revert NotExist();
        IWordPool pool = IWordPool(factory.wordPool());
        if (!pool.isCommitted(eventId)) revert NotCommitted();
        if (wordIndex >= pool.wordCount(eventId)) revert BadWord();
        if (factory.phaseOf(eventId) != BingocleTypes.Phase.Live) revert NotLive();

        Verdict storage v = verdicts[eventId][wordIndex];
        if (v.validated) revert AlreadyValidated();

        uint256 agentId = id.agentIdOf(msg.sender);
        v.validated = true;
        v.confidence = confidence;
        v.timestamp = uint64(block.timestamp);
        v.agentId = agentId;

        validatedBitmap[eventId] |= (uint256(1) << wordIndex);
        validatedCount[eventId] += 1;

        if (!_served[eventId][agentId]) {
            _served[eventId][agentId] = true;
            id.recordEventServed(agentId);
        }
        id.recordValidation(agentId);

        emit ValidationCommitted(eventId, wordIndex, agentId, confidence, snippet, uint64(block.timestamp));
    }

    /// @notice Flag a verdict believed wrong, during the dispute window (anyone).
    function raiseDispute(uint256 eventId, uint256 wordIndex) external {
        if (factory.phaseOf(eventId) != BingocleTypes.Phase.Dispute) revert NotDisputeWindow();
        Verdict storage v = verdicts[eventId][wordIndex];
        if (!v.validated) revert NotValidated();
        v.disputed = true;
        emit DisputeRaised(eventId, wordIndex, msg.sender);
    }

    /// @notice Resolve a dispute. Organizer or contract owner, during the dispute window.
    ///         If upheld, the verdict is reversed (word un-validated) and the agent's
    ///         dispute counter rises — its on-chain accuracy record.
    function resolveDispute(uint256 eventId, uint256 wordIndex, bool upheld) external {
        if (msg.sender != owner() && !factory.isOrganizer(eventId, msg.sender)) revert NotAuthorized();
        if (factory.phaseOf(eventId) != BingocleTypes.Phase.Dispute) revert NotDisputeWindow();
        Verdict storage v = verdicts[eventId][wordIndex];
        if (!v.validated) revert NotValidated();

        if (upheld) {
            v.validated = false;
            validatedBitmap[eventId] &= ~(uint256(1) << wordIndex);
            validatedCount[eventId] -= 1;
        }
        v.disputed = false;
        _identity().recordDispute(v.agentId, upheld);
        emit DisputeResolved(eventId, wordIndex, upheld);
    }

    // --- views ---

    function isValidated(uint256 eventId, uint256 wordIndex) external view returns (bool) {
        return verdicts[eventId][wordIndex].validated;
    }
}
