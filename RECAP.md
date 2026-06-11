# Build Recap — Backend, Contracts & Capability

Session goal: pull the team's latest, then build everything **except the frontend** (the frontend is your friend's job). Also: confirm the project is ready to submit to the Mantle Turing Test 2026.

## What I pulled

`git pull origin main` brought in the team's **frontend** (Next.js landing page, wallet connect, playable demo). I read its `components/app/engine.ts` and `data.ts` to match the on-chain game semantics to the UI exactly (bingo lines, bonus tiers 50/75/100/500, `stake × mult` payouts, founder seed).

## What I built (non-frontend)

### 1. Smart contracts — `contracts/` (Foundry, Solidity 0.8.28, OpenZeppelin v5.1.0)

Seven integrated contracts + shared libs, **compiling and unit-tested**:

| Contract | Role |
|---|---|
| `EventFactory` | Event config + lifecycle; phases derived purely from on-chain timestamps |
| `WordPool` | AI-curated word pool + odds, frozen by a merkle root; founder registry |
| `WordMarket` | Buy-side parimutuel + bought-prediction payout rail (solvency-scaled) |
| `OracleRegistry` | On-chain AI verdict log (word, confidence, proof) + dispute window |
| `BingoCardNFT` | Soulbound 5×5 card per player; deterministic on-chain layout; live marking |
| `RewardVault` | Sponsor pool → bingo bonuses + founder-seed payouts |
| `AgentIdentity` | ERC-8004-style soulbound identity NFT + oracle reputation |
| `lib/BingoLib`, `lib/BingocleTypes` | Bingo math (mirrors `engine.ts`) + shared types |

- `script/Deploy.s.sol` deploys, wires all modules, registers the ERC-8004 oracle, and sets the curator.
- `test/Bingocle.t.sol` — **7 tests passing**, including the full submit→buy→validate→settle→claim lifecycle with exact payout math (solvency scale 0.75 → 15 MNT each), no-winner refund, soulbound enforcement, monotonic-schedule and access-control reverts.

### 2. Agent service — `agent/` (Node/TS, ethers v6, Anthropic SDK)

The AI layer, calling **Claude `claude-opus-4-8`** with structured outputs, writing to Mantle:

- **AI Word Curator** — normalize / semantic-dedup / filter / theme-rank submissions; assign founders.
- **AI Odds Engine** — blend LLM probability with community votes → price + multiplier.
- **AI Validation Oracle** — match a transcript to the pool (synonyms, false-positive rejection) → `commitValidation` on-chain.
- HTTP API (`src/server.ts`) + a recorded-transcript oracle demo (`npm run oracle`).
- **Typechecks clean.**

### 3. Capability — `capability/` (Node/TS, Telegraf)

The scored Part-B consumer surface — the full game over **Telegram chat**:

- `src/bot.ts` — `/create /submit /finalize /pool /card /buy /validate /claim /wallet`.
- Per-user **testnet demo wallets** (no seed phrase — Web2 onboarding).
- `AGENT-GUIDE.md` — the cross-Mind reproducibility guide judges test directly.
- `capability.json` — Bazaar manifest.
- **Typechecks clean.**

## Adversarial review + fixes

I ran a multi-agent security/correctness review (6 dimensions + synthesis) over the contracts. It confirmed 18 issues; I fixed the highs and key mediums:

- **Trapped funds** — strict-monotonic event timestamps (collapsed phases no longer trap stakes); `refundIfNoWinners` + organizer `sweepResidual` / `withdrawResidual` close every no-winner / leftover path.
- **Soulbound** — Card and AgentIdentity NFTs can't be transferred (a sale would split rewards/oracle power from the token).
- **Token safety** — buys/funding credit the *measured* received amount (fee-on-transfer safe).
- **Validation** — price/multiplier bounds (`mult ≥ 1.0x`), zero-address module checks, dust-claim idempotency, stronger card seed.

Re-compiled and re-ran tests after every fix — all green.

## Submission readiness (Mantle Turing Test 2026)

Full mapping in [`docs/SUBMISSION.md`](docs/SUBMISSION.md). Short version — **built and verified here:** all 7 contracts, the 3 AI agents, the Telegram Capability, and the `/agent-guide`. **Remaining (not code — process/ops):**

1. Deploy + verify on Mantle Sepolia (`Deploy.s.sol`), paste addresses in `README.md`.
2. Publish the Capability to the Minds Bazaar and run a live bot.
3. Capture the build conversation (scored, ≤10 pts) and record the ≥2-min demo with a *different* Mind.

## How to run

See the **Quickstart** in [`README.md`](README.md): `forge build && forge test` → deploy → `agent/ npm start` → `capability/ npm start`.

## Notes for the frontend owner

- The **on-chain card layout is canonical** — render `BingoCardNFT.cardCells(tokenId)` from chain; do **not** recompute (the demo's `mulberry32` shuffle is local-only and intentionally won't match the NFT).
- Contract ABIs are in `contracts/out/<Name>.sol/<Name>.json` after `forge build`.
- Odds/prices/mults are 1e4 fixed-point on-chain (10000 = 1.0); the agent records human-readable odds per event.
