// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {BingocleTypes} from "../lib/BingocleTypes.sol";

// Multipliers and prices are fixed-point with 1e4 scale (10000 == 1.0x / 1.0).
// e.g. mult 1.2x => 12000 ; opening price 0.25 => 2500.
uint256 constant SCALE = 1e4;

/// @title IEventFactory
/// @notice Lifecycle + config authority. Phase is derived from on-chain timestamps,
///         so every deadline is enforced by the contract — never the backend.
interface IEventFactory {
    function exists(uint256 eventId) external view returns (bool);
    function getConfig(uint256 eventId) external view returns (BingocleTypes.EventConfig memory);
    function phaseOf(uint256 eventId) external view returns (BingocleTypes.Phase);
    function isOrganizer(uint256 eventId, address who) external view returns (bool);

    // Module registry (set once by owner after deploy).
    function wordPool() external view returns (address);
    function wordMarket() external view returns (address);
    function oracleRegistry() external view returns (address);
    function cardNFT() external view returns (address);
    function rewardVault() external view returns (address);
    function agentIdentity() external view returns (address);
}

/// @title IWordPool
/// @notice The AI-curated word pool + odds for an event, committed by the Curator role.
///         Locked by a merkle root so it cannot change after the market opens.
interface IWordPool {
    function isCommitted(uint256 eventId) external view returns (bool);
    function wordCount(uint256 eventId) external view returns (uint256);
    function merkleRoot(uint256 eventId) external view returns (bytes32);
    function wordHashOf(uint256 eventId, uint256 wordIndex) external view returns (bytes32);
    /// @return price opening price, 1e4 scale (2500 == 0.25).
    function priceOf(uint256 eventId, uint256 wordIndex) external view returns (uint256);
    /// @return mult payout multiplier, 1e4 scale (12000 == 1.2x).
    function multOf(uint256 eventId, uint256 wordIndex) external view returns (uint256);
    /// @return founder the first submitter of this word (free seed + founder price), or 0.
    function founderOf(uint256 eventId, uint256 wordIndex) external view returns (address);
}

/// @title IWordMarket
/// @notice The word-share trading market. RewardVault only needs the founder-seed
///         flag; the full trading surface (buy/sell/quote/redeem) lives on WordMarket.
interface IWordMarket {
    function hasFounderSeed(uint256 eventId, uint256 wordIndex, address user) external view returns (bool);
    function sharesOf(uint256 eventId, uint256 wordIndex, address user) external view returns (uint256);
    function spotPrice(uint256 eventId, uint256 wordIndex) external view returns (uint256);
}

/// @title IOracleRegistry
/// @notice On-chain log of AI Validation Oracle verdicts; source of truth for "spoken" words.
interface IOracleRegistry {
    /// @return bitmap bit w set => word index w validated as spoken (post-dispute).
    function validatedBitmap(uint256 eventId) external view returns (uint256);
    function isValidated(uint256 eventId, uint256 wordIndex) external view returns (bool);
    function validatedCount(uint256 eventId) external view returns (uint256);
}

/// @title IBingoCardNFT
/// @notice One ERC-721 card per (event, player); deterministic layout from a seed.
interface IBingoCardNFT {
    function cardOf(uint256 eventId, address player) external view returns (uint256 tokenId);
    function hasCard(uint256 eventId, address player) external view returns (bool);
    /// @return cells 25 word indices; cells[12] == 255 (FREE).
    function cardCells(uint256 tokenId) external view returns (uint8[25] memory cells);
    /// @return marked 25-bit mask of marked cells given the current validated set.
    function markedMask(uint256 tokenId) external view returns (uint32 marked);
}

/// @title IAgentIdentity
/// @notice ERC-8004-style identity NFT for AI agents; gates oracle writes + accrues reputation.
interface IAgentIdentity {
    function isOracle(address who) external view returns (bool);
    function agentIdOf(address who) external view returns (uint256);
    function recordValidation(uint256 agentId) external;
    function recordDispute(uint256 agentId, bool upheld) external;
    function recordEventServed(uint256 agentId) external;
}
