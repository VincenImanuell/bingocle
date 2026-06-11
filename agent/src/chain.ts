import fs from "node:fs";
import path from "node:path";
import { ethers } from "ethers";
import { config } from "./config.js";

/** Load a contract ABI from the Foundry build output. */
function loadAbi(name: string): ethers.InterfaceAbi {
  const file = path.join(config.contractsOut, `${name}.sol`, `${name}.json`);
  if (!fs.existsSync(file)) {
    throw new Error(
      `ABI not found: ${file}. Run \`forge build\` in contracts/ first (or set CONTRACTS_OUT).`,
    );
  }
  const artifact = JSON.parse(fs.readFileSync(file, "utf8"));
  return artifact.abi as ethers.InterfaceAbi;
}

let _provider: ethers.JsonRpcProvider | null = null;
export function provider(): ethers.JsonRpcProvider {
  if (!_provider) {
    _provider = new ethers.JsonRpcProvider(config.rpcUrl, config.chainId);
  }
  return _provider;
}

let _signer: ethers.Wallet | null = null;
export function signer(): ethers.Wallet {
  if (!_signer) {
    if (!config.agentPrivateKey) throw new Error("Missing AGENT_PRIVATE_KEY");
    _signer = new ethers.Wallet(config.agentPrivateKey, provider());
  }
  return _signer;
}

/** Build a read/write contract instance bound to the agent signer. */
function contract(name: string, address: string): ethers.Contract {
  if (!address) throw new Error(`Missing address for ${name} (set it in .env)`);
  return new ethers.Contract(address, loadAbi(name), signer());
}

export const contracts = {
  eventFactory: () => contract("EventFactory", config.addresses.eventFactory),
  wordPool: () => contract("WordPool", config.addresses.wordPool),
  wordMarket: () => contract("WordMarket", config.addresses.wordMarket),
  oracleRegistry: () => contract("OracleRegistry", config.addresses.oracleRegistry),
  bingoCardNFT: () => contract("BingoCardNFT", config.addresses.bingoCardNFT),
  rewardVault: () => contract("RewardVault", config.addresses.rewardVault),
  agentIdentity: () => contract("AgentIdentity", config.addresses.agentIdentity),
};

/** keccak256 of the canonical word string — matches WordPool.wordHashOf. */
export function wordHash(word: string): string {
  return ethers.keccak256(ethers.toUtf8Bytes(word));
}

/** Build a simple merkle root over the ordered word hashes (keccak, sorted-pair). */
export function merkleRoot(words: string[]): string {
  let layer = words.map(wordHash);
  if (layer.length === 0) return ethers.ZeroHash;
  while (layer.length > 1) {
    const next: string[] = [];
    for (let i = 0; i < layer.length; i += 2) {
      const a = layer[i];
      const b = i + 1 < layer.length ? layer[i + 1] : layer[i];
      const [lo, hi] = a < b ? [a, b] : [b, a];
      next.push(ethers.keccak256(ethers.concat([lo, hi])));
    }
    layer = next;
  }
  return layer[0];
}
