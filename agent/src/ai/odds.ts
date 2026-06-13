import { z } from "zod";
import { structured } from "./gemini.js";
import { SCALE } from "../config.js";
import type { CuratedWord } from "./curator.js";

export type WordOdds = {
  word: string;
  aiProb: number; // 0..1, the LLM's spoken-probability estimate
  price1e4: number; // opening price, 1e4 fixed-point (<= SCALE)
  mult1e4: number; // payout multiplier, 1e4 fixed-point (>= SCALE)
};

const OddsOut = z.object({
  estimates: z.array(z.object({ word: z.string(), aiProb: z.number() })),
});

const JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    estimates: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: { word: { type: "string" }, aiProb: { type: "number" } },
        required: ["word", "aiProb"],
      },
    },
  },
  required: ["estimates"],
};

const SYSTEM = `You are the Bingocle AI Odds Engine. For each word, estimate the probability (0..1) that a speaker on the given theme will SAY IT OUT LOUD at least once during the event. Consider how generic/common the word is for this theme and speaker. Common, theme-central words -> high probability (0.8-0.95). Niche or surprising words -> low (0.1-0.3). Return one estimate per input word, using the exact word strings given. Return ONLY the JSON object.`;

function clamp(x: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, x));
}

/**
 * Blend the LLM's probability with community vote share into an opening price
 * and multiplier. Deterministic given (aiProb, votes) so the math is auditable
 * on-chain. price = implied probability; mult = (1/price) * (1 - vig).
 */
export async function computeOdds(args: {
  theme: string;
  description: string;
  pool: CuratedWord[];
}): Promise<WordOdds[]> {
  const out = await structured({
    system: SYSTEM,
    user: `Theme: ${args.theme}\nEvent: ${args.description}\n\nWords:\n${args.pool
      .map((w) => w.word)
      .join("\n")}`,
    jsonSchema: JSON_SCHEMA,
    zodSchema: OddsOut,
    maxTokens: 4000,
  });

  const probByWord = new Map(out.estimates.map((e) => [e.word, clamp(e.aiProb, 0, 1)]));
  return blend(args.pool, probByWord);
}

/**
 * Pure odds math: blend LLM probability (60%) with community vote share (40%),
 * clamp away from 0/1, derive price = implied probability and
 * mult = (1/price) * (1 - vig). Deterministic so the on-chain odds are auditable.
 */
export function blend(
  pool: CuratedWord[],
  probByWord: Map<string, number>,
  vig = 0.12,
): WordOdds[] {
  const maxVotes = Math.max(1, ...pool.map((w) => w.votes));
  return pool.map((w) => {
    const aiProb = probByWord.get(w.word) ?? 0.3;
    const voteWeight = w.votes / maxVotes; // 0..1
    const p = clamp(0.6 * aiProb + 0.4 * voteWeight, 0.05, 0.95);
    const mult = clamp((1 / p) * (1 - vig), 1.05, 5.0);
    return {
      word: w.word,
      aiProb,
      price1e4: Math.round(p * SCALE),
      mult1e4: Math.round(mult * SCALE),
    };
  });
}
