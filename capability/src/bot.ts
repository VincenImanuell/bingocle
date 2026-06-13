import { Telegraf } from "telegraf";
import { message } from "telegraf/filters";
import { config } from "./config.js";
import { dispatch, VERBS, START_TEXT } from "./commands.js";
import { interpret } from "./nlu.js";

if (!config.telegramToken) throw new Error("TELEGRAM_BOT_TOKEN not set");
const bot = new Telegraf(config.telegramToken);

const userKey = (ctx: any) => String(ctx.from!.id);

/** Everything after the first token of a "/cmd args..." message. */
function restOf(text: string): string {
  const sp = text.search(/\s/);
  return sp < 0 ? "" : text.slice(sp + 1).trim();
}

async function guard(ctx: any, fn: () => Promise<string>) {
  try {
    await ctx.reply(await fn());
  } catch (e: any) {
    await ctx.reply(`⚠️ ${e?.shortMessage ?? e?.message ?? String(e)}`);
  }
}

bot.start((ctx) => ctx.reply(START_TEXT));

// Register every verb as a slash command, all routed through the shared dispatcher.
for (const verb of VERBS) {
  if (verb === "start") continue; // handled by bot.start
  bot.command(verb, (ctx) => guard(ctx, () => dispatch(userKey(ctx), verb, restOf(ctx.message.text))));
}

// Free-text (non-command) messages → natural-language understanding.
bot.on(message("text"), async (ctx) => {
  const text = ctx.message.text;
  if (text.startsWith("/")) return; // slash commands handled above
  try {
    const intent = await interpret(text);
    const reply =
      intent.kind === "command" ? await dispatch(userKey(ctx), intent.cmd, intent.rest) : intent.text;
    if (reply) await ctx.reply(reply);
  } catch (e: any) {
    await ctx.reply(`⚠️ ${e?.shortMessage ?? e?.message ?? String(e)}`);
  }
});

bot.launch().then(() => {
  console.log("Bingocle Telegram capability running.");
  console.log(
    config.geminiApiKey
      ? `NL chat: ON (model ${config.geminiModel})`
      : "NL chat: OFF — GEMINI_API_KEY not set (slash/canonical commands still work)",
  );
});
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
