import { Telegraf } from "telegraf";
import { config } from "./config.js";
import { AGENT_GUIDE } from "./guide.js";
import {
  cmdWallet,
  cmdCreate,
  cmdSubmit,
  cmdFinalize,
  cmdPool,
  cmdCard,
  cmdPrice,
  cmdBuy,
  cmdSell,
  cmdValidate,
  cmdClaim,
} from "./commands.js";

if (!config.telegramToken) throw new Error("TELEGRAM_BOT_TOKEN not set");
const bot = new Telegraf(config.telegramToken);

function args(text: string): string[] {
  return text.trim().split(/\s+/).slice(1);
}

async function guard(ctx: any, fn: () => Promise<string>) {
  try {
    await ctx.reply(await fn());
  } catch (e: any) {
    await ctx.reply(`⚠️ ${e?.shortMessage ?? e?.message ?? String(e)}`);
  }
}

bot.start((ctx) =>
  ctx.reply(
    "🎲 Bingocle — trade the words before they hit the card.\n\n" +
      "Predict the words a speaker will say live; an AI oracle calls the bingo on Mantle.\n\n" +
      "/wallet — your demo wallet\n" +
      "/create <theme> — start an event\n" +
      "/submit <id> word1, word2, word3 — predict words\n" +
      "/card <id> — get your bingo card\n" +
      "/price <id> <word> — current share price\n" +
      "/buy <id> <word> <shares> — buy shares (price rises with demand)\n" +
      "/sell <id> <word> <shares> — sell shares (take profit before lock)\n" +
      "/claim <id> — redeem winnings\n" +
      "/agentguide — full operator guide",
  ),
);

bot.command("agentguide", (ctx) => ctx.reply(AGENT_GUIDE.slice(0, 3800)));
bot.command("wallet", (ctx) => guard(ctx, () => cmdWallet(String(ctx.from!.id))));
bot.command("create", (ctx) => guard(ctx, () => cmdCreate(args(ctx.message.text).join(" "))));

bot.command("submit", (ctx) =>
  guard(ctx, async () => {
    const a = args(ctx.message.text);
    const words = a.slice(1).join(" ").split(",").map((s) => s.trim()).filter(Boolean);
    return cmdSubmit(String(ctx.from!.id), Number(a[0]), words);
  }),
);

bot.command("finalize", (ctx) =>
  guard(ctx, () => {
    const a = args(ctx.message.text);
    return cmdFinalize(Number(a[0]), a.slice(1).join(" "));
  }),
);

bot.command("pool", (ctx) => guard(ctx, () => cmdPool(Number(args(ctx.message.text)[0]))));
bot.command("card", (ctx) => guard(ctx, () => cmdCard(String(ctx.from!.id), Number(args(ctx.message.text)[0]))));

bot.command("price", (ctx) =>
  guard(ctx, () => {
    const a = args(ctx.message.text);
    return cmdPrice(Number(a[0]), a.slice(1).join(" "));
  }),
);

bot.command("buy", (ctx) =>
  guard(ctx, () => {
    const a = args(ctx.message.text);
    return cmdBuy(String(ctx.from!.id), Number(a[0]), a.slice(1, -1).join(" "), a[a.length - 1]);
  }),
);

bot.command("sell", (ctx) =>
  guard(ctx, () => {
    const a = args(ctx.message.text);
    return cmdSell(String(ctx.from!.id), Number(a[0]), a.slice(1, -1).join(" "), a[a.length - 1]);
  }),
);

bot.command("validate", (ctx) =>
  guard(ctx, () => {
    const a = args(ctx.message.text);
    return cmdValidate(Number(a[0]), a.slice(1).join(" ") || undefined);
  }),
);

bot.command("claim", (ctx) => guard(ctx, () => cmdClaim(String(ctx.from!.id), Number(args(ctx.message.text)[0]))));

bot.launch().then(() => console.log("Bingocle Telegram capability running."));
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
