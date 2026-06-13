import { parseAbi } from "viem";

/**
 * On-chain wiring for the Bingocle app. Addresses come from NEXT_PUBLIC_* env
 * (set after `forge script Deploy`); ABIs are the minimal fragments the UI calls.
 * Word labels + odds are read from the agent service (NEXT_PUBLIC_AGENT_API),
 * which persists each event's curated pool — the chain only stores word hashes.
 */
// Defaults are the live Mantle Sepolia deployment so production works without extra
// env config; override via NEXT_PUBLIC_* for a different deployment.
export const addresses = {
  eventFactory: (process.env.NEXT_PUBLIC_EVENT_FACTORY ??
    "0x4ded43273E1b3be15bBBF1A5cE9494f77B045Afb") as `0x${string}`,
  wordPool: (process.env.NEXT_PUBLIC_WORD_POOL ??
    "0x1F0BebC4D0f7C4B8428Ac2FE14BBeb2178e63C29") as `0x${string}`,
  wordMarket: (process.env.NEXT_PUBLIC_WORD_MARKET ??
    "0x2a853222d57d28a713F45b8F78503376ccF5471b") as `0x${string}`,
  oracleRegistry: (process.env.NEXT_PUBLIC_ORACLE_REGISTRY ??
    "0xe998c6F467876b2dA1C5D126EA5576A6943c2073") as `0x${string}`,
  bingoCardNFT: (process.env.NEXT_PUBLIC_BINGO_CARD_NFT ??
    "0x1A7643b31EfD272F65fe7D8653fE35172284A1F3") as `0x${string}`,
  rewardVault: (process.env.NEXT_PUBLIC_REWARD_VAULT ??
    "0x0B0766bF126180730E408105C35A761D7AADe968") as `0x${string}`,
};

// Defaults to the hosted agent so production works without extra env config;
// set NEXT_PUBLIC_AGENT_API=http://localhost:8787 in .env.local for local dev.
export const AGENT_API =
  process.env.NEXT_PUBLIC_AGENT_API ?? "https://bingocle-production.up.railway.app";

export const eventFactoryAbi = parseAbi([
  "function eventCount() view returns (uint256)",
  "function phaseOf(uint256 eventId) view returns (uint8)",
  "function getConfig(uint256 eventId) view returns ((address organizer,address token,uint64 createdAt,uint64 submissionEnd,uint64 founderEnd,uint64 marketLock,uint64 eventEnd,uint64 disputeEnd,uint16 maxWordsPerUser,uint16 cardSize,uint128 founderSeedUnit,(uint128 line,uint128 diagonal,uint128 doubleLine,uint128 fullCard) bonus))",
]);

export const wordPoolAbi = parseAbi([
  "function isCommitted(uint256 eventId) view returns (bool)",
  "function wordCount(uint256 eventId) view returns (uint256)",
  "function priceOf(uint256 eventId, uint256 wordIndex) view returns (uint256)",
  "function founderOf(uint256 eventId, uint256 wordIndex) view returns (address)",
]);

export const wordMarketAbi = parseAbi([
  "function spotPrice(uint256 eventId, uint256 word) view returns (uint256)",
  "function quoteBuy(uint256 eventId, uint256 word, uint256 sharesOut) view returns (uint256)",
  "function quoteSell(uint256 eventId, uint256 word, uint256 sharesIn) view returns (uint256)",
  "function sharesOf(uint256 eventId, uint256 word, address user) view returns (uint256)",
  "function previewRedeem(uint256 eventId, address user) view returns (uint256)",
  "function buy(uint256 eventId, uint256 word, uint256 sharesOut, uint256 maxCost) payable returns (uint256)",
  "function sell(uint256 eventId, uint256 word, uint256 sharesIn, uint256 minRefund) returns (uint256)",
  "function settle(uint256 eventId)",
  "function redeem(uint256 eventId) returns (uint256)",
  "function claimFounderSeed(uint256 eventId, uint256 word)",
]);

export const bingoCardAbi = parseAbi([
  "function hasCard(uint256 eventId, address player) view returns (bool)",
  "function cardOf(uint256 eventId, address player) view returns (uint256)",
  "function cardCells(uint256 tokenId) view returns (uint8[25])",
  "function markedMask(uint256 tokenId) view returns (uint32)",
  "function mint(uint256 eventId) returns (uint256)",
]);

export const rewardVaultAbi = parseAbi([
  "function previewClaim(uint256 eventId, address user) view returns (uint256 bonus, uint256 seed)",
  "function claim(uint256 eventId)",
]);

export const PHASES = [
  "None",
  "Submission",
  "Founder",
  "Market",
  "Live",
  "Dispute",
  "Settled",
  "Cancelled",
] as const;

export type EventRecord = {
  eventId: number;
  theme: string;
  words: string[];
  odds: { word: string; aiProb: number; price1e4: number; mult1e4: number }[];
};

/** Fetch the agent service's record (word labels + odds) for an event. */
export async function fetchEventRecord(eventId: number): Promise<EventRecord | null> {
  try {
    const res = await fetch(`${AGENT_API}/events/${eventId}`);
    if (!res.ok) return null;
    const json = await res.json();
    return json.record ?? null;
  } catch {
    return null;
  }
}
