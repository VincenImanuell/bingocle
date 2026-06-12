/**
 * Validation Oracle on real audio: Whisper STT -> LLM match -> on-chain commit.
 * Usage: tsx src/cli/validateAudio.ts <eventId> <audio.(mp3|wav|m4a)>
 *
 * Requires OPENAI_API_KEY (Whisper) + the usual agent .env. For the rehearsed/
 * recorded demo without audio, use `npm run oracle` (transcript text) instead.
 */
import { transcribeAudio } from "../ai/stt.js";
import { validateTranscript } from "../services/oracleRun.js";

async function main() {
  const eventId = Number(process.argv[2]);
  const audio = process.argv[3];
  if (!eventId || !audio) throw new Error("usage: tsx src/cli/validateAudio.ts <eventId> <audioFile>");

  console.log(`🎙️  transcribing ${audio} …`);
  const transcript = await transcribeAudio(audio);
  console.log(`transcript (${transcript.length} chars):\n${transcript.slice(0, 400)}…\n`);

  const commits = await validateTranscript({ eventId, transcript });
  for (const c of commits) console.log(`  ✅ ${c.word} (conf ${c.confidence.toFixed(2)}) tx ${c.txHash}`);
  if (commits.length === 0) console.log("  (no new words validated)");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
