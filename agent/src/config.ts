import "dotenv/config";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function req(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

/** Multipliers/prices are 1e4 fixed-point on-chain (10000 == 1.0x / 1.0). */
export const SCALE = 10_000;

export const config = {
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
  model: "gemini-2.0-flash",

  rpcUrl: process.env.MANTLE_RPC_URL ?? "https://rpc.sepolia.mantle.xyz",
  chainId: Number(process.env.CHAIN_ID ?? 5003),
  agentPrivateKey: process.env.AGENT_PRIVATE_KEY ?? "",

  addresses: {
    eventFactory: process.env.EVENT_FACTORY_ADDRESS ?? "",
    wordPool: process.env.WORD_POOL_ADDRESS ?? "",
    wordMarket: process.env.WORD_MARKET_ADDRESS ?? "",
    oracleRegistry: process.env.ORACLE_REGISTRY_ADDRESS ?? "",
    bingoCardNFT: process.env.BINGO_CARD_NFT_ADDRESS ?? "",
    rewardVault: process.env.REWARD_VAULT_ADDRESS ?? "",
    agentIdentity: process.env.AGENT_IDENTITY_ADDRESS ?? "",
  },

  port: Number(process.env.PORT ?? 8787),
  contractsOut:
    process.env.CONTRACTS_OUT ??
    path.resolve(__dirname, "..", "..", "contracts", "out"),
};

export function requireGemini(): string {
  return req("GEMINI_API_KEY");
}

export function requireSigner(): { key: string } {
  return { key: req("AGENT_PRIVATE_KEY") };
}
