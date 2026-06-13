import { config } from "./config.js";
import { isVerb, START_TEXT } from "./commands.js";

/**
 * Natural-language understanding for channel-native chat. Players don't have to
 * memorize slash commands — "buy me 2 shares of airdrop in event 1", "what's my
 * wallet?", "I bet she says mainnet and oracle" all map to the right verb.
 *
 * Layered so the Capability degrades gracefully:
 *   1. Deterministic — the message already starts with a known verb / slash cmd.
 *   2. Gemini intent extraction — when GEMINI_API_KEY is set.
 *   3. Friendly fallback — ask for the missing piece, never a dead end.
 */
export type Interpretation =
  | { kind: "command"; cmd: string; rest: string }
  | { kind: "reply"; text: string };

function splitFirst(text: string): { first: string; rest: string } {
  const t = text.trim();
  const sp = t.search(/\s/);
  if (sp < 0) return { first: t, rest: "" };
  return { first: t.slice(0, sp), rest: t.slice(sp + 1).trim() };
}

const SYSTEM = `You are the intent parser for Bingocle, a chat-based bingo prediction market on Mantle.
Map the user's message to ONE Bingocle command line, or to a short clarifying reply.

Commands (a "command line" is the verb followed by its args, space-separated):
- wallet                                  -> show the user's demo wallet + balance
- create <theme>                          -> (organizer) start an event
- submit <id> word1, word2, word3         -> predict up to 3 words (comma-separated)
- pool <id>                               -> list curated words, odds, current phase
- card <id>                               -> mint/show the 5x5 bingo card
- price <id> <word>                       -> current share price of a word
- buy <id> <word> <shares>                -> buy shares of a word (e.g. shares = 2 or 0.5)
- sell <id> <word> <shares>               -> sell shares back
- validate <id> [transcript]              -> (organizer) run the AI oracle
- claim <id>                              -> redeem winnings
- agentguide                              -> the full operator guide

Rules:
- "id" is the numeric event id. If the user clearly means an action but omits a required arg
  (event id, word, or share amount), DO NOT guess — return an empty command and a one-line
  "reply" asking only for the missing piece, with a concrete example.
- For predictions ("I think/bet she'll say X and Y"), use submit with the words comma-separated.
- Keep replies short and friendly; no markdown.
Respond ONLY with JSON: {"command": "<command line or empty>", "reply": "<text or empty>"}.`;

function stripFences(s: string): string {
  return s.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
}

async function geminiIntent(text: string): Promise<Interpretation | null> {
  try {
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const model = new GoogleGenerativeAI(config.geminiApiKey).getGenerativeModel({
      model: config.geminiModel,
      systemInstruction: SYSTEM,
      generationConfig: { responseMimeType: "application/json", maxOutputTokens: 256 } as any,
    });
    const result = await model.generateContent(text);
    const raw = stripFences(result.response.text());
    const parsed = JSON.parse(raw) as { command?: string; reply?: string };
    const command = (parsed.command ?? "").trim();
    if (command) {
      const { first, rest } = splitFirst(command);
      if (isVerb(first)) return { kind: "command", cmd: first.replace(/^\//, "").toLowerCase(), rest };
    }
    if (parsed.reply && parsed.reply.trim()) return { kind: "reply", text: parsed.reply.trim() };
    return null;
  } catch {
    return null; // any LLM/parse failure falls through to the deterministic fallback
  }
}

export async function interpret(text: string): Promise<Interpretation> {
  const trimmed = text.trim();
  if (!trimmed) return { kind: "reply", text: START_TEXT };

  // 1. Already a command? (slash or bare verb)
  const { first, rest } = splitFirst(trimmed);
  if (isVerb(first)) {
    return { kind: "command", cmd: first.replace(/^\//, "").toLowerCase(), rest };
  }

  // 2. Gemini intent extraction (when configured).
  if (config.geminiApiKey) {
    const g = await geminiIntent(trimmed);
    if (g) return g;
  }

  // 3. Friendly fallback — never a dead end.
  return {
    kind: "reply",
    text:
      "I didn't catch a Bingocle action. Try plain language like \"buy 2 shares of airdrop in event 1\" " +
      "or a command — send /start to see them all.",
  };
}
