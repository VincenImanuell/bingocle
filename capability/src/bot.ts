import { Telegraf } from "telegraf";
import { ethers } from "ethers";
import { config } from "./config.js";
import { agentApi } from "./api.js";
import { walletFor, provider } from "./wallets.js";
import { asUser, read, wordIndexOf } from "./chain.js";
import { AGENT_GUIDE } from "./guide.js";

if (!config.telegramToken) throw new Error("TELEGRAM_BOT_TOKEN not set");
const bot = new Telegraf(config.telegramToken);

// In-memory submission inbox per event (off-chain until the AI Curator commits).
type Sub = { raw: string; wallet: string; ts: number };
const inbox = new Map<number, Sub[]>();

function args(text: string): string[] {
  return text.trim().split(/\s+/).slice(1);
}

async function guard(ctx: any, fn: () => Promise<void>) {
  try {
    await fn();
  } catch (e: any) {
    await ctx.reply(`⚠️ ${e?.shortMessage ?? e?.message ?? String(e)}`);
  }
}

bot.start((ctx) =>
  ctx.reply(
    "🎲 *Bingocle* — trade the words before they hit the card.\n\n" +
      "Predict the words a speaker will say live; an AI oracle calls the bingo on Mantle.\n\n" +
      "Try:\n" +
      "/wallet — your demo wallet\n" +
      "/create <theme> — start an event\n" +
      "/submit <id> word1, word2, word3 — predict words\n" +
      "/card <id> — get your bingo card\n" +
      "/buy <id> <word> <amount> — back a word\n" +
      "/claim <id> — collect winnings\n" +
      "/agentguide — full operator guide",
    { parse_mode: "Markdown" },
  ),
);

bot.command("agentguide", (ctx) => ctx.reply(AGENT_GUIDE.slice(0, 3800)));

bot.command("wallet", (ctx) =>
  guard(ctx, async () => {
    const w = walletFor(ctx.from!.id);
    const bal = await provider().getBalance(w.address);
    await ctx.reply(`👛 Your demo wallet:\n\`${w.address}\`\nBalance: ${ethers.formatEther(bal)} MNT`, {
      parse_mode: "Markdown",
    });
  }),
);

bot.command("create", (ctx) =>
  guard(ctx, async () => {
    const theme = args(ctx.message.text).join(" ") || "Web3 · AI · Startup";
    const { eventId, txHash } = await agentApi.createEvent({});
    inbox.set(eventId, []);
    await ctx.reply(
      `✅ Event #${eventId} created (theme: ${theme}).\ntx: ${txHash}\n\n` +
        `Players: /submit ${eventId} airdrop, mainnet, liquidity\n` +
        `Organizer: /finalize ${eventId} ${theme}`,
    );
  }),
);

bot.command("submit", (ctx) =>
  guard(ctx, async () => {
    const a = args(ctx.message.text);
    const id = Number(a[0]);
    const words = a.slice(1).join(" ").split(",").map((s) => s.trim()).filter(Boolean);
    if (!id || words.length === 0) return void ctx.reply("Usage: /submit <id> word1, word2, word3");
    if (words.length > 3) return void ctx.reply("Max 3 words per wallet.");
    const w = walletFor(ctx.from!.id);
    const list = inbox.get(id) ?? [];
    const ts = Math.floor(Date.now() / 1000);
    for (const raw of words) list.push({ raw, wallet: w.address, ts });
    inbox.set(id, list);
    await ctx.reply(`📝 Submitted to #${id}: ${words.join(", ")}. You may become the Founder of any that make the pool.`);
  }),
);

bot.command("finalize", (ctx) =>
  guard(ctx, async () => {
    const a = args(ctx.message.text);
    const id = Number(a[0]);
    const theme = a.slice(1).join(" ") || "Web3 · AI · Startup";
    const submissions = inbox.get(id) ?? [];
    await ctx.reply(`🧠 AI Curator + Odds Engine running for #${id} (${submissions.length} submissions)…`);
    const rec = await agentApi.commitPool(id, { theme, description: theme, submissions });
    const top = rec.odds
      .slice(0, 6)
      .map((o: any) => `${o.word} @${(o.price1e4 / 10000).toFixed(2)} / ${(o.mult1e4 / 10000).toFixed(2)}x`)
      .join("\n");
    await ctx.reply(`✅ Pool committed (${rec.words.length} words). Sample odds:\n${top}\n\nMarket opens after the founder window. /card ${id} to play.`);
  }),
);

bot.command("pool", (ctx) =>
  guard(ctx, async () => {
    const id = Number(args(ctx.message.text)[0]);
    const { record, phase } = await agentApi.getEvent(id);
    if (!record) return void ctx.reply(`No committed pool for #${id} yet.`);
    const lines = record.odds
      .map((o: any, i: number) => `${i}. ${o.word} — ${(o.price1e4 / 10000).toFixed(2)} / ${(o.mult1e4 / 10000).toFixed(2)}x`)
      .join("\n");
    await ctx.reply(`📊 Event #${id} [${phase}]\n${lines}`);
  }),
);

bot.command("card", (ctx) =>
  guard(ctx, async () => {
    const id = Number(args(ctx.message.text)[0]);
    const w = walletFor(ctx.from!.id);
    let view = await agentApi.card(id, w.address);
    if (!view.hasCard) {
      await ctx.reply("🃏 Minting your card…");
      const tx = await asUser(w).bingoCardNFT().mint(id);
      await tx.wait();
      view = await agentApi.card(id, w.address);
    }
    await ctx.reply(renderCard(view.labels, view.markedMask));
  }),
);

bot.command("buy", (ctx) =>
  guard(ctx, async () => {
    const a = args(ctx.message.text);
    const id = Number(a[0]);
    const amount = a[a.length - 1];
    const word = a.slice(1, -1).join(" ");
    if (!id || !word || !amount) return void ctx.reply("Usage: /buy <id> <word> <amountMNT>");
    const idx = await wordIndexOf(id, word);
    if (idx < 0) return void ctx.reply(`"${word}" is not in event #${id}'s pool. /pool ${id}`);
    const w = walletFor(ctx.from!.id);
    const value = ethers.parseEther(amount);
    const tx = await asUser(w).wordMarket().buy(id, idx, value, { value });
    await tx.wait();
    await ctx.reply(`✅ Bought ${amount} MNT on "${word}" (#${idx}). tx: ${tx.hash}`);
  }),
);

bot.command("validate", (ctx) =>
  guard(ctx, async () => {
    const a = args(ctx.message.text);
    const id = Number(a[0]);
    const transcript = a.slice(1).join(" ");
    if (!id) return void ctx.reply("Usage: /validate <id> [transcript text]");
    await ctx.reply("🎙️ Oracle listening…");
    const { commits } = await agentApi.validate(id, transcript ? { transcript } : { transcript: DEMO_LINE });
    if (!commits.length) return void ctx.reply("No new words validated.");
    await ctx.reply(commits.map((c: any) => `✅ "${c.word}" (conf ${c.confidence.toFixed(2)})`).join("\n"));
  }),
);

bot.command("claim", (ctx) =>
  guard(ctx, async () => {
    const id = Number(args(ctx.message.text)[0]);
    const w = walletFor(ctx.from!.id);
    const u = asUser(w);
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
    await ctx.reply("💰 " + out.join("\n"));
  }),
);

const DEMO_LINE =
  "So when we plugged the model in, the AI started flagging duplicates. We are targeting mainnet, and settlement happens on Mantle. The AI oracle writes its verdict on-chain.";

function renderCard(labels: string[], mask: number): string {
  let out = "🃏 Your card (✅ = hit):\n";
  for (let r = 0; r < 5; r++) {
    const row = [];
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

bot.launch().then(() => console.log("Bingocle Telegram capability running."));
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
