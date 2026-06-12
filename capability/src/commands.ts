import { ethers } from "ethers";
import { agentApi } from "./api.js";
import { walletFor, provider } from "./wallets.js";
import { asUser, wordIndexOf } from "./chain.js";

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

export async function cmdBuy(
  userKey: string,
  id: number,
  word: string,
  amount: string,
): Promise<string> {
  if (!id || !word || !amount) return "Usage: buy <id> <word> <amountMNT>";
  const idx = await wordIndexOf(id, word);
  if (idx < 0) return `"${word}" is not in event #${id}'s pool.`;
  const w = walletFor(userKey);
  const value = ethers.parseEther(amount);
  const tx = await asUser(w).wordMarket().buy(id, idx, value, { value });
  await tx.wait();
  return `✅ Bought ${amount} MNT on "${word}" (#${idx}). tx: ${tx.hash}`;
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
    const tx = await u.wordMarket().claim(id);
    await tx.wait();
    out.push(`Prediction rewards claimed (${tx.hash}).`);
  } catch (e: any) {
    out.push(`Prediction: ${e?.shortMessage ?? "nothing to claim"}.`);
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
