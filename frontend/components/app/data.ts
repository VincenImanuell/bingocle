import type { WordInfo } from "./engine";

/* the curated 24-word pool (the 25th tile is the free star) */
export const BASE_POOL: WordInfo[] = [
  { word: "AI", price: 0.8, mult: 1.2, aiProb: 0.95 },
  { word: "Web3", price: 0.75, mult: 1.3, aiProb: 0.9 },
  { word: "Demo", price: 0.72, mult: 1.35, aiProb: 0.92 },
  { word: "Community", price: 0.7, mult: 1.4, aiProb: 0.88 },
  { word: "Mantle", price: 0.68, mult: 1.45, aiProb: 0.86 },
  { word: "Hackathon", price: 0.65, mult: 1.5, aiProb: 0.85 },
  { word: "Launch", price: 0.6, mult: 1.6, aiProb: 0.78 },
  { word: "Token", price: 0.58, mult: 1.65, aiProb: 0.75 },
  { word: "Mainnet", price: 0.55, mult: 1.7, aiProb: 0.72 },
  { word: "Funding", price: 0.55, mult: 1.7, aiProb: 0.7 },
  { word: "Pitch", price: 0.52, mult: 1.75, aiProb: 0.66 },
  { word: "Wallet", price: 0.5, mult: 1.8, aiProb: 0.64 },
  { word: "Chain", price: 0.48, mult: 1.9, aiProb: 0.6 },
  { word: "Gas Fee", price: 0.46, mult: 1.95, aiProb: 0.55 },
  { word: "Builder", price: 0.45, mult: 2.0, aiProb: 0.54 },
  { word: "Reward", price: 0.44, mult: 2.05, aiProb: 0.5 },
  { word: "Oracle", price: 0.42, mult: 2.1, aiProb: 0.48 },
  { word: "Testnet", price: 0.4, mult: 2.2, aiProb: 0.45 },
  { word: "DAO", price: 0.38, mult: 2.3, aiProb: 0.4 },
  { word: "Mint", price: 0.36, mult: 2.35, aiProb: 0.36 },
  { word: "Sponsor", price: 0.35, mult: 2.4, aiProb: 0.34 },
  { word: "Grant", price: 0.33, mult: 2.5, aiProb: 0.3 },
  { word: "Quest", price: 0.3, mult: 2.6, aiProb: 0.26 },
  { word: "Airdrop", price: 0.25, mult: 2.8, aiProb: 0.2 },
];

/* pool slots sacrificed when the player founds new words */
export const SWAP_ORDER = ["Quest", "Mint", "Grant"];

export const USER_WORD_INFO = { price: 0.25, mult: 2.5, aiProb: 0.22 };

export type OracleEvent = {
  /* word to validate; null = rejected (no match); "__USER__" = the
     player's first founded word, skipped when there is none */
  word: string | null | "__USER__";
  heard?: string;
  snippet: string;
  conf: number;
  gap: number; // seconds after the previous event
};

export const ORACLE_SCRIPT: OracleEvent[] = [
  { word: "AI", snippet: "…so when we plugged the model in, the AI started flagging duplicates on its own…", conf: 0.97, gap: 3 },
  { word: "Community", snippet: "…none of this ships without the community testing every single build…", conf: 0.95, gap: 5 },
  { word: "Mainnet", snippet: "…we are targeting mainnet before the end of the quarter…", conf: 0.96, gap: 5 },
  { word: null, heard: "tokenomics", snippet: "…the tokenomics deck is forty slides, I will spare you…", conf: 0.38, gap: 4 },
  { word: "Demo", snippet: "…let me switch over to the live demo real quick…", conf: 0.98, gap: 5 },
  { word: "Hackathon", snippet: "…this whole thing started as a hackathon side project…", conf: 0.94, gap: 5 },
  { word: "Wallet", snippet: "…you sign it straight from your wallet, no seed phrase, nothing…", conf: 0.92, gap: 5 },
  { word: "__USER__", snippet: "…and yes — {WORD} — you heard that right, it is on the roadmap…", conf: 0.93, gap: 5 },
  { word: "Token", snippet: "…the token simply routes value back to the players…", conf: 0.91, gap: 5 },
  { word: "Builder", snippet: "…every builder in this room has shipped something this week…", conf: 0.9, gap: 5 },
  { word: null, heard: "finance", snippet: "…and obviously none of this is financial advice, folks…", conf: 0.35, gap: 4 },
  { word: "Mantle", snippet: "…settlement happens on Mantle, fees stay near zero…", conf: 0.97, gap: 5 },
  { word: "Oracle", snippet: "…the AI oracle writes its verdict straight on-chain…", conf: 0.95, gap: 5 },
  { word: "Funding", snippet: "…we closed our first funding round late last month…", conf: 0.93, gap: 5 },
  { word: "Launch", snippet: "…the public launch is penciled in for early July…", conf: 0.92, gap: 5 },
  { word: "Testnet", snippet: "…everything you just saw runs on the testnet today…", conf: 0.96, gap: 5 },
  { word: "Chain", snippet: "…every verdict is recorded on the chain, permanently…", conf: 0.9, gap: 5 },
];

export const DEMO_EVENT = {
  name: "Mantle Builder Demo Day",
  theme: "Web3 · AI · Startup",
  pool: "1,000 USDC",
  oracle: "Whisper STT + Claude",
  chain: "Mantle Sepolia (demo)",
};

export const STARTING_BALANCE = 100;

/* demo leaderboard rivals — one of them is another user's AI Mind */
export const RIVALS = [
  { name: "Atlas (AI Mind)", kind: "AI", profit: 38.2 },
  { name: "kelpie.eth", kind: "Human", profit: 21.5 },
  { name: "wordweaver", kind: "Human", profit: -12.4 },
];
