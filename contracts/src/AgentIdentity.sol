// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IAgentIdentity} from "./interfaces/IBingocle.sol";

/// @title AgentIdentity
/// @notice ERC-8004-style identity NFT for AI agents on Mantle. The Bingocle
///         Validation Oracle holds one; its on-chain reputation (validations,
///         events served, disputes upheld) accrues to the token — a portable,
///         benchmarkable AI track record, exactly the Turing-Test thesis.
/// @dev Off-chain inference, on-chain accountability: the agent signs txs from its
///      operator wallet; this contract binds that wallet to a reputation-bearing NFT.
contract AgentIdentity is IAgentIdentity, ERC721, Ownable {
    struct Reputation {
        uint64 validations; // verdicts committed on-chain
        uint64 eventsServed; // distinct events refereed
        uint64 disputesUpheld; // verdicts the community overturned (lower = better)
    }

    uint256 public agentCount;
    address public authorizedUpdater; // OracleRegistry — the only writer of reputation

    mapping(uint256 => address) public operatorOf; // agentId => operator wallet
    mapping(address => uint256) public agentIdOf; // operator wallet => agentId (0 = none)
    mapping(uint256 => string) private _tokenURI;
    mapping(uint256 => Reputation) public reputation;

    event AgentRegistered(uint256 indexed agentId, address indexed operator, string uri);
    event UpdaterSet(address indexed updater);
    event ValidationRecorded(uint256 indexed agentId, uint64 total);
    event EventServedRecorded(uint256 indexed agentId, uint64 total);
    event DisputeRecorded(uint256 indexed agentId, bool upheld);

    error NotUpdater();
    error AlreadyRegistered();
    error ZeroOperator();
    error Soulbound();

    constructor(address owner_) ERC721("Bingocle Agent Identity", "BAGENT") Ownable(owner_) {}

    /// @dev Identity is soulbound: `isOracle`/reputation are keyed to the operator, so a
    ///      transfer would split on-chain authority from the bound track record. Mint/burn only.
    function _update(address to, uint256 tokenId, address auth)
        internal
        override
        returns (address from)
    {
        from = super._update(to, tokenId, auth);
        if (from != address(0) && to != address(0)) revert Soulbound();
    }

    modifier onlyUpdater() {
        if (msg.sender != authorizedUpdater) revert NotUpdater();
        _;
    }

    /// @notice Wire the reputation writer (OracleRegistry).
    function setUpdater(address updater) external onlyOwner {
        authorizedUpdater = updater;
        emit UpdaterSet(updater);
    }

    /// @notice Register an AI agent and mint its identity NFT to the operator.
    function registerAgent(address operator, string calldata uri)
        external
        onlyOwner
        returns (uint256 agentId)
    {
        if (operator == address(0)) revert ZeroOperator();
        if (agentIdOf[operator] != 0) revert AlreadyRegistered();
        agentId = ++agentCount;
        operatorOf[agentId] = operator;
        agentIdOf[operator] = agentId;
        _tokenURI[agentId] = uri;
        _safeMint(operator, agentId);
        emit AgentRegistered(agentId, operator, uri);
    }

    // --- reputation writes (OracleRegistry only) ---

    function recordValidation(uint256 agentId) external onlyUpdater {
        uint64 t = ++reputation[agentId].validations;
        emit ValidationRecorded(agentId, t);
    }

    function recordEventServed(uint256 agentId) external onlyUpdater {
        uint64 t = ++reputation[agentId].eventsServed;
        emit EventServedRecorded(agentId, t);
    }

    function recordDispute(uint256 agentId, bool upheld) external onlyUpdater {
        if (upheld) reputation[agentId].disputesUpheld++;
        emit DisputeRecorded(agentId, upheld);
    }

    // --- views ---

    function isOracle(address who) external view returns (bool) {
        return agentIdOf[who] != 0;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        return _tokenURI[tokenId];
    }
}
