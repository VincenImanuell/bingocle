import { z } from "zod";
import { structured } from "./anthropic.js";

export type OracleMatch = {
  wordIndex: number;
  word: string;
  confidence: number; // 0..1
  snippet: string; // short transcript proof
};

const OracleOut = z.object({
  matches: z.array(
    z.object({
      wordIndex: z.number().int(),
      confidence: z.number(),
      snippet: z.string(),
    }),
  ),
});

const JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    matches: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          wordIndex: { type: "integer" },
          confidence: { type: "number" },
          snippet: { type: "string" },
        },
        required: ["wordIndex", "confidence", "snippet"],
      },
    },
  },
  required: ["matches"],
};

const SYSTEM = `You are the Bingocle AI Validation Oracle — the referee. You receive a live transcript snippet and a numbered word pool. Decide which pool words were ACTUALLY SAID in this transcript.

Match meaning, not just surface form: "artificial intelligence" -> "AI"; "digital wallet" -> "Wallet"; plurals/verb forms count. Reject false positives — only report a word if you are confident it was genuinely spoken (not merely related).

For each match return: wordIndex (the number shown), confidence (0..1), and snippet (a short verbatim quote from the transcript that proves it). Do not report a word twice. Return ONLY the JSON object.`;

/** Match spoken words in a transcript chunk against the (already-committed) pool. */
export async function matchTranscript(args: {
  transcript: string;
  pool: string[]; // canonical words, index == on-chain wordIndex
  alreadyValidated?: Set<number>;
}): Promise<OracleMatch[]> {
  const out = await structured({
    system: SYSTEM,
    user: `Word pool:\n${args.pool.map((w, i) => `${i}. ${w}`).join("\n")}\n\nTranscript:\n"""${args.transcript}"""`,
    jsonSchema: JSON_SCHEMA,
    zodSchema: OracleOut,
    maxTokens: 4000,
  });

  return filterMatches(out.matches, args.pool, args.alreadyValidated);
}

/**
 * Pure: keep only in-bounds, not-yet-validated, de-duplicated matches; clamp
 * confidence to [0,1] and cap the proof snippet length.
 */
export function filterMatches(
  raw: { wordIndex: number; confidence: number; snippet: string }[],
  pool: string[],
  alreadyValidated?: Set<number>,
): OracleMatch[] {
  const seen = new Set<number>(alreadyValidated ?? []);
  const result: OracleMatch[] = [];
  for (const m of raw) {
    if (m.wordIndex < 0 || m.wordIndex >= pool.length) continue;
    if (seen.has(m.wordIndex)) continue;
    seen.add(m.wordIndex);
    result.push({
      wordIndex: m.wordIndex,
      word: pool[m.wordIndex],
      confidence: Math.max(0, Math.min(1, m.confidence)),
      snippet: m.snippet.slice(0, 240),
    });
  }
  return result;
}
