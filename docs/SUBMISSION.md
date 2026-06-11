# Mantle Turing Test 2026 — Submission Readiness

Hackathon: **The Turing Test Hackathon 2026 (Phase II — AI Awakening)** · Mantle Network
Track: **Consumer & Viral DApps — Track 04** (Animoca Minds · Animoca Brands · OpenCheck)
Deadline: **June 15, 2026, 15:59**

This file tracks Bingocle against the official rubric and submission checklist (from `Bingocle_EN.md` §12 and §18). **Status as of this build.**

---

## Submission checklist (DoraHacks, §18)

| Item | Status | Notes |
|---|---|---|
| Bingocle Capability live on the Minds Bazaar (public name, public id, activation, `/agent-guide`) | 🟡 Built, not yet published | Telegram bot + `capability/AGENT-GUIDE.md` + `capability.json` are done. **Action: publish to the Bazaar and start a live bot.** |
| Build conversation submitted (idea → shipped Capability thread) | 🔴 To capture | Worth up to 10 pts. **Action: capture the builder↔Mind thread from here forward.** |
| Demo video ≥ 2 min showing a **different** user's Mind equipping + playing | 🔴 To record | Rehearse `/agent-guide` against a clean Mind, then record end-to-end. |
| Public GitHub repo: contracts + agent + frontend + README | 🟢 Done | This repo (`contracts/`, `agent/`, `capability/`, `frontend/`). |
| Contracts deployed + **verified** on Mantle Explorer (list addresses) | 🟡 Ready to deploy | `forge build && forge test` green; `script/Deploy.s.sol` wires everything + registers the oracle. **Action: run it, paste addresses in `README.md`.** |
| Live demo URL (Vercel) — publicly accessible | 🟡 Frontend exists | Landing + demo deployed by the FE owner; needs wiring to live contract addresses. |
| Pitch deck (problem, solution, demo, architecture, business model) | 🔴 To make | Material is in `docs/Bingocle_EN.md`. |
| Track nomination: Consumer & Viral DApps | ⚪ At submit time | |
| X thread tagged #MantleAIHackathon (pitch + video + repo + Mantle address) | 🔴 At submit time | |
| BUIDL submitted on DoraHacks before deadline | 🔴 At submit time | |

Legend: 🟢 done · 🟡 built, one action left · 🔴 not started · ⚪ form step

---

## Part A — Mantle General (50 pts)

| Dimension | Pts | Evidence in this repo |
|---|---|---|
| **Technical** (15) | End-to-end AI × on-chain: 7 integrated contracts (`contracts/src`), an LLM oracle that writes verdicts to `OracleRegistry`, merkle-committed word pool, dispute window, solvency-scaled parimutuel settlement. Unit-tested (`contracts/test/Bingocle.t.sol`, 7 passing). |
| **Ecosystem fit** (10) | Deploys + settles on Mantle Sepolia (chainId 5003); MNT as the game asset; **ERC-8004** soulbound agent identity (`AgentIdentity`) with on-chain reputation; brings Web2 event audiences on-chain via chat. |
| **Business** (10) | Loser-funded house residual (`WordMarket.sweepResidual`) = a built-in platform fee; B2B organizer + sponsored-word paths in the spec. |
| **Innovation** (10) | A new category: an **AI speech oracle for a consumer prediction market** — a market class Polymarket/UMA can't resolve — with a bingo meta-game on top. |
| **UX** (5) | Social-style onboarding (embedded per-user wallet, no seed phrase), channel-native (Telegram), a 3-step submit→buy→watch loop. |

**The end-to-end loop runs on testnet** (submit → curate → buy → validate → settle → claim), proven by the lifecycle test and the agent/capability wiring. Deploying + verifying on Explorer is the remaining gate for the "production-ready loop" bar.

## Part B — Animoca: Consumer & Viral DApps (50 pts)

| Dimension | Pts | Evidence |
|---|---|---|
| **Bazaar publish quality** (12) | `capability/capability.json` (public name/id, activation, commands) + complete `capability/AGENT-GUIDE.md`. **Gap: actually publish + go live.** |
| **Channel-native UX** (10) | `capability/src/bot.ts` runs the whole game inside Telegram — join, submit, buy, watch, claim — no terminal, no external context. Email path stubbed in the guide. |
| **Build-process transparency** (10) | **Gap: capture the build conversation.** Start now and submit the thread. |
| **Track-specific Path A/B** (13) | **Path B is engineered:** `AGENT-GUIDE.md` is written so a stranger's Mind can equip + operate with zero builder context (the section judges test). Path A: lead the build story with the passive-audience problem. |
| **Execution & demo** (5) | Capability + contracts + agent are runnable today; needs the live Bazaar instance + the "different Mind" demo video. |

---

## Top-20 Deployment Award ($1,000) checklist (§12.3)

- 🟢 AI function callable on-chain: `OracleRegistry.commitValidation()` written by the ERC-8004 agent.
- 🟡 Contracts on Mantle Testnet, **verified** — ready to deploy/verify.
- 🟡 Public frontend (Vercel) — exists; wire to addresses.
- 🔴 Deployment addresses listed — after deploy.
- 🔴 Demo video ≥ 2 min — to record.
- 🟢 Open-source repo + README (setup, architecture).

---

## The three things that win or lose Part B (do these next)

1. **Publish the Capability to the Bazaar and keep a live bot** — the 50-pt half is a *published, operable* Capability.
2. **Capture the build conversation** from now to submit — it is a scored artifact (≤10 pts) and can't be reconstructed later.
3. **Record the demo with a *different* Mind** equipping it via `/agent-guide` — this is the explicit Part B execution test.

Everything else (contracts, AI agents, the chat surface, the guide) is built and verified in this repo.
