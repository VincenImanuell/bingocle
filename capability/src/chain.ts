import { ethers } from "ethers";
import { config } from "./config.js";
import { provider } from "./wallets.js";
import { ABIS } from "./abis.js";

/**
 * On-chain bindings for the player-side verbs (buy / sell / card / claim / price).
 * ABIs are EMBEDDED (see abis.ts) so the Capability runs from its published package
 * alone — no local Foundry build, no repo checkout. Addresses come from env.
 */
function at(name: string, address: string, runner: ethers.ContractRunner): ethers.Contract {
  if (!address) throw new Error(`Missing address for ${name}`);
  const abi = ABIS[name];
  if (!abi) throw new Error(`No embedded ABI for ${name}`);
  return new ethers.Contract(address, abi, runner);
}

const A = config.addresses;

export const read = {
  eventFactory: () => at("EventFactory", A.eventFactory, provider()),
  wordPool: () => at("WordPool", A.wordPool, provider()),
  wordMarket: () => at("WordMarket", A.wordMarket, provider()),
};

/** Contracts bound to a player's demo wallet (for buy / claim). */
export function asUser(signer: ethers.Wallet | ethers.HDNodeWallet) {
  return {
    wordMarket: () => at("WordMarket", A.wordMarket, signer),
    bingoCardNFT: () => at("BingoCardNFT", A.bingoCardNFT, signer),
    rewardVault: () => at("RewardVault", A.rewardVault, signer),
  };
}

/** Find a word's on-chain index by its canonical text (via committed hashes). */
export async function wordIndexOf(eventId: number, word: string): Promise<number> {
  const pool = read.wordPool();
  const n = Number(await pool.wordCount(eventId));
  const target = ethers.keccak256(ethers.toUtf8Bytes(word));
  for (let i = 0; i < n; i++) {
    const h: string = await pool.wordHashOf(eventId, i);
    if (h.toLowerCase() === target.toLowerCase()) return i;
  }
  return -1;
}
