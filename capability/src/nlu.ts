import { config } from "./config.js";
import { isVerb, START_TEXT } from "./commands.js";

/**
 * Natural-language understanding for channel-native chat. Players don't have to
 * memorize slash commands — "buy me 2 shares of airdrop in event 1", "what's my
 * wallet?", "I bet she says mainnet and oracle" all map to the right verb.
 *
 * Layered so the Capability degrades gracefully:
 *   1. Deterministic — the message already starts with a known verb / slash cmd.
 *   2. Gemini intent extraction — extracts STRUCTURED fields, then we assemble the
 *      canonical command line ourselves (robust arg order). Needs GEMINI_API_KEY.
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

const INT = /^\d+$/;
const NUM = /^\d+(\.\d+)?$/;

/** True when `rest` is already in the canonical positional arg form for `verb`. */
function looksCanonical(verb: string, rest: string): boolean {
  const a = rest.trim().split(/\s+/).filter(Boolean);
  switch (verb) {
    case "wallet":
    case "start":
    case "help":
    case "agentguide":
      return rest.trim() === "";
    case "create":
      return rest.trim() !== ""; // theme is freeform
    case "pool":
    case "card":
    case "claim":
      return a.length === 1 && INT.test(a[0]);
    case "price":
      return a.length === 2 && INT.test(a[0]);
    case "buy":
    case "sell":
      return a.length === 3 && INT.test(a[0]) && NUM.test(a[2]);
    case "submit":
    case "finalize":
    case "validate":
      return a.length >= 1 && INT.test(a[0]);
    default:
      return false;
  }
}

const SYSTEM = `You extract intent for Bingocle, a chat-based bingo prediction market on Mantle.
Read the user's message and return JSON with this exact shape:
{
  "action": one of "wallet","create","submit","pool","card","price","buy","sell","finalize","validate","claim","agentguide","none",
  "eventId": integer or null,     // the numeric event id
  "word": string or null,         // a single word (for price/buy/sell)
  "words": array of strings or null, // predicted words (for submit)
  "shares": string or null,       // share amount as a string, e.g. "2" or "0.5" (for buy/sell)
  "theme": string or null,        // event theme (for create/finalize)
  "transcript": string or null,   // transcript text (for validate)
  "reply": string or null         // a short clarifying question if a REQUIRED field is missing
}
What each action needs: wallet/agentguide -> nothing. create -> theme(optional). submit -> eventId + words.
pool/card/claim -> eventId. price -> eventId + word. buy/sell -> eventId + word + shares.
finalize -> eventId (+ theme). validate -> eventId (+ transcript).
Rules:
- Extract numbers/words literally; do NOT invent an eventId. If a required field is missing, set action to
  the intended verb, leave the missing field null, and put a one-line question in "reply".
- "I think/bet she'll say X and Y" => action "submit", words ["X","Y"].
- If the message isn't a Bingocle request, action "none" with a helpful "reply".
Return ONLY the JSON object.`;

type Extract = {
  action?: string;
  eventId?: number | null;
  word?: string | null;
  words?: string[] | null;
  shares?: string | null;
  theme?: string | null;
  transcript?: string | null;
  reply?: string | null;
};

function stripFences(s: string): string {
  return s.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
}

/** Assemble the canonical `rest` string for a verb from extracted fields, or ask. */
function assemble(e: Extract): Interpretation {
  const action = (e.action ?? "none").toLowerCase();
  const ask = (q: string): Interpretation => ({ kind: "reply", text: e.reply?.trim() || q });
  const id = e.eventId;

  switch (action) {
    case "wallet":
    case "agentguide":
      return { kind: "command", cmd: action, rest: "" };
    case "create":
      return { kind: "command", cmd: "create", rest: (e.theme ?? "").trim() };
    case "pool":
    case "card":
    case "claim":
      if (id == null) return ask(`Which event id? e.g. "${action} 1".`);
      return { kind: "command", cmd: action, rest: String(id) };
    case "price":
      if (id == null || !e.word) return ask('Tell me event id + word, e.g. "price 1 airdrop".');
      return { kind: "command", cmd: "price", rest: `${id} ${e.word}` };
    case "buy":
    case "sell":
      if (id == null || !e.word || !e.shares)
        return ask(`Need event id, word, and amount — e.g. "${action} 1 airdrop 2".`);
      return { kind: "command", cmd: action, rest: `${id} ${e.word} ${e.shares}` };
    case "submit":
      if (id == null || !e.words || !e.words.length)
        return ask('Which event + words? e.g. "submit 1 airdrop, mainnet".');
      return { kind: "command", cmd: "submit", rest: `${id} ${e.words.join(", ")}` };
    case "finalize":
      if (id == null) return ask('Which event id to finalize? e.g. "finalize 1 Web3 Demo".');
      return { kind: "command", cmd: "finalize", rest: `${id} ${(e.theme ?? "").trim()}`.trim() };
    case "validate":
      if (id == null) return ask('Which event id to validate? e.g. "validate 1".');
      return { kind: "command", cmd: "validate", rest: `${id} ${(e.transcript ?? "").trim()}`.trim() };
    default:
      return { kind: "reply", text: e.reply?.trim() || "" };
  }
}

async function geminiIntent(text: string): Promise<Interpretation | null> {
  try {
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const model = new GoogleGenerativeAI(config.geminiApiKey).getGenerativeModel({
      model: config.geminiModel,
      systemInstruction: SYSTEM,
      generationConfig: {
        responseMimeType: "application/json",
        maxOutputTokens: 512,
      } as any,
    });
    const result = await model.generateContent(text);
    const parsed = JSON.parse(stripFences(result.response.text())) as Extract;
    const out = assemble(parsed);
    if (out.kind === "command" && !isVerb(out.cmd)) return null;
    if (out.kind === "reply" && !out.text) return null;
    return out;
  } catch {
    return null; // any LLM/parse failure falls through to the deterministic fallback
  }
}

export async function interpret(text: string): Promise<Interpretation> {
  const trimmed = text.trim();
  if (!trimmed) return { kind: "reply", text: START_TEXT };

  // 1. Explicit command? Short-circuit (skip the LLM) when it's unambiguous: a slash
  //    command, no LLM configured, or args ALREADY in canonical positional form
  //    (e.g. "buy 1 airdrop 2"). Only natural phrasing with a leading verb
  //    ("buy 2 shares of airdrop in event 1") falls through to Gemini to normalize.
  const { first, rest } = splitFirst(trimmed);
  const verb = first.replace(/^\//, "").toLowerCase();
  if (isVerb(verb)) {
    if (trimmed.startsWith("/") || !config.geminiApiKey || looksCanonical(verb, rest)) {
      return { kind: "command", cmd: verb, rest };
    }
  }

  // 2. Gemini structured intent extraction (when configured).
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
