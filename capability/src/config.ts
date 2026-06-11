import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const config = {
  telegramToken: process.env.TELEGRAM_BOT_TOKEN ?? "",
  agentApiUrl: process.env.AGENT_API_URL ?? "http://localhost:8787",
  rpcUrl: process.env.MANTLE_RPC_URL ?? "https://rpc.sepolia.mantle.xyz",
  chainId: Number(process.env.CHAIN_ID ?? 5003),
  demoMnemonic: process.env.DEMO_WALLET_MNEMONIC ?? "",
  addresses: {
    eventFactory: process.env.EVENT_FACTORY_ADDRESS ?? "",
    wordPool: process.env.WORD_POOL_ADDRESS ?? "",
    wordMarket: process.env.WORD_MARKET_ADDRESS ?? "",
    oracleRegistry: process.env.ORACLE_REGISTRY_ADDRESS ?? "",
    bingoCardNFT: process.env.BINGO_CARD_NFT_ADDRESS ?? "",
    rewardVault: process.env.REWARD_VAULT_ADDRESS ?? "",
    agentIdentity: process.env.AGENT_IDENTITY_ADDRESS ?? "",
  },
  contractsOut:
    process.env.CONTRACTS_OUT ??
    path.resolve(__dirname, "..", "..", "contracts", "out"),
};
