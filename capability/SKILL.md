---
name: bingocle
description: Play Bingocle — a community bingo prediction market on Mantle where you predict the words a live speaker will say, buy/sell positions on a bonding curve, and an AI oracle calls the bingo and settles on-chain. Use when a user wants to create or join a live-event word market, predict words, trade word shares, mint a bingo card, or claim winnings over Telegram or email. Plays entirely through chat with an embedded testnet wallet (no seed phrase).
license: MIT
metadata:
  publicId: bingocle
  version: 0.1.0
  channels: [telegram, email]
  chain: Mantle Sepolia (chainId 5003)
  track: Consumer & Viral DApps (Animoca Minds)
---

# Bingocle

**Bingocle** = **Bing**o + Or**acle**. Players predict words a speaker will say out loud during a
live event (talk, podcast, debate, demo day). An **AI Word Curator** turns submissions into a 5×5
bingo word pool with odds; players **buy positions** on words and mint a **bingo card NFT**; an
**AI Validation Oracle** listens to the event and **writes each verdict on-chain to Mantle**, which
marks every card and settles rewards automatically.

Everything happens **in chat**. Each user gets an embedded **Mantle Sepolia testnet demo wallet**
(derived per user — no seed phrase, no extension). Talk in plain language *or* use the commands.

## Activation

- **Telegram:** open **[@Bingocle_teleBot](https://t.me/Bingocle_teleBot)** and send `/start`, or
  just say what you want.
- **Email:** message the capability address (`capability.json` → `handles.email`) — one command per
  line, or plain English.
- Then `/wallet` to get your demo wallet and fund it from the
  [Mantle Sepolia faucet](https://faucet.sepolia.mantle.xyz/). Testnet MNT only — never real funds.

## Commands

| Command | Who | What it does |
|---|---|---|
| `/start` | anyone | Intro + command list |
| `/agentguide` | anyone | Full operator guide inside the chat |
| `/wallet` | anyone | Your demo wallet address + MNT balance |
| `/create <theme>` | organizer | Create an event on-chain → returns an **event id** |
| `/submit <id> w1, w2, w3` | player | Predict up to 3 words; **first** to submit a word founds it |
| `/finalize <id> <theme>` | organizer | AI-curate the pool + odds, commit on-chain |
| `/pool <id>` | anyone | Curated words, odds, and current phase |
| `/card <id>` | player | Mint (once) + show your 5×5 bingo card with live marks |
| `/price <id> <word>` | player | Current share price (rises with demand) |
| `/buy <id> <word> <shares>` | player | Buy shares on the bonding curve |
| `/sell <id> <word> <shares>` | player | Sell shares back before lock |
| `/validate <id> [transcript]` | organizer | Run the AI oracle, commit verdicts on-chain |
| `/claim <id>` | player | Redeem trading payouts + bingo bonuses + founder seeds |

Plain-language equivalents work too: *"show my wallet"*, *"buy 2 shares of airdrop in event 1"*,
*"I bet she says mainnet and oracle"* → mapped to the right command.

## Lifecycle

`Submission → Founder → Market → Live → Dispute → Settled` — every deadline is enforced by on-chain
timestamps (not the bot). `/pool <id>` always shows the current phase. Players act with
`/submit → /card → /buy/sell → /claim`; the organizer drives `/create → /finalize → /validate`.

## How rewards work

1. **Prediction reward** — each backed word the oracle validates pays `stake × multiplier` (losers
   fund winners; a solvency scale guarantees the contract never owes more than it holds).
2. **Bingo bonus** — line / diagonal / double-line / full-card, tiered + stackable.
3. **Founder seed** — a free position on each word you founded.

## Transparency (the "Turing test")

Every oracle verdict — word, confidence, and a transcript snippet as proof — is written permanently
to Mantle by an **ERC-8004 agent identity**, auditable on Mantle Explorer. A consistently low
dispute rate is the AI **passing**, recorded forever.

## Operating your own instance

See `AGENT-GUIDE.md` §8. In short: host the `agent/` service publicly (`agent/Dockerfile` /
`render.yaml`) and set `AGENT_API_URL` to it; run this Capability with `TELEGRAM_BOT_TOKEN`,
`DEMO_WALLET_MNEMONIC`, the public `AGENT_API_URL`, optional `GEMINI_API_KEY`, and the deployed
contract addresses. Contract ABIs are embedded — no Foundry build required. Player-side verbs run
directly on-chain; only organizer/AI verbs need the agent service.
