// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";
import {BingocleTypes} from "./lib/BingocleTypes.sol";
import {BingoLib} from "./lib/BingoLib.sol";
import {IEventFactory, IWordPool, IOracleRegistry, IBingoCardNFT} from "./interfaces/IBingocle.sol";

/// @title BingoCardNFT
/// @notice One ERC-721 bingo card per (event, player). The 5x5 layout is shuffled
///         deterministically from an on-chain seed (same Fisher-Yates as the UI), so
///         fairness is preserved and the card is reproducible/verifiable. Cells mark
///         live as the Oracle validates words.
contract BingoCardNFT is IBingoCardNFT, ERC721 {
    using Strings for uint256;

    IEventFactory public immutable factory;

    uint256 public tokenCount;
    mapping(uint256 => uint8[25]) private _cells; // tokenId => card layout (255 = FREE center)
    mapping(uint256 => uint256) public eventOf; // tokenId => eventId
    mapping(uint256 => mapping(address => uint256)) private _cardOf; // event => player => tokenId

    event CardMinted(uint256 indexed eventId, address indexed player, uint256 indexed tokenId);

    error NotExist();
    error NotCommitted();
    error BadPhase();
    error AlreadyMinted();
    error Soulbound();

    constructor(address factory_) ERC721("Bingocle Card", "BCARD") {
        factory = IEventFactory(factory_);
    }

    /// @dev Cards are soulbound: settlement pays the original minter (cardOf), so a
    ///      transferable card would let a seller keep the bonus while the buyer gets a
    ///      dead token. Allow only mint (from==0) and burn (to==0).
    function _update(address to, uint256 tokenId, address auth)
        internal
        override
        returns (address from)
    {
        from = super._update(to, tokenId, auth);
        if (from != address(0) && to != address(0)) revert Soulbound();
    }

    /// @notice Mint your card for an event. One per wallet per event; available once the
    ///         pool is committed and before the market locks.
    function mint(uint256 eventId) external returns (uint256 tokenId) {
        if (!factory.exists(eventId)) revert NotExist();
        IWordPool pool = IWordPool(factory.wordPool());
        if (!pool.isCommitted(eventId)) revert NotCommitted();
        BingocleTypes.Phase phase = factory.phaseOf(eventId);
        if (phase != BingocleTypes.Phase.Founder && phase != BingocleTypes.Phase.Market) revert BadPhase();
        if (_cardOf[eventId][msg.sender] != 0) revert AlreadyMinted();

        uint256 wordCount = pool.wordCount(eventId);
        uint256 seed = uint256(
            keccak256(
                abi.encode(eventId, msg.sender, blockhash(block.number - 1), block.prevrandao, tokenCount)
            )
        );
        uint8[25] memory cells = BingoLib.buildCard(wordCount, seed);

        tokenId = ++tokenCount;
        _cells[tokenId] = cells;
        eventOf[tokenId] = eventId;
        _cardOf[eventId][msg.sender] = tokenId;
        _safeMint(msg.sender, tokenId);
        emit CardMinted(eventId, msg.sender, tokenId);
    }

    // --- views ---

    function cardOf(uint256 eventId, address player) external view returns (uint256) {
        return _cardOf[eventId][player];
    }

    function hasCard(uint256 eventId, address player) external view returns (bool) {
        return _cardOf[eventId][player] != 0;
    }

    function cardCells(uint256 tokenId) external view returns (uint8[25] memory) {
        _requireOwned(tokenId);
        return _cells[tokenId];
    }

    function markedMask(uint256 tokenId) public view returns (uint32) {
        _requireOwned(tokenId);
        uint256 eventId = eventOf[tokenId];
        uint256 bitmap = IOracleRegistry(factory.oracleRegistry()).validatedBitmap(eventId);
        return BingoLib.markedFromCard(_cells[tokenId], bitmap);
    }

    /// @notice Fully on-chain metadata (Base64 data URI) so the card renders in wallets.
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        uint256 eventId = eventOf[tokenId];
        uint256 marks = _popcount(markedMask(tokenId));

        string memory svg = string.concat(
            "<svg xmlns='http://www.w3.org/2000/svg' width='350' height='350'>",
            "<rect width='100%' height='100%' fill='#1b1530'/>",
            "<text x='50%' y='44%' fill='#e8c66b' font-size='30' text-anchor='middle' font-family='serif'>BINGOCLE</text>",
            "<text x='50%' y='58%' fill='#cdb8ff' font-size='16' text-anchor='middle' font-family='monospace'>Card #",
            tokenId.toString(),
            unicode" · Event ",
            eventId.toString(),
            "</text></svg>"
        );
        string memory json = string.concat(
            '{"name":"Bingocle Card #',
            tokenId.toString(),
            '","description":"A Bingocle bingo card on Mantle. Cells mark live as the AI oracle validates spoken words.",',
            '"image":"data:image/svg+xml;base64,',
            Base64.encode(bytes(svg)),
            '","attributes":[{"trait_type":"Event","value":',
            eventId.toString(),
            '},{"trait_type":"Marked","value":',
            marks.toString(),
            "}]}"
        );
        return string.concat("data:application/json;base64,", Base64.encode(bytes(json)));
    }

    function _popcount(uint32 x) private pure returns (uint256 c) {
        while (x != 0) {
            c += x & 1;
            x >>= 1;
        }
    }
}
