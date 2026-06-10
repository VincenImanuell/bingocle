# Bingocle

**AI-Powered Community Bingo Prediction Market on Mantle**

> Trade the words before they hit the card — verified live by an AI Oracle, settled on Mantle.

**Hackathon:** The Turing Test Hackathon 2026 (Phase II — AI Awakening) · Mantle Network
**Track:** Consumer & Viral DApps — Track 04 (sponsors: Animoca Minds, Animoca Brands, OpenCheck)
**Submission deadline:** **June 15, 2026, 15:59** · Demo Day July 2–3 · Awards July 10

---

## 0. Read This First — How This Track Is *Actually* Judged

Every project gets **two scorecards**, both required, summed to 100 points (verified from the official "Judging Criteria of AI Awakening" rubric):

| Part | Points | Who scores | What it measures |
|---|---|---|---|
| **Part A — Mantle General** | 50 | All judges | Technical (15) · Ecosystem fit (10) · Business (10) · Innovation (10) · UX (5) |
| **Part B — Animoca track-specific** | 50 | Animoca judges | **100% about a Minds Bazaar Capability** (see §12.2) |

**The decisive insight:** Part B — half the score — is *not* about smart contracts. It rewards a **published Minds Capability**: a conversational AI agent skill, live on the Minds Bazaar, operable over **email + Telegram**, documented so any *other* user's Mind can equip and run it, with the build conversation submitted as proof.

> **OpenCheck note:** the rubric contains **no separate OpenCheck scorecard** — the only track-specific card is Animoca's. OpenCheck is a co-sponsor; treat it as a *verification/authenticity synergy* (the on-chain Oracle proof), not as extra points.

So Bingocle ships as **two coupled deliverables**:

1. **Bingocle Capability** (Part B engine) — the consumer surface. A Mind skill that lets anyone create/join a bingo prediction event, submit words, buy positions, watch live, and claim — entirely through chat. The *core* deliverable, not an add-on.
2. **Bingocle on-chain** (Part A engine) — the trust + innovation layer. Smart contracts on Mantle + the AI Speech Oracle + a public web app. The "side infrastructure (live, with URL)" the Capability calls into; it earns the Technical/Innovation/Ecosystem points.

> The Capability is the product for this track; the chain is its spine.

---

## 1. Executive Summary

**Bingocle** is a consumer dApp that turns the passive audience of any live event (conference, podcast, debate, livestream, demo day) into active players in a **bingo-shaped prediction market** — where the entire game loop is run and verified by **AI agents on Mantle Network**.

In one sentence:

> The community proposes words they predict a speaker will say during an event; AI curates them into a word pool and bingo cards; each word becomes an on-chain prediction asset; then an **AI Validation Oracle listens to the event live (speech-to-text + LLM) and writes its verdicts straight to a smart contract on Mantle** — triggering settlement, card marking, and reward distribution automatically and transparently.

No admin marks words by hand. No black box. Every AI decision is recorded permanently on-chain — directly embodying the Turing Test theme: *on-chain benchmarking of AI, agent identity, and radical transparency* (see §6).

For the Consumer & Viral DApps track, that whole experience is **wrapped as a Minds Capability** so a user — or another user's Mind — can play by simply talking to it.

### Positioning

| Item | Detail |
|---|---|
| **Primary track** | Consumer & Viral DApps (Animoca Minds, OpenCheck) |
| **Prize targets** | Track Winner ($8,500) · Top-20 Deployment ($1,000) · Best UI/UX ($3,000) · Community Voting ($8,500) |
| **Chain** | Mantle Network (Sepolia testnet → Mainnet) |
| **Core AI** | AI Validation Oracle (STT + LLM) · AI Word Curator · AI Odds Engine · Bingocle Capability (Minds, email + Telegram) |
| **Agent identity** | ERC-8004 Agent Identity NFT for the AI Validation Oracle |

---

## 2. Name & Tagline

**Bingocle** = **Bing**o + Or**acle** — the bingo game refereed by an on-chain AI oracle.

Primary tagline:

> **Trade the words before they hit the card.**

Alternates:
- *Where community words become on-chain prediction markets.*
- *Submit words. Trade predictions. Let the AI call the bingo.*
- *The first bingo game refereed by an on-chain AI oracle.*

---

## 3. Background & Problem

At Web3 seminars, podcasts, debates, or hackathon demo days, certain words are almost guaranteed to be spoken: *Blockchain, Wallet, AI, Funding, Mainnet, Gas Fee, Community*. Yet the audience only watches — no mechanism to participate, predict, or earn.

Four problems Bingocle solves:

### 3.1 One-way events, passive audiences
Seminars, conferences, and livestreams run in one direction. Audience engagement is low and decays fast.

### 3.2 Prediction markets are too serious and intimidating for newcomers
Existing prediction markets (politics, crypto prices, sports) carry high barriers: financial jargon, complex UX, large stakes. There is no *fun on-ramp* for Web2 users.

### 3.3 Prediction markets need an oracle — and an oracle for "words humans actually speak" does not exist
This is the interesting technical gap: there is no infrastructure to settle markets based on *speech in a live event*. Manual validation is slow, gameable, and unscalable. **Bingocle builds an on-chain AI Speech Oracle as the answer.**

### 3.4 Traditional bingo is static
Classic bingo only matches numbers. No community layer, no economy, no strategy.

---

## 4. Solution

Bingocle fuses four layers into one game:

```
Community Submission  →  words come from the community, curated by AI
+ Bingo Game          →  a format everyone already understands
+ Prediction Market   →  each word = an on-chain prediction asset on Mantle
+ AI Oracle           →  AI listens to the live event & settles the market on-chain
```

…then exposes all of it through a **conversational Minds Capability** so the player never needs a terminal, a seed phrase, or any Web3 knowledge.

What separates Bingocle from a plain "bingo app": **the AI is not a bolt-on feature — it is the referee.** The game's integrity depends on AI agents whose decisions are auditable on-chain.

**Not "just Polymarket with a bingo skin."** Same market engine underneath, but three real differentiators: (1) outcomes are **community-submitted words**, bottom-up, not admin-defined markets; (2) the **oracle is an AI speech oracle on live audio** — a class of market Polymarket/UMA cannot resolve; (3) a **bingo pattern layer** (lines, diagonals, full-card bonus) is a meta-game on top of individual outcomes. Lead the pitch with the bingo + AI-oracle + community angle; the market is the value layer beneath.

---

## 5. Why Mantle

1. **Very low transaction cost** — a consumer game with many micro-transactions (buy a word position, mark, claim) is only viable on a low-fee chain like Mantle.
2. **Account Abstraction & gasless UX** — Web2 users (podcast listeners, seminar attendees) can play without understanding gas. Sponsored transactions via paymaster.
3. **ERC-8004 Agent Identity** — an agent-identity standard championed in the Mantle ecosystem. The Bingocle Validation Oracle is registered as an identity-NFT agent, with a validation track record accumulating on-chain.
4. **Ecosystem assets** — entry fees and reward pools in **MNT / USDC on Mantle**; corporate-event reward pools can sit in yield-bearing Mantle assets (mETH) as a later development.
5. **Narrative alignment** — Mantle is building an *agent economy*. Bingocle demonstrates a new category: **an AI agent as a consumer oracle** generating real on-chain value.

---

## 6. Why This Is a "Turing Test" Project

The hackathon's thesis is the **on-chain benchmarking of AI**, **agent identity**, and a Phase II **Human vs. AI** mechanism. Bingocle is built on that thesis, not decorated with it:

| Turing Test pillar | How Bingocle embodies it |
|---|---|
| **On-chain AI benchmarking** | Every Oracle verdict (word, confidence, transcript proof, timestamp) is written on-chain. The AI's accuracy is publicly *measurable over time* — its dispute rate and hit accuracy accumulate as an on-chain benchmark, not a marketing claim. |
| **Agent identity** | The Validation Oracle holds an **ERC-8004 Identity NFT**. Its reputation (events served, accuracy, dispute rate) is bound to that identity and grows on-chain — a benchmarkable, portable AI track record. |
| **Human vs. AI** | Because the market is reachable through the Minds Capability, **human players and other users' AI Minds trade the same word market**. The leaderboard can split Human vs. AI prediction accuracy — a direct, playable instance of Phase II's Human-vs-AI mechanism. |
| **The "Turing" test itself** | *Can the AI referee judge "was this word really said" as well as a human?* The dispute window is the live test: the community can challenge any verdict; a consistently low dispute rate is the AI **passing** the test, recorded forever. |
| **Radical transparency** | No black box. Anyone can open Mantle Explorer and inspect every AI decision and its proof. Off-chain inference, on-chain accountability. |

> Honest framing for judges: the AI **runs off-chain** (STT + LLM), then an ERC-8004-identified agent **commits its verdicts on-chain**. This satisfies "AI-powered function callable on-chain" via the agent-writes-on-chain interpretation — do not overstate it as inference inside the EVM.

---

## 7. Core Features

### 7.1 ⭐ Bingocle Capability (Minds Bazaar) — the consumer surface *(Part B core)*

The Capability is how real users meet Bingocle. Published to the **Minds Bazaar** with a public name, public ID, and a friction-free activation message, it is a conversational agent that runs the full game over **email and Telegram** — no terminal, no technical onboarding.

What a user (or another user's Mind) can do by chatting:
- *"Start a Bingocle event for my podcast tonight, theme Web3, pool 100 USDC."* → creates the event on-chain.
- *"Join event #MANTLE-DEMO and submit my 3 words: airdrop, mainnet, liquidity."*
- *"Buy 10 USDC on AI and 4 on Airdrop."* → places positions (gasless).
- *"How's my card?"* → returns the live-marked card + which words have hit.
- *"Claim my rewards."* → settles and claims on-chain.

Two requirements straight from the scorecard, treated as first-class:
- **`/agent-guide` for cross-Mind reproducibility (Path B):** a complete, accurate guide so a *completely different user's Mind, with zero builder context, can equip and operate the Capability.* **Judges will test this directly** — so the guide is engineered and rehearsed against a clean Mind, not an afterthought.
- **Build-process transparency:** the entire build conversation (the email/Telegram thread between the builder and their Mind, idea → shipped Capability) is captured from day one and submitted, showing genuine iterative problem-solving rather than a tool wrapped post-hoc. *Worth up to 10 points; produce it deliberately.*

### 7.2 ⭐ AI Validation Oracle — "the referee" *(Part A: Innovation + Technical)*

The AI agent that replaces manual validation entirely:

1. **Listen** — the agent receives the live event audio stream (venue mic / livestream audio).
2. **Transcribe** — speech-to-text (Whisper) transcribes in real time.
3. **Match & Reason** — an LLM (Claude) matches the transcript against the word pool: handling synonyms, acronyms, and context (e.g. "artificial intelligence" → matches "AI"; "digital wallet" → matches "Wallet"). It also rejects false positives.
4. **Commit on-chain** — every validated word is written to the `OracleRegistry` contract on Mantle, with timestamp, a transcript snippet (proof), and a confidence score.
5. **Settle** — that on-chain commit automatically triggers card marking, bingo-pattern detection, and reward calculation — all in the smart contract, no human in the loop.

**Key properties:**
- ✅ *AI-powered function callable on-chain* (Deployment Award requirement satisfied by design).
- ✅ Auditable: anyone can inspect every AI decision and its proof on Mantle Explorer.
- ✅ Dispute window: a brief period where the community can flag a verdict believed wrong before final settlement (human-in-the-loop as a safety net, not an operator).
- ✅ The agent holds an **ERC-8004 Identity NFT** — oracle reputation accumulates on-chain.

### 7.3 AI Word Curator — automatic moderation & normalization

During submission, the LLM automatically:
- **Normalizes**: `ai` / `Ai` / `artificial intelligence` → `AI`; `smartcontract` → `Smart Contract`.
- **Semantic dedup**: same-meaning words are merged along with their votes.
- **Filters**: profanity, spam, links, over-generic words (*the, and, that*), and off-theme words are rejected — with the reason shown to the user.
- **Theme-relevance scoring**: each word gets a relevance score against the event theme.

The curated result (final 25-word pool for a 5×5 card) is committed on-chain as a merkle root so it cannot change after the market opens.

### 7.4 AI Odds Engine — pricing & multipliers

The LLM plus community vote data set each word's opening price and multiplier:

- **Community signal**: vote count (more votes → higher implied probability → higher price, smaller multiplier).
- **AI signal**: the LLM estimates each word's probability of being spoken from the theme, event description, and speaker profile — catching *under-voted but near-certain* words.

| Word | Votes | AI Probability | Opening Price | Multiplier |
|---|---|---|---|---|
| AI | 25 | 0.95 | 0.80 | 1.2× |
| Blockchain | 18 | 0.85 | 0.70 | 1.5× |
| Funding | 15 | 0.60 | 0.55 | 1.7× |
| Airdrop | 5 | 0.20 | 0.25 | 2.5× |

Final parameters are published on-chain before the market opens — transparent and tamper-proof thereafter.

### 7.5 ⭐ Word Founder — why anyone submits words *(the submission incentive)*

**The problem this fixes:** in a naive design, submitting a word gives no edge — and worse, a word you believe in becomes popular, its price rises, its multiplier shrinks, so *you and everyone get worse odds.* The incentive is backwards. The **Word Founder** mechanic fixes it and makes submission the on-ramp.

Submit a word that makes the final pool → you become that word's **Founder**. **One Founder per word = the *first* wallet to submit it (earliest timestamp); later identical submissions still count as votes but grant no Founder rights** (co-founder split is a post-hackathon variant). The Founder receives:

1. **Free seed position** — one free share of that word. A costless prediction with real upside. This is the core hook: *submission = a free lottery ticket on your own prediction* — perfect Web2, no-money entry.
2. **Founder price** — the right to buy more at the opening (cheapest) price during an early window, **before** public trading widens the parimutuel pool. So yes — the submitter gets the cheapest entry, by design.
3. *(optional)* **Curator royalty** — a small cut (e.g. 1% of that word's pool) at settlement if the word is spoken, rewarding good word-sourcing.

**Two ways to get a position — the clean mental model:**
- **Submit (free, skill):** propose words. If yours makes the pool, you get a free Founder stake at the best price. Reward = prediction skill + word-sourcing. The viral, zero-barrier on-ramp.
- **Buy (paid, conviction):** buy more on any word at the running odds. Reward = capital conviction. The depth layer.

**Worked example:** You submit "Airdrop" early; it makes the pool at price 0.25 / mult 2.5×. As Founder you get 1 free share + a 60-second window to buy at 0.25 before the public floods in. If "airdrop" is said → your free share pays 1 × 2.5 = 2.5 (zero cost), and your Founder-price buys pay 2.5× while latecomers paid more. If it is *not* said → you only lose what you paid; the free seed cost nothing. Limited downside, asymmetric upside.

**Sybil safeguards (required):** 1 wallet = max 3 words + 1 card per event; the free seed is funded from a small **capped sponsor/faucet pool, never from the buyers' parimutuel pool**; curation filter + social-login dedup; Founder allocation capped at ≤ X% of a word's pool, disclosed on-chain.

### 7.6 Channel-native delivery — email + Telegram

The scorecard rewards Capabilities that feel **native to email and Telegram**:

- **Telegram bot / Mini App**: join an event, submit words, see the card, buy positions, and get real-time pushes ("🔔 'AI' was just said — your card is 1 word from BINGO!") inside the event's community group.
- **Email**: the same conversational flow for inbox-native users — create events, receive a card image, get a settlement summary, claim via a one-tap link.
- **Agent-vs-Human angle**: humans and AI Minds can play the same market — aligned with the *Human vs. AI* theme (§6).

### 7.7 Prediction Market On-chain

- **Buy position** on a word (MVP: buy-only, parimutuel pool per word) using MNT/USDC on Mantle.
- Price & multiplier from the AI Odds Engine, recorded on-chain.
- The market auto-locks when the event starts (on-chain timestamp).
- Settlement auto-triggered by the AI Oracle commit.
- **Later**: sell/exit position, dynamic AMM pricing, live in-event market.

### 7.8 Bingo Card NFT, Win Condition & Rewards

**Bingo Card NFT.** Each bingo card is minted as an **NFT on Mantle** — a unique layout per user (shuffled from the same pool, fairness preserved), locked when the market closes, kept as a collectible / proof of participation.

**When the event ends** (whichever comes first): the organizer closes it (talk over) · a hard time cap (e.g. 60 min) · all/most words validated. **Not** the first bingo — **a bingo does not stop the game.** Ending at first bingo would gut the market (positions on not-yet-spoken words would expire) and reduce bingo to card-shuffle luck, since validation marks every card simultaneously.

**Many winners — two independent reward rails, computed by the smart contract:**
- **Prediction reward** = `amount × multiplier` for each word you hold a position on that is validated as spoken. Every holder of that word is paid (parimutuel).
- **Bingo bonus** from the reward pool: 1 line = 50, diagonal = 75, 2 lines = 100, full card = 500 (configurable per event). **Tiered and stackable** — you can hit it repeatedly as more words validate (1 line → 2 lines → full card).
- *(optional)* **First-bingo jackpot** — a fixed bonus for whoever bingos first; adds race tension **without** ending the event.

**Winners are ranked by leaderboard:** profit / prediction accuracy / number of bingos (Human vs AI split, §6). The skill lives in the market; bingo is the luck + viral layer.

**On-chain claim** + transparent reward history.

### 7.9 Leaderboard, Streak & Viral Loop

- Global and per-event leaderboards: top profit, top bingo, top prediction accuracy — and a **Human vs. AI** accuracy split (§6).
- **Share card**: the finished card (markings & profit) shares as an image to X / Telegram in one tap — a *built-in viral loop* for Community Voting.
- On-chain streaks & badges (soulbound) for multi-event players.

### 7.10 Web2-friendly onboarding

- **Social login + embedded wallet** (e.g. Privy / Web3Auth) — no seed phrase.
- **Gasless transactions** via Account Abstraction / paymaster on Mantle.
- **Free-play mode** (points, no funds) for educational events; **staked mode** (MNT/USDC) for competitive events. *Lead with free-play to keep the "gambling" optics low.*

---

## 8. Technical Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      CONSUMER SURFACE                            │
│   Bingocle Capability (Minds Bazaar)  ·  Telegram  ·  Email     │
│   Next.js Web App (wallet / social login / gasless via AA)       │
│   → cross-Mind operable via /agent-guide                         │
└────────────────┬────────────────────────────────────────────────┘
                 │  conversational intents → API
┌────────────────▼────────────────────────────────────────────────┐
│                       AI AGENT LAYER                             │
│  ┌──────────────────┐ ┌─────────────────┐ ┌───────────────────┐ │
│  │ AI Validation     │ │ AI Word Curator │ │ AI Odds Engine    │ │
│  │ Oracle            │ │ (LLM moderation │ │ (LLM probability  │ │
│  │ (Whisper STT +    │ │  + normalize +  │ │  + community vote │ │
│  │  LLM matching)    │ │  dedup + filter)│ │  → price/mult.)   │ │
│  └────────┬─────────┘ └────────┬────────┘ └─────────┬─────────┘ │
│           │  signed txs (agent wallet, ERC-8004 identity)        │
└───────────┼────────────────────┼─────────────────────┼──────────┘
            │                    │                     │
┌───────────▼────────────────────▼─────────────────────▼──────────┐
│                  SMART CONTRACTS — MANTLE NETWORK                 │
│  EventFactory   — create & configure an event                    │
│  WordPool       — merkle root of final word pool + odds           │
│  WordMarket     — buy position, parimutuel pool, Founder seed     │
│  OracleRegistry — AI validation commits (word, proof, confidence) │
│  BingoCardNFT   — mint a unique card per user (ERC-721)           │
│  RewardVault    — settlement, bingo bonus, claim                  │
│  AgentIdentity  — ERC-8004 NFT for the AI Oracle + reputation     │
└──────────────────────────────────────────────────────────────────┘
```

**Stack:** Solidity (Foundry/Hardhat) · Next.js + wagmi/viem · Node.js agent service · Whisper (STT) · Claude API (matching, curation, odds) · Minds Capability SDK · Telegram Bot API · email gateway · Mantle Sepolia → Mainnet.

**Security & fairness:**
- Word pool & odds locked via merkle root before the market opens.
- Oracle commits include the transcript proof + confidence; a dispute window precedes final settlement.
- One wallet = one card per event; submission rate-limits; all deadlines enforced by contract timestamps, not the backend.
- Full validation log on-chain: what was validated, when, by which agent, with what proof.

---

## 9. Main Flows

### 9.1 Short flow

```
Organizer creates an event (on-chain, EventFactory)
        ↓
Users submit words (max 3 per user) → submitters become Word Founders
        ↓
AI Word Curator: normalize → dedup → filter → rank
        ↓
Final word pool (25) + AI odds committed on-chain
        ↓
Founders get free seed + early founder-price window
        ↓
A Bingo Card NFT is minted for each participant
        ↓
Public market opens — users buy word positions (MNT/USDC, gasless)
        ↓
Event starts → market auto-locks
        ↓
AI Validation Oracle listens live → commits spoken
words to OracleRegistry (+ transcript proof)
        ↓
Smart contract: mark all cards → detect bingo patterns
        ↓
Short dispute window → final settlement
        ↓
RewardVault: prediction reward + bingo bonus → claim
        ↓
Leaderboard (incl. Human vs AI) & share card (viral loop)
```

### 9.2 User flow (via Capability)

1. Open the Bingocle Capability in Minds (or DM the Telegram bot / reply to the email) → social login or connect wallet.
2. Pick an active event → read theme & rules.
3. Submit up to 3 words predicted to be said → become a Founder of those that make the pool.
4. See the AI-curated result & community word ranking; claim your free Founder seed.
5. Receive a Bingo Card NFT.
6. Optionally buy more positions (Founder price in the early window; running odds after).
7. Live event: watch the card mark in real time as the AI validates words; get Telegram/email notifications.
8. Event ends: claim rewards, check the leaderboard, share the card.

### 9.3 Organizer flow

1. Create an event by chatting with the Capability (or via dashboard): name, theme, description, schedule, card size, reward pool (deposit MNT/USDC), audio source.
2. Open the submission phase → watch AI curation (override as final moderator if needed).
3. Finalize the word pool → founder window, then public market opens automatically.
4. When the event starts: connect the audio stream to the AI Oracle.
5. After the event: review disputes (if any) → automatic final settlement.

---

## 10. Full Scenario Example

**Event:** Mantle Builder Demo Day · Theme: Web3, AI, Startup · Reward pool: 1,000 USDC · 5×5 card.

1. 120 participants submit words. The AI Curator merges `ai` / `Artificial Intelligence` → **AI** (38 votes) and rejects 14 spam/off-theme words.
2. A 25-word pool + odds is committed on-chain. *AI: 0.80 / 1.2× · Airdrop: 0.25 / 2.5×.*
3. User A submitted "Airdrop" early → Founder: 1 free share + buys 4 USDC more at the 0.25 founder price. Via the Telegram Capability they also buy **AI** for 10 USDC. Their Card NFT is minted.
4. The demo day runs. At 12:30, a speaker says *"…we use artificial intelligence to…"* → the Oracle commits `AI ✅` + transcript snippet + confidence 0.97 → all cards auto-mark.
5. Across the event, 14 words are validated. User A's card forms one bingo line.
6. Settlement: User A receives 10 × 1.2 = 12 USDC (AI hit) + the Airdrop payout if it was said + 50 USDC bingo bonus. Claimed on-chain.
7. User A shares the finished card + profit to X. Their friends join the next event.

---

## 11. Target Users & Use Cases

| Segment | Use case |
|---|---|
| **Event / Conference Organizer** | An engagement layer — the audience stays active throughout |
| **Web3 Communities & DAOs** | A side game during AMAs, community calls, town halls |
| **Hackathon Organizers** | A game during demo day & pitching (meta: playable during *this* hackathon's demo day) |
| **Podcasters & Livestreamers** | Viewers guess the words a host/guest will say; Telegram notifications |
| **Debates & Media** | Predict the key words a candidate / panelist will use |
| **Education** | Free-play mode: lesson-material bingo, points as rewards |

---

## 12. Alignment with Judging Criteria

Mapped to the **actual unified scorecard (Animoca / Consumer & Viral DApps)**, with a candid self-estimate. Goal: hit the verbatim **"Excellent" (90–100)** band descriptors on both parts.

### 12.1 Part A — Mantle General (50 pts)

| Dimension | Pts | How Bingocle earns it | Self-est. |
|---|---|---|---|
| **Technical** | 15 | End-to-end AI × on-chain on Mantle: an STT+LLM oracle writing state to contracts; 7 integrated contracts; agent architecture + merkle commitment + dispute window | 11–13 |
| **Ecosystem fit** | 10 | Deploy & settle on Mantle; MNT/USDC as the game asset; AA/gasless; ERC-8004 agent identity; brings Web2 event audiences on-chain | 8–9 |
| **Business potential** | 10 | Revenue: platform fee (2–5% of pool), B2B organizer packages, sponsored word slots; clear GTM from Web3 & Mantle community events | 7–8 |
| **Innovation** | 10 | A new category: **an AI speech oracle for a consumer prediction market** — no direct equivalent; not a protocol fork | 9–10 |
| **UX** | 5 | Social login, gasless, channel-native (email+Telegram), a bingo format everyone understands | 4–5 |

*"Excellent" target:* "Breakthrough technical depth; seamless Mantle integration; production-ready with a clear and complete business logic loop." → the submit→buy→validate→settle→claim loop must run end-to-end on testnet, verified on Explorer.

### 12.2 Part B — Animoca: Consumer & Viral DApps (50 pts)

| Dimension | Pts | How Bingocle earns it | Self-est. |
|---|---|---|---|
| **Bazaar publish quality** | 12 | Capability published to the Minds Bazaar: public name, public ID, frictionless activation; complete, accurate `/agent-guide` so any Mind can find/equip/invoke it | 9–11 |
| **Channel-native UX** | 10 | Telegram Mini App + bot + email flow: join, play, win without leaving the chat — no terminal, no technical onboarding, no external builder context | 8–9 |
| **Build-process transparency** | 10 | The full build conversation (user↔Mind email/Telegram thread, idea → shipped Capability) submitted, showing genuine iterative problem-solving | 7–9 |
| **Track-specific (Path A *or* B)** | 13 | **Primary: Path A** — the build conversation shows a real consumer problem (passive audiences) refined and solved through Mind interaction, the Capability its natural output. **Hedge: Path B** — `/agent-guide` engineered so a different user's Mind can equip & operate it with zero context (judges test this) | 9–11 |
| **Execution & demo quality** | 5 | Capability live on Bazaar; demo video ≥2 min shows **a different user's Mind** equipping and playing end-to-end; web app + contracts live with a public URL | 4–5 |

*"Excellent" target (Animoca):* "Capability is live on Bazaar, fully self-documenting via /agent-guide, and independently operable by any Mind; build conversation shows genuine iterative problem-solving; demo is compelling end-to-end."

> **Path choice:** Declare **Path A (Consumer Capability)** as primary — the build story is strong. But *engineer for Path B too*: a bulletproof `/agent-guide` that lets a stranger's Mind run the game protects the 13-pt slot if judges test reproducibility.

**Self-estimated total: ~76–90 / 100** → "Good" to "Excellent". The two biggest levers: (1) the build-conversation artifact being captured and genuine, and (2) the demo proving a *different* Mind can run it.

### 12.3 Top-20 Deployment Award checklist ($1,000)

- ✅ Smart contracts on Mantle Testnet/Mainnet, **verified on Mantle Explorer**
- ✅ AI function callable on-chain: `OracleRegistry.commitValidation()` written by the AI agent
- ✅ Public frontend (Vercel) — not localhost
- ✅ Deployment addresses listed in the submission
- ✅ Demo video ≥ 2 min (core use-case walkthrough)
- ✅ Open-source GitHub repo + README (setup, architecture, contract addresses)

### 12.4 Best UI/UX ($3,000) & 12.5 Community Voting ($8,500) — secondary

Playful-but-clean identity; a 3-step flow (submit → buy → watch); **AI Interaction Design** (transcript quote + "why the AI is confident"); free-play without a wallet. For Community Voting: the share-card viral loop, a demo non-technical people grasp in 15 seconds, and a game the community *can play during the voting window*.

---

## 13. Business Model

1. **Platform fee** — 2–5% of the reward pool on each paid event.
2. **B2B event package** — organizers pay for white-label + oracle support (audio setup, premium curation).
3. **Sponsored words** — brands sponsor a word/slot on the card for large events (playful native advertising).
4. **Later** — reward pools parked in yield-bearing Mantle assets (mETH) during the event; the yield tops up the prize pool.

---

## 14. MVP Scope & 5-Day Sprint (deadline June 15, 15:59)

> **Reality: ~5 days from June 10.** Part B (50 pts) lives entirely in the Minds Capability, so the MVP **leads with the Capability** and treats the chain as the spine it calls into. Ship the thinnest end-to-end vertical slice; depth is optional.

### Must-have (core demo)

1. ✅ **Bingocle Capability on the Minds Bazaar** — public name/ID, activation message, working over **Telegram (email if time)**, complete `/agent-guide`
2. ✅ **Captured build conversation** (user↔Mind thread) — *a scored artifact; start capturing now*
3. ✅ `EventFactory`, `WordMarket` (with Founder seed), `OracleRegistry`, `RewardVault` on **Mantle Sepolia** — verified on Explorer (`BingoCardNFT` optional → can be a mapping for the slice)
4. ✅ **AI Word Curator** (normalize + dedup + filter) + **AI Odds Engine** via Claude API
5. ✅ **AI Validation Oracle**: Whisper STT + LLM matching → commit on-chain — **demo on rehearsed/recorded audio**, not live-only
6. ✅ Web app: join, submit, see card, buy (buy-only), live marking, claim
7. ✅ Public frontend + demo video ≥2 min (**showing a different user's Mind equipping the Capability**) + README
8. ✅ ERC-8004 identity NFT for the oracle agent

### Day-by-day (aggressive; cut as needed)

| Day | Focus |
|---|---|
| **Jun 10–11** | Contract skeletons on Sepolia; Capability skeleton on Minds; **start build-chat capture** |
| **Jun 12** | Curator + Odds + Founder seed; Oracle commit path (Whisper+Claude); web app core |
| **Jun 13** | Wire Capability ↔ contracts over Telegram; live marking; `/agent-guide` draft |
| **Jun 14** | Test `/agent-guide` with a clean Mind (Path B); record the oracle demo; share-card |
| **Jun 15 (before 15:59)** | Demo video (a *different* Mind equips it); README; verify on Explorer; **submit X thread #MantleAIHackathon + DoraHacks BUIDL** |

### If solo / very short on time — the thin slice
Capability + 3 contracts (`EventFactory`, `WordMarket`, `OracleRegistry`) + recorded-oracle demo. Drop email (Telegram only), drop `BingoCardNFT` (use a mapping + image render), drop leaderboard. **Never drop:** the published Capability, the `/agent-guide`, the build conversation, and the "different Mind" demo — that is the 50-point half.

### Out of scope (roadmap)
Sell/exit & dynamic AMM pricing · multi-oracle consensus · yield-bearing pool (mETH) · native mobile app · multilingual oracle.

---

## 15. Timeline & Prizes

| Milestone | Date |
|---|---|
| Phase I — ClawHack ($20k) | April 15–30, 2026 (closed) |
| **Phase II — AI Awakening submission deadline** | **June 15, 2026, 15:59** *(confirm timezone on DoraHacks)* |
| Demo Day (finalists, livestream) | **July 2–3, 2026** |
| Awards ceremony | **July 10, 2026** |

**Prize pool (Phase II, $100k total):** Grand Champion $9,000 · 6 Track Winners × $8,500 · 2 Community Voting × $8,500 · Best UI/UX $3,000 · Top-20 Deployment × $1,000. Plus ~$110k in computing credits across providers.

**Submission method:** post an X thread tagged **#MantleAIHackathon** with pitch + demo video + GitHub link + Mantle contract address, and submit the BUIDL on DoraHacks. *(Confirm exact format on the live page — the `/detail` page is JS-gated and could not be fetched directly; these facts come from secondary reporting of it.)*

---

## 16. Post-Hackathon Roadmap

| Phase | Target |
|---|---|
| **Q3 2026** | Mainnet launch; first 10 Mantle community events; full Telegram Mini App + email |
| **Q4 2026** | B2B organizer dashboard; sponsored words; multi-oracle consensus |
| **Q1 2027** | "Speech Oracle as a Service" SDK — other protocols use the Bingocle oracle for speech/live-event markets |

Long-term vision: **Bingocle becomes the first speech-oracle infrastructure in Web3** — bingo is its first consumer product, not its last.

---

## 17. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| **5 days is very tight** | Thin vertical slice (§14); Capability + recorded-oracle demo first |
| **Doing too much** (full oracle *and* polished Capability) | Capability-first MVP; chain is the spine, not the show |
| **Part B is 50% and is new work** unrelated to the chain | Treat the Capability, `/agent-guide`, and build-chat as primary deliverables |
| **Live oracle demo fragility** (STT errors, bad mic) | Demo on rehearsed/recorded audio; confidence threshold + dispute window |
| **Path B reproducibility test fails** | Rehearse `/agent-guide` with a clean Mind that has zero builder context |
| **Build-conversation artifact forgotten** | Capture the user↔Mind thread from day one (worth up to 10 pts) |
| **"Gambling" optics** | Lead with free-play mode; staked mode optional |
| **Over-claiming "AI on-chain"** | Say precisely: ERC-8004 agent commits verdicts on-chain; inference is off-chain |
| **"Polymarket clone" perception** | Lead the pitch with bingo + AI speech oracle + community-sourced words (§4) |

---

## 18. Submission Checklist (DoraHacks)

- [ ] **Bingocle Capability live on the Minds Bazaar** (public name, public ID, activation message, `/agent-guide`)
- [ ] **Build conversation submitted** (email/Telegram thread, idea → shipped Capability)
- [ ] **Demo video ≥ 2 min showing a *different* user's Mind** equipping and playing end-to-end
- [ ] Public GitHub repo: contracts + agent + frontend, README (setup, architecture, contract addresses)
- [ ] Contracts deployed & **verified** on Mantle Explorer (list every address)
- [ ] Live demo URL (Vercel) — publicly accessible
- [ ] Pitch deck (problem, solution, demo, architecture, business model, roadmap)
- [ ] Track nomination: **Consumer & Viral DApps**
- [ ] **X thread tagged #MantleAIHackathon** with pitch + demo video + repo + Mantle contract address
- [ ] BUIDL submitted on DoraHacks before **June 15, 15:59**
```
