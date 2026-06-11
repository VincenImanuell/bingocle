/**
 * Demo driver for the AI Validation Oracle on recorded audio/transcript.
 * Usage: tsx src/cli/oracle.ts <eventId> [path/to/transcript.txt]
 *
 * Splits the transcript into paragraph "chunks" (simulating live STT output),
 * runs the LLM matcher on each, and commits fresh verdicts to OracleRegistry.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateTranscript } from "../services/oracleRun.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const eventId = Number(process.argv[2]);
  if (!eventId) throw new Error("usage: tsx src/cli/oracle.ts <eventId> [transcript.txt]");
  const file = process.argv[3] ?? path.resolve(__dirname, "..", "..", "demo", "transcript.txt");
  const text = fs.readFileSync(file, "utf8");
  const chunks = text.split(/\n\s*\n/).map((c) => c.trim()).filter(Boolean);

  for (let i = 0; i < chunks.length; i++) {
    console.log(`\n--- chunk ${i + 1}/${chunks.length} ---`);
    const commits = await validateTranscript({ eventId, transcript: chunks[i] });
    for (const c of commits) {
      console.log(`  ✅ ${c.word} (conf ${c.confidence.toFixed(2)}) tx ${c.txHash}`);
    }
    if (commits.length === 0) console.log("  (no new words)");
  }
  console.log("\nOracle run complete.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
