/**
 * Embedded contract ABIs (human-readable fragments) for the on-chain verbs the
 * Capability calls directly. Embedding these — instead of reading Foundry's
 * `contracts/out/*.json` off the local filesystem — is what makes the Capability
 * CROSS-MIND REPRODUCIBLE: a completely different operator's Mind can run it from
 * the published package alone, with no repo checkout and no `forge build`.
 *
 * Only the fragments actually invoked by src/chain.ts + src/commands.ts are
 * included; the full ABIs live in the contracts package.
 */
export const ABIS: Record<string, string[]> = {
  EventFactory: [
    "function eventCount() view returns (uint256)",
    "function phaseOf(uint256 eventId) view returns (uint8)",
  ],
  WordPool: [
    "function wordCount(uint256 eventId) view returns (uint256)",
    "function wordHashOf(uint256 eventId, uint256 wordIndex) view returns (bytes32)",
  ],
  WordMarket: [
    "function spotPrice(uint256 eventId, uint256 word) view returns (uint256)",
    "function quoteBuy(uint256 eventId, uint256 word, uint256 sharesOut) view returns (uint256)",
    "function quoteSell(uint256 eventId, uint256 word, uint256 sharesIn) view returns (uint256)",
    "function buy(uint256 eventId, uint256 word, uint256 sharesOut, uint256 maxCost) payable returns (uint256)",
    "function sell(uint256 eventId, uint256 word, uint256 sharesIn, uint256 minRefund) returns (uint256)",
    "function redeem(uint256 eventId) returns (uint256)",
  ],
  BingoCardNFT: ["function mint(uint256 eventId) returns (uint256)"],
  RewardVault: ["function claim(uint256 eventId)"],
};
