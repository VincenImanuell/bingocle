import { ethers } from "ethers";
import { agentApi } from "./api.js";
import { walletFor, provider } from "./wallets.js";
import { asUser, read, wordIndexOf } from "./chain.js";
import { AGENT_GUIDE } from "./guide.js";

/**
 * Channel-agnostic command core. Both the Telegram bot and the email adapter call
 * these — one implementation, two surfaces. `userKey` identifies a player (Telegram
 * user id or email address) and maps to their embedded testnet demo wallet.
 */

// Off-chain submission inbox per event (until the AI Curator commits the pool).
type Sub = { raw: string; wallet: string; ts: number };
const inbox = new Map<number, Sub[]>();

const DEMO_LINE =
  "So when we plugged the model in, the AI started flagging duplicates. We are targeting mainnet, and settlement happens on Mantle. The AI oracle writes its verdict on-chain.";

export async function cmdWallet(userKey: string): Promise<string> {
  const w = walletFor(userKey);
  const bal = await provider().getBalance(w.address);
  return `👛 Your demo wallet:\n${w.address}\nBalance: ${ethers.formatEther(bal)} MNT`;
}

export async function cmdCreate(theme: string): Promise<string> {
  const t = theme || "Web3 · AI · Startup";
  const { eventId, txHash } = await agentApi.createEvent({});
  inbox.set(eventId, []);
  return (
    `✅ Event #${eventId} created (theme: ${t}).\ntx: ${txHash}\n\n` +
    `Players: submit ${eventId} airdrop, mainnet, liquidity\n` +
    `Organizer: finalize ${eventId} ${t}`
  );
}

export function cmdSubmit(userKey: string, id: number, words: string[]): string {
  if (!id || words.length === 0) return "Usage: submit <id> word1, word2, word3";
  if (words.length > 3) return "Max 3 words per wallet.";
  const w = walletFor(userKey);
  const list = inbox.get(id) ?? [];
  const ts = Math.floor(Date.now() / 1000);
  for (const raw of words) list.push({ raw, wallet: w.address, ts });
  inbox.set(id, list);
  return `📝 Submitted to #${id}: ${words.join(", ")}. First submitter founds each word.`;
}

export async function cmdFinalize(id: number, theme: string): Promise<string> {
  const submissions = inbox.get(id) ?? [];
  const rec = await agentApi.commitPool(id, {
    theme: theme || "Web3 · AI · Startup",
    description: theme || "Web3 · AI · Startup",
    submissions,
  });
  const top = rec.odds
    .slice(0, 6)
    .map((o: any) => `${o.word} @${(o.price1e4 / 10000).toFixed(2)} / ${(o.mult1e4 / 10000).toFixed(2)}x`)
    .join("\n");
  return `✅ Pool committed (${rec.words.length} words). Sample odds:\n${top}\n\nMarket opens after the founder window.`;
}

export async function cmdPool(id: number): Promise<string> {
  const { record, phase } = await agentApi.getEvent(id);
  if (!record) return `No committed pool for #${id} yet.`;
  const lines = record.odds
    .map(
      (o: any, i: number) =>
        `${i}. ${o.word} — ${(o.price1e4 / 10000).toFixed(2)} / ${(o.mult1e4 / 10000).toFixed(2)}x`,
    )
    .join("\n");
  return `📊 Event #${id} [${phase}]\n${lines}`;
}

export async function cmdCard(userKey: string, id: number): Promise<string> {
  const w = walletFor(userKey);
  let view = await agentApi.card(id, w.address);
  if (!view.hasCard) {
    const tx = await asUser(w).bingoCardNFT().mint(id);
    await tx.wait();
    view = await agentApi.card(id, w.address);
  }
  return renderCard(view.labels, view.markedMask);
}

export async function cmdPrice(id: number, word: string): Promise<string> {
  const idx = await wordIndexOf(id, word);
  if (idx < 0) return `"${word}" is not in event #${id}'s pool.`;
  const price: bigint = await read.wordMarket().spotPrice(id, idx);
  return `📈 "${word}" spot price ≈ ${(+ethers.formatEther(price)).toFixed(3)} MNT/share`;
}

export async function cmdBuy(
  userKey: string,
  id: number,
  word: string,
  shares: string,
): Promise<string> {
  if (!id || !word || !shares) return "Usage: buy <id> <word> <shares>";
  const idx = await wordIndexOf(id, word);
  if (idx < 0) return `"${word}" is not in event #${id}'s pool.`;
  const w = walletFor(userKey);
  const sharesWei = ethers.parseEther(shares);
  const cost: bigint = await read.wordMarket().quoteBuy(id, idx, sharesWei);
  const tx = await asUser(w).wordMarket().buy(id, idx, sharesWei, cost, { value: cost });
  await tx.wait();
  return `✅ Bought ${shares} "${word}" shares for ${(+ethers.formatEther(cost)).toFixed(3)} MNT. Price rises with demand — sell later if it climbs. tx: ${tx.hash}`;
}

export async function cmdSell(
  userKey: string,
  id: number,
  word: string,
  shares: string,
): Promise<string> {
  if (!id || !word || !shares) return "Usage: sell <id> <word> <shares>";
  const idx = await wordIndexOf(id, word);
  if (idx < 0) return `"${word}" is not in event #${id}'s pool.`;
  const w = walletFor(userKey);
  const sharesWei = ethers.parseEther(shares);
  const refund: bigint = await read.wordMarket().quoteSell(id, idx, sharesWei);
  const tx = await asUser(w).wordMarket().sell(id, idx, sharesWei, 0n);
  await tx.wait();
  return `✅ Sold ${shares} "${word}" shares for ${(+ethers.formatEther(refund)).toFixed(3)} MNT. tx: ${tx.hash}`;
}

export async function cmdValidate(id: number, text?: string): Promise<string> {
  if (!id) return "Usage: validate <id> [transcript]";
  const { commits } = await agentApi.validate(id, text ? { transcript: text } : { transcript: DEMO_LINE });
  if (!commits.length) return "No new words validated.";
  return commits.map((c: any) => `✅ "${c.word}" (conf ${c.confidence.toFixed(2)})`).join("\n");
}

export async function cmdClaim(userKey: string, id: number): Promise<string> {
  const u = asUser(walletFor(userKey));
  const out: string[] = [];
  try {
    const tx = await u.wordMarket().redeem(id);
    await tx.wait();
    out.push(`Trading payout redeemed (${tx.hash}).`);
  } catch (e: any) {
    out.push(`Payout: ${e?.shortMessage ?? "nothing to redeem"}.`);
  }
  try {
    const tx = await u.rewardVault().claim(id);
    await tx.wait();
    out.push(`Bingo bonus + founder seed claimed (${tx.hash}).`);
  } catch (e: any) {
    out.push(`Bonus: ${e?.shortMessage ?? "nothing to claim"}.`);
  }
  return "💰 " + out.join("\n");
}

export function renderCard(labels: string[], mask: number): string {
  let out = "🃏 Your card (✓ = hit):\n";
  for (let r = 0; r < 5; r++) {
    const row: string[] = [];
    for (let c = 0; c < 5; c++) {
      const i = r * 5 + c;
      const hit = (mask >> i) & 1;
      const label = (labels[i] ?? "").slice(0, 8).padEnd(8);
      row.push(hit ? `[${label}✓]` : `[${label} ]`);
    }
    out += row.join("") + "\n";
  }
  return out;
}

/** Parse a free-text line ("buy 7 ai 0.5") into a command + args for the email adapter. */
export function parseLine(line: string): { cmd: string; rest: string } {
  const t = line.trim();
  const sp = t.indexOf(" ");
  if (sp < 0) return { cmd: t.toLowerCase(), rest: "" };
  return { cmd: t.slice(0, sp).toLowerCase(), rest: t.slice(sp + 1).trim() };
}

/** Every verb the Capability understands (also used by the NLU layer). */
export const VERBS = [
  "start",
  "help",
  "agentguide",
  "wallet",
  "create",
  "submit",
  "pool",
  "card",
  "price",
  "buy",
  "sell",
  "finalize",
  "validate",
  "claim",
] as const;
export type Verb = (typeof VERBS)[number];

export function isVerb(cmd: string): cmd is Verb {
  return (VERBS as readonly string[]).includes(cmd.replace(/^\//, "").toLowerCase());
}

export const START_TEXT =
  "🎲 Bingocle — trade the words before they hit the card.\n\n" +
  "Predict the words a speaker will say live; an AI oracle calls the bingo on Mantle. " +
  "You get an embedded testnet demo wallet — no seed phrase.\n\n" +
  "Talk to me in plain language (\"show my wallet\", \"buy 2 shares of airdrop in event 1\") " +
  "or use commands:\n\n" +
  "/wallet — your demo wallet\n" +
  "/create <theme> — start an event\n" +
  "/submit <id> word1, word2, word3 — predict words\n" +
  "/pool <id> — see curated words, odds, phase\n" +
  "/card <id> — mint/view your bingo card\n" +
  "/price <id> <word> — current share price\n" +
  "/buy <id> <word> <shares> — buy shares (price rises with demand)\n" +
  "/sell <id> <word> <shares> — sell shares (take profit before lock)\n" +
  "/claim <id> — redeem winnings\n" +
  "/agentguide — full operator guide";

/**
 * One dispatcher for every surface (Telegram, email, NLU). Takes a verb + the
 * raw remainder string and runs the matching command. Arg parsing lives here so
 * all channels behave identically.
 */
export async function dispatch(userKey: string, cmd: string, rest: string): Promise<string> {
  const verb = cmd.replace(/^\//, "").toLowerCase();
  const a = rest.trim().split(/\s+/).filter(Boolean);

  switch (verb) {
    case "start":
      return START_TEXT;
    case "help":
      return START_TEXT;
    case "agentguide":
      return AGENT_GUIDE;
    case "wallet":
      return cmdWallet(userKey);
    case "create":
      return cmdCreate(rest.trim());
    case "submit": {
      const id = Number(a[0]);
      const words = rest
        .slice(rest.indexOf(a[0] ?? "") + (a[0]?.length ?? 0))
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      return cmdSubmit(userKey, id, words);
    }
    case "finalize":
      return cmdFinalize(Number(a[0]), a.slice(1).join(" "));
    case "pool":
      return cmdPool(Number(a[0]));
    case "card":
      return cmdCard(userKey, Number(a[0]));
    case "price":
      return cmdPrice(Number(a[0]), a.slice(1).join(" "));
    case "buy":
      return cmdBuy(userKey, Number(a[0]), a.slice(1, -1).join(" "), a[a.length - 1]);
    case "sell":
      return cmdSell(userKey, Number(a[0]), a.slice(1, -1).join(" "), a[a.length - 1]);
    case "validate":
      return cmdValidate(Number(a[0]), a.slice(1).join(" ") || undefined);
    case "claim":
      return cmdClaim(userKey, Number(a[0]));
    default:
      return `Unknown command "${cmd}". Send /start for the command list.`;
  }
}
