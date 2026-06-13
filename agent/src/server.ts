import express from "express";
import { config } from "./config.js";
import { createEvent, phaseOf } from "./services/event.js";
import { curateAndCommit } from "./services/pool.js";
import { validateTranscript } from "./services/oracleRun.js";
import { getEvent, listEvents } from "./store.js";
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
    res.json(out);
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
    const rec = await curateAndCommit({
      eventId: id,
      theme,
      description,
      submissions: submissions ?? [],
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
