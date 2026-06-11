// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/// @title BingocleTypes
/// @notice Shared enums/structs/constants for the Bingocle protocol.
library BingocleTypes {
    /// @dev Lifecycle of an event. Phases are derived from on-chain timestamps
    ///      (in EventFactory) so deadlines are enforced by the contract, never the backend.
    enum Phase {
        None, // event does not exist
        Submission, // community submits words (off-chain curated by AI)
        Founder, // pool committed; founders buy at opening price
        Market, // public parimutuel trading open
        Live, // event running; market locked; oracle commits validations
        Dispute, // validation done; dispute window open
        Settled, // settlement finalized; claims open
        Cancelled // organizer cancelled; refunds open
    }

    /// @notice Immutable-ish configuration + schedule for a single event.
    /// @dev `token == address(0)` means the native gas asset (MNT on Mantle).
    ///      All times are unix seconds. Monotonic:
    ///      createdAt <= submissionEnd <= founderEnd <= marketLock <= eventEnd <= disputeEnd.
    struct EventConfig {
        address organizer;
        address token; // address(0) => native MNT
        uint64 createdAt;
        uint64 submissionEnd; // submission closes; pool can be committed after curation
        uint64 founderEnd; // founder-price window closes; public market opens
        uint64 marketLock; // market locks; event goes Live
        uint64 eventEnd; // talk over; oracle stops committing; dispute window opens
        uint64 disputeEnd; // dispute window closes; settlement can be finalized
        uint16 maxWordsPerUser; // sybil cap (spec: 3)
        uint16 cardSize; // 25 for a 5x5 card
        uint128 founderSeedUnit; // notional stake of a founder's free seed (token base units)
        BonusTiers bonus; // bingo bonus amounts (in token base units)
    }

    /// @notice Tiered, stackable bingo bonuses (spec defaults: 50/75/100/500).
    struct BonusTiers {
        uint128 line; // first completed line
        uint128 diagonal; // a completed diagonal
        uint128 doubleLine; // two completed lines
        uint128 fullCard; // every cell marked
    }
}
