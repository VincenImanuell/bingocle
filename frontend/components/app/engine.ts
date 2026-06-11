/* Pure game logic for the Bingocle demo — no chain, no side effects. */

export type WordInfo = {
  word: string;
  price: number;
  mult: number;
  aiProb: number;
  isUserWord?: boolean;
};

export type CurationResult =
  | { status: "accepted"; word: string }
  | { status: "merged"; word: string; reason: string }
  | { status: "rejected"; input: string; reason: string };

/* the AI Word Curator, demo edition: normalize → alias → filter → dedup */
const ALIASES: Record<string, string> = {
  ai: "AI",
  "a.i.": "AI",
  "artificial intelligence": "AI",
  "web 3": "Web3",
  web3: "Web3",
  "gas fee": "Gas Fee",
  gasfee: "Gas Fee",
  gas: "Gas Fee",
  "smart contract": "Smart Contract",
  smartcontract: "Smart Contract",
  defi: "DeFi",
  nft: "NFT",
  dao: "DAO",
  lfg: "LFG",
};

const TOO_GENERIC = new Set([
  "the", "and", "that", "this", "with", "for", "you", "yes", "no",
  "ok", "okay", "yang", "dan", "itu", "ini", "di", "ke", "saya",
]);

export function normalizeWord(raw: string): string {
  const cleaned = raw.trim().replace(/\s+/g, " ").toLowerCase();
  if (ALIASES[cleaned]) return ALIASES[cleaned];
  // title-case each part
  return cleaned
    .split(" ")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

export function curateWord(raw: string, pool: WordInfo[]): CurationResult {
  const cleaned = raw.trim().replace(/\s+/g, " ");
  if (cleaned.length < 2) {
    return { status: "rejected", input: raw, reason: "Too short to be a real word." };
  }
  if (/https?:|www\./i.test(cleaned)) {
    return { status: "rejected", input: raw, reason: "Links are filtered out." };
  }
  if (TOO_GENERIC.has(cleaned.toLowerCase())) {
    return { status: "rejected", input: raw, reason: "Too generic — it would be said in any talk." };
  }
  // normalize first so aliases like "artificial intelligence" → "AI"
  // are measured by their canonical form
  const word = normalizeWord(cleaned);
  if (word.length > 18) {
    return { status: "rejected", input: raw, reason: "Too long — keep it to a word or short phrase." };
  }
  const existing = pool.find((w) => w.word.toLowerCase() === word.toLowerCase());
  if (existing) {
    return {
      status: "merged",
      word: existing.word,
      reason: "Already in the pool — your vote is counted, but the Founder seat is taken.",
    };
  }
  return { status: "accepted", word };
}

/* deterministic PRNG so a card can be rebuilt from its seed */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const FREE = "★ FREE";

/* shuffle the 24-word pool and slot the free star into the center */
export function makeCard(words: string[], seed: number): string[] {
  const rand = mulberry32(seed);
  const deck = [...words];
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  const card = deck.slice(0, 24);
  card.splice(12, 0, FREE);
  return card;
}

/* all 12 winning lines on a 5x5 card */
export const LINES: number[][] = [
  [0, 1, 2, 3, 4],
  [5, 6, 7, 8, 9],
  [10, 11, 12, 13, 14],
  [15, 16, 17, 18, 19],
  [20, 21, 22, 23, 24],
  [0, 5, 10, 15, 20],
  [1, 6, 11, 16, 21],
  [2, 7, 12, 17, 22],
  [3, 8, 13, 18, 23],
  [4, 9, 14, 19, 24],
  [0, 6, 12, 18, 24], // diagonal
  [4, 8, 12, 16, 20], // diagonal
];

export const DIAGONALS = new Set([10, 11]);

export function completedLines(card: string[], validated: Set<string>): number[] {
  const hit = (i: number) => card[i] === FREE || validated.has(card[i]);
  return LINES.map((line, idx) => (line.every(hit) ? idx : -1)).filter((i) => i >= 0);
}

export function isFullCard(card: string[], validated: Set<string>): boolean {
  return card.every((w) => w === FREE || validated.has(w));
}

/* tiered, stackable bingo bonuses (per the spec: 50 / 75 / 100 / 500) */
export type Bonus = { label: string; amount: number };

export function bonusesFor(
  card: string[],
  validated: Set<string>,
  already: Set<string>,
): Bonus[] {
  const lines = completedLines(card, validated);
  const out: Bonus[] = [];
  if (lines.length >= 1 && !already.has("line")) {
    out.push({ label: "First bingo line", amount: 50 });
  }
  if (lines.some((i) => DIAGONALS.has(i)) && !already.has("diag")) {
    out.push({ label: "Diagonal bingo", amount: 75 });
  }
  if (lines.length >= 2 && !already.has("double")) {
    out.push({ label: "Double line", amount: 100 });
  }
  if (isFullCard(card, validated) && !already.has("full")) {
    out.push({ label: "FULL CARD", amount: 500 });
  }
  return out;
}

export const BONUS_KEYS: Record<string, string> = {
  "First bingo line": "line",
  "Diagonal bingo": "diag",
  "Double line": "double",
  "FULL CARD": "full",
};

/* prediction payout: every position on a validated word pays stake × mult,
   and a Founder's free seed pays like a 1-USDC stake */
export function predictionRewards(
  pool: WordInfo[],
  positions: Record<string, number>,
  founderSeeds: Set<string>,
  validated: Set<string>,
): { word: string; stake: number; mult: number; payout: number; seed: boolean }[] {
  const rows: { word: string; stake: number; mult: number; payout: number; seed: boolean }[] = [];
  for (const info of pool) {
    if (!validated.has(info.word)) continue;
    const stake = positions[info.word] ?? 0;
    if (stake > 0) {
      rows.push({
        word: info.word,
        stake,
        mult: info.mult,
        payout: Math.round(stake * info.mult * 100) / 100,
        seed: false,
      });
    }
    if (founderSeeds.has(info.word)) {
      rows.push({
        word: info.word,
        stake: 0,
        mult: info.mult,
        payout: Math.round(info.mult * 100) / 100,
        seed: true,
      });
    }
  }
  return rows;
}
