import { ImapFlow } from "imapflow";
import nodemailer from "nodemailer";
import { config } from "./config.js";
import { dispatch, parseLine, isVerb } from "./commands.js";
import { interpret } from "./nlu.js";

/**
 * Email surface for the Capability — inbox-native play. Polls IMAP for new mail,
 * runs the shared command core keyed by the sender's address (their demo wallet),
 * and replies via SMTP. Same verbs as Telegram. You can write one command per
 * line, OR just write what you want in plain English — free-text messages are
 * interpreted by the same NLU layer the bot uses. Needs IMAP + SMTP creds.
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

async function handleMessage(sender: string, subject: string, body: string): Promise<string> {
  const lines = `${subject}\n${body}`.split(/\r?\n/);
  const replies: string[] = [];

  // 1. Line-by-line command parse (lets a single email run several actions).
  for (const line of lines) {
    const { cmd, rest } = parseLine(line);
    if (!isVerb(cmd)) continue; // ignore prose, quoted history, signatures
    try {
      replies.push(await dispatch(sender, cmd, rest));
    } catch (err: any) {
      replies.push(`⚠️ "${line.trim()}": ${err?.shortMessage ?? err?.message ?? String(err)}`);
    }
  }
  if (replies.length) return replies.join("\n\n");

  // 2. No explicit commands — interpret the whole message in plain language.
  try {
    const intent = await interpret(`${subject}\n${body}`);
    if (intent.kind === "command") return dispatch(sender, intent.cmd, intent.rest);
    return intent.text;
  } catch (err: any) {
    return `⚠️ ${err?.shortMessage ?? err?.message ?? String(err)}`;
  }
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
