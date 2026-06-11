import { contracts } from "../chain.js";
import { matchTranscript, type OracleMatch } from "../ai/oracle.js";
import { getEvent } from "../store.js";
import { SCALE } from "../config.js";

export type CommitResult = OracleMatch & { txHash: string };

/** Read the on-chain validated bitmap into a Set of word indices. */
async function alreadyValidated(eventId: number): Promise<Set<number>> {
  const bitmap: bigint = await contracts.oracleRegistry().validatedBitmap(eventId);
  const set = new Set<number>();
  for (let i = 0; i < 256; i++) {
    if ((bitmap >> BigInt(i)) & 1n) set.add(i);
  }
  return set;
}

/**
 * Run the AI Validation Oracle on a transcript chunk and commit every fresh,
 * confident match to OracleRegistry on Mantle. The on-chain write is what
 * triggers card marking + settlement.
 */
export async function validateTranscript(args: {
  eventId: number;
  transcript: string;
  minConfidence?: number;
}): Promise<CommitResult[]> {
  const rec = getEvent(args.eventId);
  if (!rec) throw new Error(`Unknown event ${args.eventId} (commit its pool first).`);

  const seen = await alreadyValidated(args.eventId);
  const matches = await matchTranscript({
    transcript: args.transcript,
    pool: rec.words,
    alreadyValidated: seen,
  });

  const minConf = args.minConfidence ?? 0.6;
  const registry = contracts.oracleRegistry();
  const out: CommitResult[] = [];

  for (const m of matches) {
    if (m.confidence < minConf) continue;
    const conf1e4 = Math.round(m.confidence * SCALE);
    const tx = await registry.commitValidation(args.eventId, m.wordIndex, conf1e4, m.snippet);
    const receipt = await tx.wait();
    out.push({ ...m, txHash: receipt?.hash ?? tx.hash });
  }
  return out;
}
