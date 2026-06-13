/**
 * Commit a deterministic (hand-built) word pool to an EXISTING event, bypassing the
 * AI curator — reliable when the Gemini free tier is rate-limited. Curator-gated, so
 * run with the agent wallet. Must run before the event's marketLock.
 *
 *   EVENT_ID=2 npm run commit:direct      (or: tsx scripts/commit-pool-direct.ts 2)
 */
import { ethers } from "ethers";
import { contracts, wordHash, merkleRoot } from "../src/chain.js";

const EID = Number(process.env.EVENT_ID ?? process.argv[2] ?? 0);
if (!EID) throw new Error("set EVENT_ID (e.g. EVENT_ID=2)");

const WORDS = [
  "airdrop", "mainnet", "liquidity", "oracle", "agent", "wallet",
  "rollup", "modular", "restaking", "TVL", "gasless", "bridge",
  "zk", "settlement", "validator", "token", "yield", "onchain",
  "consumer", "viral", "bingo", "Mantle", "Animoca", "Turing",
];

async function main() {
  const hashes = WORDS.map(wordHash);
  const prices = WORDS.map(() => 5000); // 0.50 opening (1e4 fixed point)
  const mults = WORDS.map(() => 20000); // 2.00x
  const founders = WORDS.map(() => ethers.ZeroAddress);
  const tx = await contracts
    .wordPool()
    .commitPool(EID, hashes, prices, mults, founders, merkleRoot(WORDS));
  const r = await tx.wait();
  console.log(`✅ committed ${WORDS.length} words to event ${EID} — tx ${r?.hash ?? tx.hash}`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("❌ commit failed:", e?.shortMessage ?? e?.message ?? e);
    process.exit(1);
  });
