# Bingocle Agent Service

The AI layer + organizer-wallet bridge. Runs the three AI agents and writes their results to Mantle:

- **AI Word Curator** (`src/ai/curator.ts`) — normalize, semantic dedup, filter, theme-rank community submissions into a final pool; assign founders (earliest submitter).
- **AI Odds Engine** (`src/ai/odds.ts`) — blend the LLM's spoken-probability estimate with community vote share into an opening price + multiplier.
- **AI Validation Oracle** (`src/ai/oracle.ts`) — match a live transcript against the word pool (synonyms/acronyms, false-positive rejection) and commit verdicts on-chain.

All three call **Claude (`claude-opus-4-8`)** with structured outputs. The chain writes (`commitPool`, `commitValidation`) are signed by the agent wallet, which is the registered **ERC-8004 oracle** and the **WordPool curator**.

## Run

```bash
cp .env.example .env   # ANTHROPIC_API_KEY, MANTLE_RPC_URL, AGENT_PRIVATE_KEY, contract addresses
npm install
npm run start          # HTTP API on :8787  (npm run dev for watch mode)
```

ABIs are read from `../contracts/out` — run `forge build` in `contracts/` first.

## HTTP API (what the Capability calls)

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/events` | Create an event (organizer = agent wallet) |
| `GET` | `/events` / `/events/:id` | Event record + on-chain phase |
| `POST` | `/events/:id/commit-pool` | Run Curator + Odds, commit the frozen pool |
| `POST` | `/events/:id/validate` | Run the Oracle on a transcript, commit verdicts |
| `GET` | `/events/:id/card/:address` | Live card view (cells + marked bitmap) |

## Oracle demo (recorded transcript)

```bash
npm run oracle -- <eventId> [demo/transcript.txt]
```

Splits the transcript into chunks (simulating live STT), matches each, and commits fresh verdicts — the rehearsed-audio demo path from the spec.
