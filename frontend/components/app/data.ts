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
  word: string | null | "__USER__";
  heard?: string;
  snippet: string;
  conf: number;
  charPos: number; // character position in SPEECH_TEXT that triggers this event
};

// Ordered by charPos so tiles light up exactly when the word appears in the typewriter
export const ORACLE_SCRIPT: OracleEvent[] = [
  { word: "Community", snippet: "…none of this ships without the community testing every single build…", conf: 0.95, charPos: 83 },
  { word: "Builder", snippet: "…every builder in this room has shipped something remarkable this week…", conf: 0.9, charPos: 113 },
  { word: "AI", snippet: "…so when we plugged the model in, the AI started flagging duplicates on its own…", conf: 0.97, charPos: 206 },
  { word: "Mainnet", snippet: "…we are targeting mainnet before the end of the quarter…", conf: 0.96, charPos: 266 },
  { word: null, heard: "tokenomics", snippet: "…the tokenomics deck is forty slides, I will spare you…", conf: 0.38, charPos: 315 },
  { word: "Wallet", snippet: "…you sign it straight from your wallet, no seed phrase, nothing…", conf: 0.92, charPos: 391 },
  { word: "Mantle", snippet: "…settlement happens on Mantle, fees stay near zero…", conf: 0.97, charPos: 458 },
  { word: "Funding", snippet: "…we closed our first funding round late last month…", conf: 0.93, charPos: 526 },
  { word: "Testnet", snippet: "…everything runs on the testnet all quarter…", conf: 0.96, charPos: 571 },
  { word: "Chain", snippet: "…every verdict is recorded on the chain, permanently…", conf: 0.9, charPos: 636 },
  { word: "Hackathon", snippet: "…this whole thing started as a hackathon side project…", conf: 0.94, charPos: 705 },
  { word: "Oracle", snippet: "…the AI oracle writes its verdict straight on-chain…", conf: 0.95, charPos: 767 },
  { word: "Token", snippet: "…the token simply routes value back to the players…", conf: 0.91, charPos: 845 },
  { word: "Demo", snippet: "…let me switch over to the live demo real quick…", conf: 0.98, charPos: 938 },
  { word: "__USER__", snippet: "…and yes — {WORD} — you heard that right, it is on the roadmap…", conf: 0.93, charPos: 998 },
  { word: null, heard: "finance", snippet: "…and obviously none of this is financial advice, folks…", conf: 0.35, charPos: 1045 },
  { word: "Launch", snippet: "…the public launch is penciled in for early July…", conf: 0.92, charPos: 1073 },
];

export const DEMO_EVENT = {
  name: "Mantle Builder Demo Day",
  theme: "Web3 · AI · Startup",
  pool: "1,000 USDC",
  oracle: "Whisper STT + Claude",
  chain: "Mantle Sepolia (demo)",
};

export const STARTING_BALANCE = 100;

export const RIVALS = [
  { name: "Atlas (AI Mind)", kind: "AI", profit: 38.2 },
  { name: "kelpie.eth", kind: "Human", profit: 21.5 },
  { name: "wordweaver", kind: "Human", profit: -12.4 },
];

/* ── New: AI curation reasoning for each word in BASE_POOL ── */
export const AI_CURATION_LOG: Array<{
  word: string;
  reason: string;
  prob: number;
}> = [
  { word: "AI", reason: "Speaker's core topic — near-certain usage", prob: 95 },
  { word: "Web3", reason: "Event theme — expected multiple times", prob: 90 },
  { word: "Demo", reason: "Live demo day context — very high signal", prob: 92 },
  { word: "Community", reason: "Startup events always reference community", prob: 88 },
  { word: "Mantle", reason: "Network sponsor — mentioned prominently", prob: 86 },
  { word: "Hackathon", reason: "Direct context of this event", prob: 85 },
  { word: "Launch", reason: "Startups announce launches at demo days", prob: 78 },
  { word: "Token", reason: "Common in Web3 panel discussions", prob: 75 },
  { word: "Mainnet", reason: "Deployment talk expected from builders", prob: 72 },
  { word: "Funding", reason: "VC/grant announcements are typical", prob: 70 },
  { word: "Pitch", reason: "Demo day is a pitch day", prob: 66 },
  { word: "Wallet", reason: "UX discussion often references wallet", prob: 64 },
  { word: "Chain", reason: "Blockchain context — moderate probability", prob: 60 },
  { word: "Gas Fee", reason: "Cost discussion — mentioned but not certain", prob: 55 },
  { word: "Builder", reason: "Community shoutout typical at hackathons", prob: 54 },
  { word: "Reward", reason: "Incentive programs — moderate chance", prob: 50 },
  { word: "Oracle", reason: "Technical term — used by dev-focused speakers", prob: 48 },
  { word: "Testnet", reason: "Often contrasted with mainnet announcements", prob: 45 },
  { word: "DAO", reason: "Governance topic — less certain for this speaker", prob: 40 },
  { word: "Mint", reason: "NFT reference — speaker-dependent", prob: 36 },
  { word: "Sponsor", reason: "Acknowledgment section — possible mention", prob: 34 },
  { word: "Grant", reason: "Ecosystem grants — typical but not guaranteed", prob: 30 },
  { word: "Quest", reason: "Gamification term — niche, high multiplier", prob: 26 },
  { word: "Airdrop", reason: "Distribution event — low probability, 2.8× payout", prob: 20 },
];

/* ── New: mock IPO orders that stream in during the Founder phase ── */
export const IPO_MOCK_ORDERS: Array<{
  player: string;
  word: string;
  amount: number;
  delay: number; // ms after IPO phase starts
}> = [
  { player: "kelpie.eth", word: "AI", amount: 8, delay: 900 },
  { player: "Atlas (AI Mind)", word: "Web3", amount: 12, delay: 1900 },
  { player: "wordweaver", word: "Mantle", amount: 5, delay: 2800 },
  { player: "0xdemo7f", word: "Demo", amount: 10, delay: 3700 },
  { player: "kelpie.eth", word: "Funding", amount: 7, delay: 4600 },
  { player: "Atlas (AI Mind)", word: "Token", amount: 15, delay: 5500 },
  { player: "wordweaver", word: "Airdrop", amount: 3, delay: 6400 },
  { player: "0xdemo7f", word: "Builder", amount: 6, delay: 7200 },
];

/* ── New: full speech text for typewriter transcript in live phase ── */
export const SPEECH_TEXT =
  "Good evening, everyone. Welcome to the Mantle Builder Demo Day! " +
  "What an incredible community you all are — " +
  "every builder in this room has shipped something remarkable this week. " +
  "Tonight we celebrate what real AI-powered Web3 products look like. " +
  "Our first team is targeting mainnet before end of quarter. " +
  "Their pitch is simple: let the oracle decide, not the admin. " +
  "You sign it straight from your wallet — no seed phrase, nothing extra. " +
  "Settlement happens on Mantle, fees stay near zero, everything on-chain. " +
  "The team closed their first funding round just last month. " +
  "Building on testnet all quarter, mainnet before Q3 ends. " +
  "Every verdict is recorded on the chain, permanently and trustlessly. " +
  "This whole thing started as a hackathon side project, if you can believe it. " +
  "The AI oracle writes verdicts straight on-chain via the builder's agent identity. " +
  "The token simply routes value back to the players — pure utility, no noise. " +
  "Let me switch over to the live demo real quick to show you how it works. " +
  "And yes — every builder in this room has shipped — that deserves applause. " +
  "The public launch is penciled in for early July. Thank you all so much!";
