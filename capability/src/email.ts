import { ImapFlow } from "imapflow";
import nodemailer from "nodemailer";
import { config } from "./config.js";
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
  parseLine,
} from "./commands.js";

/**
 * Email surface for the Capability — inbox-native play. Polls IMAP for new mail,
 * runs each command line through the shared command core keyed by the sender's
 * address (their demo wallet), and replies via SMTP. Same verbs as Telegram,
 * one per line in the email body. Needs IMAP and SMTP creds (see .env.example).
 */
const e = config.email;

function smtp() {
  return nodemailer.createTransport({
    host: e.smtpHost,
    port: e.smtpPort,
    secure: e.smtpPort === 465,
    auth: { user: e.smtpUser, pass: e.smtpPass },
  });
}

/** Run one command line for a sender; returns the reply text. */
async function runLine(sender: string, line: string): Promise<string | null> {
  const { cmd, rest } = parseLine(line);
  const a = rest.split(/\s+/).filter(Boolean);
  switch (cmd) {
    case "wallet":
      return cmdWallet(sender);
    case "create":
      return cmdCreate(rest);
    case "submit": {
      const words = rest.slice(rest.indexOf(" ") + 1).split(",").map((s) => s.trim()).filter(Boolean);
      return cmdSubmit(sender, Number(a[0]), words);
    }
    case "finalize":
      return cmdFinalize(Number(a[0]), a.slice(1).join(" "));
    case "pool":
      return cmdPool(Number(a[0]));
    case "card":
      return cmdCard(sender, Number(a[0]));
    case "price":
      return cmdPrice(Number(a[0]), a.slice(1).join(" "));
    case "buy":
      return cmdBuy(sender, Number(a[0]), a.slice(1, -1).join(" "), a[a.length - 1]);
    case "sell":
      return cmdSell(sender, Number(a[0]), a.slice(1, -1).join(" "), a[a.length - 1]);
    case "validate":
      return cmdValidate(Number(a[0]), a.slice(1).join(" ") || undefined);
    case "claim":
      return cmdClaim(sender, Number(a[0]));
    default:
      return null; // ignore non-command lines (quoted history, signatures)
  }
}

async function handleMessage(sender: string, subject: string, body: string): Promise<string> {
  const lines = `${subject}\n${body}`.split(/\r?\n/);
  const replies: string[] = [];
  for (const line of lines) {
    try {
      const r = await runLine(sender, line);
      if (r) replies.push(r);
    } catch (err: any) {
      replies.push(`⚠️ "${line.trim()}": ${err?.shortMessage ?? err?.message ?? String(err)}`);
    }
  }
  return replies.length ? replies.join("\n\n") : "No Bingocle commands found. Try: wallet / pool <id> / card <id>.";
}

async function main() {
  if (!e.imapHost || !e.smtpHost) throw new Error("Set IMAP_HOST/SMTP_HOST and creds (see .env.example).");
  const mailer = smtp();
  const client = new ImapFlow({
    host: e.imapHost,
    port: e.imapPort,
    secure: true,
    auth: { user: e.imapUser, pass: e.imapPass },
    logger: false,
  });
  await client.connect();
  console.log(`Bingocle email capability polling ${e.imapUser} every ${e.pollMs}ms`);

  // Poll loop: process UNSEEN, reply, mark seen.
  for (;;) {
    const lock = await client.getMailboxLock("INBOX");
    try {
      for await (const msg of client.fetch({ seen: false }, { envelope: true, source: true })) {
        const from = msg.envelope?.from?.[0]?.address ?? "";
        const subject = msg.envelope?.subject ?? "";
        const body = msg.source?.toString() ?? "";
        // crude text extraction: take the part after the first blank line (headers end)
        const text = body.split(/\r?\n\r?\n/).slice(1).join("\n\n");
        if (from) {
          const reply = await handleMessage(from, subject, text);
          await mailer.sendMail({
            from: e.from,
            to: from,
            subject: `Re: ${subject || "Bingocle"}`,
            text: reply,
          });
        }
        await client.messageFlagsAdd(msg.seq, ["\\Seen"]);
      }
    } finally {
      lock.release();
    }
    await new Promise((r) => setTimeout(r, e.pollMs));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
