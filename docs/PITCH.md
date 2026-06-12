# Bingocle — Pitch Outline

Submission deck spine (problem → solution → demo → architecture → business → roadmap). Each slide = one idea; speaker notes in italics.

## 1. Title
**Bingocle — trade the words before they hit the card.** The first bingo game refereed by an on-chain AI oracle, on Mantle.
*One line, one logo, the tagline.*

## 2. Problem
At every talk / podcast / debate / demo day, certain words are guaranteed to be said — but the audience only watches. Prediction markets exist, yet (a) they're intimidating for Web2 users and (b) **there is no oracle for "words a human actually speaks."**
*That missing oracle is the technical gap we fill.*

## 3. Solution
Community submits words → **AI curates** a 5×5 bingo pool with odds → players **buy positions** + get a card → an **AI Validation Oracle listens live and writes verdicts on-chain** → cards mark and rewards settle automatically. No admin, no black box.
*Bingo + prediction market + AI speech oracle, all in chat.*

## 4. Live demo (the 60 seconds that sell it)
Telegram: `/create` → `/submit` → `/finalize` (AI curates) → `/card` → `/buy` → `/validate` (AI oracle commits on-chain) → card marks ✓ → `/claim`.
*Show the on-chain verdict on Mantle Explorer mid-demo.*

## 5. Architecture
Consumer surface (Minds Capability · Telegram · email) → AI agent layer (Curator · Odds · Validation Oracle, Claude) → **7 contracts on Mantle** (EventFactory · WordPool · WordMarket · OracleRegistry · BingoCardNFT · RewardVault · AgentIdentity).
*Off-chain inference, on-chain accountability: an ERC-8004 agent commits its verdicts.*

## 6. Why it's a Turing Test project
Every AI verdict (word + confidence + transcript proof) is on-chain and auditable; the oracle's accuracy/dispute-rate is a **public, growing benchmark** bound to an ERC-8004 identity. Humans and other users' Minds trade the same market (Human vs AI leaderboard).

## 7. Why Mantle
Low fees make a micro-transaction consumer game viable; account abstraction / gasless for Web2 onboarding; ERC-8004 agent identity; MNT/USDC as the game asset.

## 8. Business
Platform fee = the loser-funded residual (`sweepResidual`); B2B organizer packages; sponsored words. Clear GTM through Mantle community events.

## 9. Traction / status
7 contracts built + 12 passing tests + verified end-to-end on-chain; AI agents + Telegram Capability live; `/agent-guide` lets any Mind run it. *(Add: deployed addresses, demo video, Bazaar link.)*

## 10. Roadmap
Mainnet + first community events → B2B dashboard + multi-oracle consensus → **"Speech Oracle as a Service"** SDK (other protocols settle live-event markets with our oracle).

## 11. Ask / close
Bingocle is the first **speech-oracle infrastructure** in Web3 — bingo is its first consumer product, not its last.
