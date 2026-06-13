import type { ComponentType } from "react";

// Explicit MDX import map. We avoid template-literal dynamic imports so the
// bundler (Turbopack) can statically resolve and code-split every page.
// Keys are the URL path ("group/name"); values lazily import the MDX module.
type MdxModule = { default: ComponentType };

export const PAGES: Record<string, () => Promise<MdxModule>> = {
  "getting-started/introduction": () =>
    import("@/content/getting-started/introduction.mdx"),
  "getting-started/quick-start": () =>
    import("@/content/getting-started/quick-start.mdx"),
  "getting-started/architecture": () =>
    import("@/content/getting-started/architecture.mdx"),

  "contracts/overview": () => import("@/content/contracts/overview.mdx"),
  "contracts/event-factory": () =>
    import("@/content/contracts/event-factory.mdx"),
  "contracts/word-pool": () => import("@/content/contracts/word-pool.mdx"),
  "contracts/word-market": () => import("@/content/contracts/word-market.mdx"),
  "contracts/oracle-registry": () =>
    import("@/content/contracts/oracle-registry.mdx"),
  "contracts/bingo-card-nft": () =>
    import("@/content/contracts/bingo-card-nft.mdx"),
  "contracts/reward-vault": () =>
    import("@/content/contracts/reward-vault.mdx"),
  "contracts/agent-identity": () =>
    import("@/content/contracts/agent-identity.mdx"),
  "contracts/deployment": () => import("@/content/contracts/deployment.mdx"),

  "agent/overview": () => import("@/content/agent/overview.mdx"),
  "agent/ai-curator": () => import("@/content/agent/ai-curator.mdx"),
  "agent/odds-engine": () => import("@/content/agent/odds-engine.mdx"),
  "agent/validation-oracle": () =>
    import("@/content/agent/validation-oracle.mdx"),
  "agent/http-api": () => import("@/content/agent/http-api.mdx"),

  "capability/overview": () => import("@/content/capability/overview.mdx"),
  "capability/commands": () => import("@/content/capability/commands.mdx"),
  "capability/wallets-and-nlu": () =>
    import("@/content/capability/wallets-and-nlu.mdx"),

  "frontend/overview": () => import("@/content/frontend/overview.mdx"),
  "frontend/routes-and-web3": () =>
    import("@/content/frontend/routes-and-web3.mdx"),

  "guides/game-loop": () => import("@/content/guides/game-loop.mdx"),
  "guides/trust-model": () => import("@/content/guides/trust-model.mdx"),
  "guides/security": () => import("@/content/guides/security.mdx"),
  "guides/local-development": () =>
    import("@/content/guides/local-development.mdx"),
};

export function loadPage(slug: string[]) {
  return PAGES[slug.join("/")];
}
