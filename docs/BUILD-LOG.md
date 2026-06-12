# Build Conversation Log (Part B artifact — scored ≤10 pts)

> **Why this file exists.** The Animoca scorecard awards up to 10 points for the **build conversation** — the email/Telegram thread between the builder and their Mind showing genuine iterative problem-solving (idea → shipped Capability). It is graded; it cannot be reconstructed after the fact. **Paste the real thread here as you build.** This file is a template + the story spine to fill in.

## How to capture

- Keep the actual builder ↔ Mind messages (Telegram export or email thread).
- Show the *iteration*: a problem, what the Mind suggested, what you tried, what broke, the fix. Dead ends are good — they prove real problem-solving.
- End each phase with the concrete artifact it produced (a contract, an endpoint, a command).

## Story spine (fill with real messages)

### 1. The problem (Path A hook)
Passive audiences at talks/podcasts/demo days have no way to participate. Prediction markets exist but are intimidating and have **no oracle for "words humans actually say."** → The idea: a bingo prediction market refereed by an AI speech oracle.

> _Paste the messages where you framed this with your Mind._

### 2. Shaping it into a Capability
Decision: the consumer surface is a **Minds Capability over chat** (Telegram + email), with the chain as its spine. Embedded per-user testnet wallets so Web2 users play with no seed phrase.

> _Paste the back-and-forth on scope, channels, and the "play entirely in chat" decision._

### 3. The on-chain spine
Designed 7 contracts (EventFactory, WordPool, WordMarket, OracleRegistry, BingoCardNFT, RewardVault, AgentIdentity). Money model: parimutuel buy-side with a solvency scale; two reward rails (prediction + bingo bonus); founder seeds from a sponsor pool.

> _Paste the design discussion + any pivots (e.g. how settlement solvency was resolved)._

### 4. The AI agents
AI Word Curator (normalize/dedup/filter), Odds Engine (LLM probability × community votes), Validation Oracle (transcript → on-chain verdicts). All Claude `claude-opus-4-8` with structured outputs.

> _Paste the prompt-iteration messages — what the curator/oracle got wrong and how the prompt was fixed._

### 5. Hardening
Ran an adversarial review of the contracts; fixed trapped-funds, soulbound NFTs, fee-on-transfer accounting, phase-collapse. Verified end-to-end on a local chain.

> _Paste the review findings discussion + fixes._

### 6. The Capability ships
Telegram bot with the full loop + a self-documenting `/agent-guide` so a different Mind can run it.

> _Paste the final messages where you tested it and published to the Bazaar._

## Demo checklist (record after this log is real)
- [ ] ≥2-min video showing a **different** user's Mind equipping via `/agent-guide` and playing end-to-end.
- [ ] Link the published Bazaar Capability (public name + id).
