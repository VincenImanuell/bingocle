import { ethers } from "ethers";
import { config } from "./config.js";

/**
 * Per-user TESTNET DEMO wallets. Each Telegram user gets a deterministic
 * embedded wallet derived from a master mnemonic + their user id — the Web2
 * onboarding story: play with no seed phrase, no extension. Testnet only;
 * never point DEMO_WALLET_MNEMONIC at anything holding real value.
 */
let _provider: ethers.JsonRpcProvider | null = null;
export function provider(): ethers.JsonRpcProvider {
  if (!_provider) _provider = new ethers.JsonRpcProvider(config.rpcUrl, config.chainId);
  return _provider;
}

const cache = new Map<string, ethers.HDNodeWallet>();

export function walletFor(userId: number | string): ethers.HDNodeWallet {
  const key = String(userId);
  const cached = cache.get(key);
  if (cached) return cached;
  if (!config.demoMnemonic) throw new Error("DEMO_WALLET_MNEMONIC not set");

  // Derive a unique child wallet per user from the master mnemonic.
  const root = ethers.HDNodeWallet.fromPhrase(config.demoMnemonic);
  const idx = Number(BigInt(ethers.id(key)) % 2_000_000_000n);
  const child = root.deriveChild(idx).connect(provider());
  cache.set(key, child);
  return child;
}
