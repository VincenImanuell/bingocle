import express from "express";
import { ethers } from "ethers";
import { config } from "./config.js";
import { createEvent, phaseOf } from "./services/event.js";
import { curateAndCommit } from "./services/pool.js";
import { validateTranscript } from "./services/oracleRun.js";
import { getEvent, listEvents, ensureEvent, addSubmission, putEvent } from "./store.js";
import { contracts } from "./chain.js";

const app = express();

// CORS — the public web app (Vercel) and remote Minds call this service from the
// browser, so cross-origin requests must be allowed. Set CORS_ORIGIN to the
// frontend origin in production; defaults to "*" for the open testnet demo.
const corsOrigin = process.env.CORS_ORIGIN ?? "*";
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", corsOrigin);
  res.header("Vary", "Origin");
  res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }
  next();
});

app.use(express.json({ limit: "1mb" }));

function wrap(fn: (req: express.Request, res: express.Response) => Promise<unknown>) {
  return (req: express.Request, res: express.Response) => {
    fn(req, res).catch((e) => {
      console.error(e);
      res.status(500).json({ error: String(e?.message ?? e) });
    });
  };
}

app.get("/health", (_req, res) => {
  res.json({ ok: true, chainId: config.chainId, model: config.model });
});

// Create an event (organizer = agent wallet).
app.post(
  "/events",
  wrap(async (req, res) => {
    const out = await createEvent(req.body ?? {});
    // Persist the theme/title (+ open a submissions inbox) so the lobby can show
    // a name and the web/email surfaces can submit words before curation.
    const theme = String(req.body?.theme ?? "").trim();
    ensureEvent(out.eventId, theme);
    // Auto-seed the bingo bonus pool so winners can always claim. MUST happen before
    // market lock (here it's right after create). Configurable via body.rewardFundMnt
    // or REWARD_FUND_MNT env (0 = skip).
    const fundMnt = Number(req.body?.rewardFundMnt ?? process.env.REWARD_FUND_MNT ?? 30);
    let rewardFunded = 0;
    if (fundMnt > 0) {
      try {
        const amt = ethers.parseEther(String(fundMnt));
        await (await contracts.rewardVault().fund(out.eventId, amt, { value: amt })).wait();
        rewardFunded = fundMnt;
      } catch (e: any) {
        console.warn("auto reward-fund failed:", e?.shortMessage ?? e?.message ?? e);
      }
    }
    res.json({ ...out, theme, rewardFunded });
  }),
);

// Submit a predicted word (web/email surface; the Telegram bot keeps its own inbox
// and both are merged at commit-pool).
app.post(
  "/events/:id/submit",
  wrap(async (req, res) => {
    const id = Number(req.params.id);
    const word = String(req.body?.word ?? "").trim();
    const player = String(req.body?.player ?? req.body?.wallet ?? "");
    if (!word || word.length > 40) {
      res.status(400).json({ reason: "word must be 1–40 characters" });
      return;
    }
    addSubmission(id, { raw: word, wallet: player, ts: Math.floor(Date.now() / 1000) });
    res.json({ ok: true });
  }),
);

// Sync the off-chain word labels/odds for an event whose pool was committed directly
// on-chain (so the web app shows real words + multipliers instead of #0..#23).
app.post(
  "/events/:id/sync-pool",
  wrap(async (req, res) => {
    const id = Number(req.params.id);
    const words: string[] = Array.isArray(req.body?.words) ? req.body.words.map(String) : [];
    if (!words.length) {
      res.status(400).json({ reason: "words[] required" });
      return;
    }
    const price1e4 = Number(req.body?.price1e4 ?? 5000);
    const mult1e4 = Number(req.body?.mult1e4 ?? 20000);
    const existing = getEvent(id);
    putEvent({
      eventId: id,
      theme: existing?.theme ?? `Bingocle Event #${id}`,
      description: existing?.description ?? existing?.theme ?? `Bingocle Event #${id}`,
      words,
      founders: words.map(() => "0x0000000000000000000000000000000000000000"),
      odds: words.map((w) => ({ word: w, aiProb: 0.5, price1e4, mult1e4 })),
      submissions: existing?.submissions,
    });
    res.json({ ok: true, words: words.length });
  }),
);

app.get(
  "/events",
  wrap(async (_req, res) => {
    res.json(listEvents());
  }),
);

app.get(
  "/events/:id",
  wrap(async (req, res) => {
    const id = Number(req.params.id);
    res.json({ record: getEvent(id) ?? null, phase: await phaseOf(id) });
  }),
);

// Run AI Curator + Odds Engine and commit the frozen pool on-chain.
app.post(
  "/events/:id/commit-pool",
  wrap(async (req, res) => {
    const id = Number(req.params.id);
    const { theme, description, submissions } = req.body ?? {};
    // Merge submissions passed in the body (bot inbox) with any collected via the
    // web/email /submit endpoint so curation sees every predicted word.
    const stored = getEvent(id)?.submissions ?? [];
    const merged = [...(submissions ?? []), ...stored];
    const rec = await curateAndCommit({
      eventId: id,
      theme,
      description,
      submissions: merged,
    });
    res.json(rec);
  }),
);

// Run the AI Validation Oracle on a transcript chunk and commit verdicts.
app.post(
  "/events/:id/validate",
  wrap(async (req, res) => {
    const id = Number(req.params.id);
    const { transcript, minConfidence } = req.body ?? {};
    const commits = await validateTranscript({ eventId: id, transcript, minConfidence });
    res.json({ commits });
  }),
);

// Live card view for a player (marked cells from the oracle bitmap).
app.get(
  "/events/:id/card/:address",
  wrap(async (req, res) => {
    const id = Number(req.params.id);
    const player = req.params.address;
    const card = contracts.bingoCardNFT();
    const has: boolean = await card.hasCard(id, player);
    if (!has) {
      res.json({ hasCard: false });
      return;
    }
    const tokenId: bigint = await card.cardOf(id, player);
    const cells: number[] = (await card.cardCells(tokenId)).map((c: bigint) => Number(c));
    const marked: bigint = await card.markedMask(tokenId);
    const rec = getEvent(id);
    const labels = cells.map((w) => (w === 255 ? "FREE" : rec?.words[w] ?? `#${w}`));
    res.json({
      hasCard: true,
      tokenId: Number(tokenId),
      cells,
      labels,
      markedMask: Number(marked),
    });
  }),
);

app.listen(config.port, () => {
  console.log(`Bingocle agent service on :${config.port} (chain ${config.chainId})`);
});
