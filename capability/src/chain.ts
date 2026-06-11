import fs from "node:fs";
import path from "node:path";
import { ethers } from "ethers";
import { config } from "./config.js";
import { provider } from "./wallets.js";

function loadAbi(name: string): ethers.InterfaceAbi {
  const file = path.join(config.contractsOut, `${name}.sol`, `${name}.json`);
  if (!fs.existsSync(file)) throw new Error(`ABI not found: ${file} (run forge build).`);
  return JSON.parse(fs.readFileSync(file, "utf8")).abi as ethers.InterfaceAbi;
}

function at(name: string, address: string, runner: ethers.ContractRunner): ethers.Contract {
  if (!address) throw new Error(`Missing address for ${name}`);
  return new ethers.Contract(address, loadAbi(name), runner);
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
