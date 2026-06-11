// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {BingocleTypes} from "./BingocleTypes.sol";

/// @title BingoLib
/// @notice Pure 5x5 bingo math, mirroring the front-end engine (`engine.ts`)
///         so on-chain settlement and the UI agree cell-for-cell.
/// @dev A card is a 25-cell grid (row-major). The center cell (index 12) is a
///      permanent FREE space. State is carried as a 25-bit `marked` bitmask:
///      bit i set => cell i's word has been validated as spoken.
library BingoLib {
    uint8 internal constant CELLS = 25;
    uint8 internal constant CENTER = 12;
    uint8 internal constant FREE = 255; // sentinel word index for the center cell
    uint32 internal constant FULL_MASK = 0x1FFFFFF; // (1<<25) - 1

    // Bonus-tier bit flags (which tiers a card has earned).
    uint8 internal constant TIER_LINE = 1 << 0;
    uint8 internal constant TIER_DIAG = 1 << 1;
    uint8 internal constant TIER_DOUBLE = 1 << 2;
    uint8 internal constant TIER_FULL = 1 << 3;

    /// @return masks the 12 winning lines (5 rows, 5 cols, 2 diagonals).
    ///         Indices 10 and 11 are the diagonals.
    function lineMasks() internal pure returns (uint32[12] memory masks) {
        masks[0] = 0x000001F; // row 0:  0,1,2,3,4
        masks[1] = 0x00003E0; // row 1:  5,6,7,8,9
        masks[2] = 0x0007C00; // row 2:  10,11,12,13,14
        masks[3] = 0x00F8000; // row 3:  15,16,17,18,19
        masks[4] = 0x1F00000; // row 4:  20,21,22,23,24
        masks[5] = 1082401; // col 0:  0,5,10,15,20
        masks[6] = 2164802; // col 1:  1,6,11,16,21
        masks[7] = 4329604; // col 2:  2,7,12,17,22
        masks[8] = 8659208; // col 3:  3,8,13,18,23
        masks[9] = 17318416; // col 4:  4,9,14,19,24
        masks[10] = 17043521; // diag ↘: 0,6,12,18,24
        masks[11] = 1118480; // diag ↗: 4,8,12,16,20
    }

    /// @dev The center is always FREE, so force its bit on before evaluating.
    function withFreeCenter(uint32 marked) internal pure returns (uint32) {
        return marked | (uint32(1) << CENTER);
    }

    /// @return count number of fully completed lines.
    function completedLineCount(uint32 marked) internal pure returns (uint8 count) {
        uint32 m = withFreeCenter(marked);
        uint32[12] memory masks = lineMasks();
        for (uint256 i = 0; i < 12; i++) {
            if (m & masks[i] == masks[i]) count++;
        }
    }

    /// @return true if either diagonal is complete.
    function hasDiagonal(uint32 marked) internal pure returns (bool) {
        uint32 m = withFreeCenter(marked);
        uint32[12] memory masks = lineMasks();
        return (m & masks[10] == masks[10]) || (m & masks[11] == masks[11]);
    }

    /// @return true if every cell is marked (full card).
    function isFull(uint32 marked) internal pure returns (bool) {
        return withFreeCenter(marked) & FULL_MASK == FULL_MASK;
    }

    /// @notice Bitmask of all bonus tiers a card currently qualifies for.
    /// @dev Mirrors `bonusesFor` in engine.ts (line / diagonal / double / full),
    ///      tiered and stackable; the caller diffs against already-claimed tiers.
    function earnedTiers(uint32 marked) internal pure returns (uint8 tiers) {
        uint8 lines = completedLineCount(marked);
        if (lines >= 1) tiers |= TIER_LINE;
        if (hasDiagonal(marked)) tiers |= TIER_DIAG;
        if (lines >= 2) tiers |= TIER_DOUBLE;
        if (isFull(marked)) tiers |= TIER_FULL;
    }

    /// @notice Token amount owed for newly-earned (not-yet-claimed) tiers.
    /// @param newlyEarned bitmask of tiers earned this settlement minus those already paid.
    function bonusAmount(uint8 newlyEarned, BingocleTypes.BonusTiers memory b)
        internal
        pure
        returns (uint256 amount)
    {
        if (newlyEarned & TIER_LINE != 0) amount += b.line;
        if (newlyEarned & TIER_DIAG != 0) amount += b.diagonal;
        if (newlyEarned & TIER_DOUBLE != 0) amount += b.doubleLine;
        if (newlyEarned & TIER_FULL != 0) amount += b.fullCard;
    }

    /// @notice Deterministically build a card layout from a seed.
    /// @dev Fisher-Yates over [0, wordCount), take the first 24, FREE in the center (12).
    ///      This on-chain keccak shuffle is the CANONICAL layout — the NFT's `cardCells`
    ///      is the single source of truth that settlement reads. UIs MUST render
    ///      `cardCells(tokenId)`; they must NOT recompute a layout (the front-end demo's
    ///      mulberry32 shuffle is local-only and intentionally does not match this).
    /// @param wordCount number of words in the pool (must be >= 24).
    /// @param seed per-card randomness (e.g. keccak(eventId, player, blockhash)).
    /// @return cells 25 word indices; cells[12] == FREE (255).
    function buildCard(uint256 wordCount, uint256 seed)
        internal
        pure
        returns (uint8[25] memory cells)
    {
        require(wordCount >= 24, "pool<24");
        require(wordCount <= 254, "pool>254"); // FREE=255 is reserved

        // deck = [0, 1, ..., wordCount-1]
        uint8[] memory deck = new uint8[](wordCount);
        for (uint256 i = 0; i < wordCount; i++) {
            deck[i] = uint8(i);
        }
        // Fisher-Yates from the top, drawing fresh entropy per step.
        for (uint256 i = wordCount - 1; i > 0; i--) {
            seed = uint256(keccak256(abi.encode(seed, i)));
            uint256 j = seed % (i + 1);
            (deck[i], deck[j]) = (deck[j], deck[i]);
        }
        // first 24 of the shuffled deck fill the non-center cells
        uint256 k = 0;
        for (uint256 cell = 0; cell < 25; cell++) {
            if (cell == CENTER) {
                cells[cell] = FREE;
            } else {
                cells[cell] = deck[k++];
            }
        }
    }

    /// @notice Compute a card's marked-bitmask from its layout and the validated set.
    /// @param cells the card's 25 word indices (cells[12] == FREE).
    /// @param validatedBitmap bit w set => word index w has been validated.
    /// @return marked 25-bit mask of marked cells (center always counts as marked).
    function markedFromCard(uint8[25] memory cells, uint256 validatedBitmap)
        internal
        pure
        returns (uint32 marked)
    {
        for (uint256 cell = 0; cell < 25; cell++) {
            uint8 w = cells[cell];
            if (cell == CENTER) {
                marked |= uint32(1) << uint32(cell);
            } else if (validatedBitmap & (uint256(1) << w) != 0) {
                marked |= uint32(1) << uint32(cell);
            }
        }
    }
}
