// Single source of truth for the documentation IA.
// Drives: the sidebar, breadcrumbs, prev/next page nav, static params, and search.

export type NavItem = {
  /** URL path segments, e.g. ["contracts", "word-market"] -> /contracts/word-market */
  slug: string[];
  /** Sidebar + breadcrumb + <title> label */
  title: string;
};

export type NavSection = {
  /** Uppercase group heading shown in the sidebar */
  group: string;
  items: NavItem[];
};

export const NAV: NavSection[] = [
  {
    group: "Getting Started",
    items: [
      { slug: ["getting-started", "introduction"], title: "Introduction" },
      { slug: ["getting-started", "quick-start"], title: "Quick Start" },
      { slug: ["getting-started", "architecture"], title: "Architecture" },
    ],
  },
  {
    group: "Smart Contracts",
    items: [
      { slug: ["contracts", "overview"], title: "Overview" },
      { slug: ["contracts", "event-factory"], title: "EventFactory" },
      { slug: ["contracts", "word-pool"], title: "WordPool" },
      { slug: ["contracts", "word-market"], title: "WordMarket" },
      { slug: ["contracts", "oracle-registry"], title: "OracleRegistry" },
      { slug: ["contracts", "bingo-card-nft"], title: "BingoCardNFT" },
      { slug: ["contracts", "reward-vault"], title: "RewardVault" },
      { slug: ["contracts", "agent-identity"], title: "AgentIdentity" },
      { slug: ["contracts", "deployment"], title: "Deployment" },
    ],
  },
  {
    group: "Agent Service",
    items: [
      { slug: ["agent", "overview"], title: "Overview" },
      { slug: ["agent", "ai-curator"], title: "AI Curator" },
      { slug: ["agent", "odds-engine"], title: "Odds Engine" },
      { slug: ["agent", "validation-oracle"], title: "Validation Oracle" },
      { slug: ["agent", "http-api"], title: "HTTP API" },
    ],
  },
  {
    group: "Capability",
    items: [
      { slug: ["capability", "overview"], title: "Overview" },
      { slug: ["capability", "commands"], title: "Chat Commands" },
      { slug: ["capability", "wallets-and-nlu"], title: "Wallets & NLU" },
    ],
  },
  {
    group: "Frontend",
    items: [
      { slug: ["frontend", "overview"], title: "Overview" },
      { slug: ["frontend", "routes-and-web3"], title: "Routes & Web3" },
    ],
  },
  {
    group: "Guides",
    items: [
      { slug: ["guides", "game-loop"], title: "The Game Loop" },
      { slug: ["guides", "trust-model"], title: "Trust Model" },
      { slug: ["guides", "security"], title: "Security Notes" },
      { slug: ["guides", "local-development"], title: "Local Development" },
    ],
  },
];

/** Flat, ordered list of every page (used for prev/next + static params). */
export const ALL_ITEMS: NavItem[] = NAV.flatMap((s) => s.items);

export const href = (slug: string[]) => "/" + slug.join("/");

export function findItem(slug: string[]): NavItem | undefined {
  const key = slug.join("/");
  return ALL_ITEMS.find((i) => i.slug.join("/") === key);
}

export function siblings(slug: string[]): {
  prev?: NavItem;
  next?: NavItem;
} {
  const key = slug.join("/");
  const idx = ALL_ITEMS.findIndex((i) => i.slug.join("/") === key);
  return {
    prev: idx > 0 ? ALL_ITEMS[idx - 1] : undefined,
    next: idx >= 0 && idx < ALL_ITEMS.length - 1 ? ALL_ITEMS[idx + 1] : undefined,
  };
}

/** Group label that owns a given slug (for breadcrumbs). */
export function groupOf(slug: string[]): string | undefined {
  const key = slug.join("/");
  return NAV.find((s) => s.items.some((i) => i.slug.join("/") === key))?.group;
}

export const REPO_URL = "https://github.com/VincenImanuell/bingocle";
export const HOME_SLUG = ["getting-started", "introduction"];
