/**
 * One-off: seed the local event record (word pool order matching the on-chain
 * commit) then run the oracle on a TEXT transcript and commit verdicts on-chain.
 * Avoids re-transcribing audio. Needs event in Live phase.
 *   EVENT_ID=2 TRANSCRIPT="..." [GEMINI_MODEL=gemini-2.5-flash-lite] npx tsx scripts/validate-text.ts
 */
import { putEvent } from "../src/store.js";
import { validateTranscript } from "../src/services/oracleRun.js";

const EID = Number(process.env.EVENT_ID ?? 0);
const transcript = process.env.TRANSCRIPT ?? "";
if (!EID || !transcript) throw new Error("set EVENT_ID and TRANSCRIPT");

// MUST match the on-chain pool order committed by commit-pool-direct.ts.
const W = [
  "airdrop", "mainnet", "liquidity", "oracle", "agent", "wallet",
  "rollup", "modular", "restaking", "TVL", "gasless", "bridge",
  "zk", "settlement", "validator", "token", "yield", "onchain",
  "consumer", "viral", "bingo", "Mantle", "Animoca", "Turing",
];

async function main() {
  putEvent({
    eventId: EID,
    theme: "Mantle Demo Day · Web3 · AI",
    description: "Mantle Demo Day · Web3 · AI",
    words: W,
    founders: W.map(() => "0x0000000000000000000000000000000000000000"),
    odds: W.map((w) => ({ word: w, aiProb: 0.5, price1e4: 5000, mult1e4: 20000 })),
  });
  const commits = await validateTranscript({ eventId: EID, transcript });
  console.log(
    "COMMITS:",
    JSON.stringify(commits.map((c) => ({ word: c.word, conf: c.confidence, tx: c.txHash })), null, 2),
  );
  if (!commits.length) console.log("(no words matched / committed)");
}

main().then(() => process.exit(0)).catch((e) => { console.error(e?.message ?? e); process.exit(1); });
