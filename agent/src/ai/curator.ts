import { z } from "zod";
import { structured } from "./anthropic.js";

export type Submission = { raw: string; wallet: string; ts: number };

export type CuratedWord = {
  word: string; // canonical form
  votes: number;
  founder: string; // earliest submitter wallet, or "" if AI-suggested filler
  aiSuggested: boolean;
};

export type CurationResult = {
  pool: CuratedWord[]; // final >=24-word pool, vote-desc
  decisions: Decision[]; // per-submission audit trail
};

const Decision = z.object({
  input: z.string(),
  status: z.enum(["accepted", "merged", "rejected"]),
  canonical: z.string().optional(),
  reason: z.string().optional(),
});
export type Decision = z.infer<typeof Decision>;

const CuratorOut = z.object({
  decisions: z.array(Decision),
  suggested: z.array(z.string()),
});

const JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    decisions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          input: { type: "string" },
          status: { type: "string", enum: ["accepted", "merged", "rejected"] },
          canonical: { type: "string" },
          reason: { type: "string" },
        },
        required: ["input", "status"],
      },
    },
    suggested: { type: "array", items: { type: "string" } },
  },
  required: ["decisions", "suggested"],
};

const SYSTEM = `You are the Bingocle AI Word Curator. Players submit single words or short phrases they predict a speaker will SAY OUT LOUD during a live event. Curate them into a clean bingo word pool.

For each submission decide a status:
- "accepted": a valid, on-theme, distinct word. Set "canonical" to its normalized form (Title Case; expand/standardize known forms, e.g. "ai"/"a.i."/"artificial intelligence" -> "AI"; "web 3" -> "Web3"; "smartcontract" -> "Smart Contract").
- "merged": same meaning as another accepted word (a synonym/acronym/spelling variant). Set "canonical" to the SAME canonical form the other one uses. Its vote still counts; the founder seat goes to the earliest submitter.
- "rejected": profanity, spam, links, pure filler/stopwords ("the","and"), or clearly off-theme. Set "reason" briefly.

Rules:
- Normalize aggressively so duplicates collapse to one canonical word.
- Prefer short, speakable words (a word or 2-3 word phrase), max ~18 chars.
- Also propose extra on-theme words in "suggested" (8-15 of them) that a speaker on this theme is very likely to say, to round out the pool. Do not duplicate accepted canonicals.
Return ONLY the JSON object.`;

/**
 * Curate raw community submissions into a final pool of >= 24 canonical words.
 * Founder of each word = earliest (smallest ts) submitter whose submission
 * maps to that canonical. AI-suggested fillers have founder "".
 */
export async function curate(args: {
  theme: string;
  description: string;
  submissions: Submission[];
  poolSize?: number; // target distinct words (default 24)
}): Promise<CurationResult> {
  const poolSize = args.poolSize ?? 24;
  // stable order by timestamp so "earliest submitter" is deterministic
  const subs = [...args.submissions].sort((a, b) => a.ts - b.ts);

  const out = await structured({
    system: SYSTEM,
    user: `Theme: ${args.theme}\nEvent: ${args.description}\n\nSubmissions (in order):\n${subs
      .map((s, i) => `${i}. "${s.raw}" (by ${s.wallet})`)
      .join("\n")}`,
    jsonSchema: JSON_SCHEMA,
    zodSchema: CuratorOut,
    maxTokens: 8000,
  });

  const pool = aggregate(subs, out.decisions, out.suggested, poolSize);
  return { pool, decisions: out.decisions };
}

/**
 * Pure aggregation: votes per canonical, earliest submitter = founder, AI fillers
 * to reach poolSize, vote-desc, capped at 40 for on-chain gas. `subsSorted` must
 * be ascending by ts so the first occurrence of a canonical is its founder.
 */
export function aggregate(
  subsSorted: Submission[],
  decisions: Decision[],
  suggested: string[],
  poolSize: number,
): CuratedWord[] {
  const byCanonical = new Map<string, CuratedWord>();
  const decisionByInput = new Map<string, Decision>();
  for (const d of decisions) decisionByInput.set(d.input, d);

  for (const s of subsSorted) {
    const d = decisionByInput.get(s.raw);
    if (!d || d.status === "rejected" || !d.canonical) continue;
    const key = d.canonical;
    const existing = byCanonical.get(key);
    if (existing) {
      existing.votes += 1; // later submitter -> vote only
    } else {
      byCanonical.set(key, { word: key, votes: 1, founder: s.wallet, aiSuggested: false });
    }
  }

  for (const w of suggested) {
    if (byCanonical.size >= poolSize) break;
    const key = w.trim();
    if (!key || byCanonical.has(key)) continue;
    byCanonical.set(key, { word: key, votes: 0, founder: "", aiSuggested: true });
  }

  return [...byCanonical.values()].sort((a, b) => b.votes - a.votes).slice(0, 40);
}
