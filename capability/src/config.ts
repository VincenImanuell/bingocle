import "dotenv/config";

export const config = {
  telegramToken: process.env.TELEGRAM_BOT_TOKEN ?? "",
  agentApiUrl: process.env.AGENT_API_URL ?? "http://localhost:8787",
  rpcUrl: process.env.MANTLE_RPC_URL ?? "https://rpc.sepolia.mantle.xyz",
  chainId: Number(process.env.CHAIN_ID ?? 5003),
  demoMnemonic: process.env.DEMO_WALLET_MNEMONIC ?? "",

  // Optional natural-language understanding. When set, free-text (non-command)
  // messages are interpreted into a Bingocle verb via Gemini. Without it, the
  // Capability still works fully via slash/verb commands (deterministic fallback).
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
  geminiModel: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",

  addresses: {
    eventFactory: process.env.EVENT_FACTORY_ADDRESS ?? "",
    wordPool: process.env.WORD_POOL_ADDRESS ?? "",
    wordMarket: process.env.WORD_MARKET_ADDRESS ?? "",
    oracleRegistry: process.env.ORACLE_REGISTRY_ADDRESS ?? "",
    bingoCardNFT: process.env.BINGO_CARD_NFT_ADDRESS ?? "",
    rewardVault: process.env.REWARD_VAULT_ADDRESS ?? "",
    agentIdentity: process.env.AGENT_IDENTITY_ADDRESS ?? "",
  },

  // Email channel (optional second surface). IMAP poll in, SMTP reply out.
  email: {
    imapHost: process.env.IMAP_HOST ?? "",
    imapPort: Number(process.env.IMAP_PORT ?? 993),
    imapUser: process.env.IMAP_USER ?? "",
    imapPass: process.env.IMAP_PASS ?? "",
    smtpHost: process.env.SMTP_HOST ?? "",
    smtpPort: Number(process.env.SMTP_PORT ?? 465),
    smtpUser: process.env.SMTP_USER ?? process.env.IMAP_USER ?? "",
    smtpPass: process.env.SMTP_PASS ?? process.env.IMAP_PASS ?? "",
    from: process.env.EMAIL_FROM ?? process.env.IMAP_USER ?? "",
    pollMs: Number(process.env.EMAIL_POLL_MS ?? 15000),
  },
};
