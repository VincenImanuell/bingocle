// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {BingocleTypes} from "./lib/BingocleTypes.sol";
import {IEventFactory, IWordPool, SCALE} from "./interfaces/IBingocle.sol";

/// @title WordPool
/// @notice The AI-curated final word pool + odds for an event. Committed once by the
///         Curator agent and frozen behind a merkle root so it cannot change after the
///         market opens. Words are referenced by index; the word text lives off-chain,
///         its keccak hash is stored for proof.
contract WordPool is IWordPool, Ownable {
    IEventFactory public immutable factory;
    address public curator; // AI Curator/Odds agent authorized to commit pools

    struct Pool {
        bool committed;
        bytes32 root; // merkle root of the canonical word list
        bytes32[] wordHashes;
        uint16[] prices; // 1e4 scale
        uint16[] mults; // 1e4 scale
        address[] founders; // first submitter per word (or address(0))
    }

    mapping(uint256 => Pool) private _pools;

    event CuratorSet(address indexed curator);
    event PoolCommitted(uint256 indexed eventId, uint256 wordCount, bytes32 root);

    error NotCurator();
    error NotExist();
    error AlreadyCommitted();
    error MarketOpen();
    error BadArrays();

    constructor(address owner_, address factory_) Ownable(owner_) {
        factory = IEventFactory(factory_);
    }

    function setCurator(address c) external onlyOwner {
        curator = c;
        emit CuratorSet(c);
    }

    /// @notice Commit the curated pool. Callable only before the market locks.
    /// @param wordHashes keccak256 of each canonical word (>=24 for a 5x5 card).
    /// @param prices opening prices (1e4 scale), parallel to wordHashes.
    /// @param mults payout multipliers (1e4 scale), parallel to wordHashes.
    /// @param founders first-submitter per word (address(0) if none), parallel.
    /// @param root merkle root binding the off-chain word list.
    function commitPool(
        uint256 eventId,
        bytes32[] calldata wordHashes,
        uint16[] calldata prices,
        uint16[] calldata mults,
        address[] calldata founders,
        bytes32 root
    ) external {
        if (msg.sender != curator) revert NotCurator();
        if (!factory.exists(eventId)) revert NotExist();
        Pool storage p = _pools[eventId];
        if (p.committed) revert AlreadyCommitted();
        // must be locked in before the market locks (i.e. before the event goes Live)
        if (block.timestamp >= factory.getConfig(eventId).marketLock) revert MarketOpen();

        uint256 n = wordHashes.length;
        if (n < 24 || n > 254) revert BadArrays();
        if (prices.length != n || mults.length != n || founders.length != n) revert BadArrays();

        p.committed = true;
        p.root = root;
        for (uint256 i = 0; i < n; i++) {
            // price in (0, 1.0]; multiplier >= 1.0x so a winning stake never loses value.
            if (prices[i] == 0 || prices[i] > SCALE || mults[i] < SCALE) revert BadArrays();
            p.wordHashes.push(wordHashes[i]);
            p.prices.push(prices[i]);
            p.mults.push(mults[i]);
            p.founders.push(founders[i]);
        }
        emit PoolCommitted(eventId, n, root);
    }

    // --- views ---

    function isCommitted(uint256 eventId) external view returns (bool) {
        return _pools[eventId].committed;
    }

    function wordCount(uint256 eventId) external view returns (uint256) {
        return _pools[eventId].wordHashes.length;
    }

    function merkleRoot(uint256 eventId) external view returns (bytes32) {
        return _pools[eventId].root;
    }

    function wordHashOf(uint256 eventId, uint256 wordIndex) external view returns (bytes32) {
        return _pools[eventId].wordHashes[wordIndex];
    }

    function priceOf(uint256 eventId, uint256 wordIndex) external view returns (uint256) {
        return _pools[eventId].prices[wordIndex];
    }

    function multOf(uint256 eventId, uint256 wordIndex) external view returns (uint256) {
        return _pools[eventId].mults[wordIndex];
    }

    function founderOf(uint256 eventId, uint256 wordIndex) external view returns (address) {
        return _pools[eventId].founders[wordIndex];
    }
}
