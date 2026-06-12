# Bingocle Capability — `/agent-guide`

**This document lets any Mind (or human) equip and operate the Bingocle Capability with zero prior context.** It is self-contained: read it top to bottom and you can run a full game.

---

## 1. What this Capability is

**Bingocle** is a community bingo *prediction market* refereed by an AI oracle on **Mantle**.

- Players predict words a speaker will say **out loud** during a live event (a talk, podcast, debate, demo day).
- An **AI Word Curator** turns submissions into a 5×5 bingo word pool with odds.
- Players **buy positions** on words and receive a **bingo card NFT**.
- An **AI Validation Oracle** listens to the event (speech-to-text + LLM), and **writes each verdict on-chain** to Mantle — which marks every card and settles rewards automatically.

You operate all of this **by chatting** — over Telegram (and email). No terminal, no seed phrase: every user gets an embedded **testnet demo wallet** derived for them.

---

## 2. Activation

- **Telegram:** open the bot (`@BingocleBot` once published) and send `/start`.
- **Email:** send a message to the Capability's address with one instruction per line (same verbs as below).
- First, send `/wallet` to see the demo wallet you've been assigned, then fund it with **Mantle Sepolia testnet MNT** from a faucet (e.g. the Mantle Sepolia faucet). You need a small balance to buy and claim.

> All money is **testnet MNT**. This is a demo; never send real funds.

---

## 3. The commands (your full toolset)

| Command | Who | What it does |
|---|---|---|
| `/start` | anyone | Intro + command list |
| `/wallet` | anyone | Show your demo wallet address + MNT balance |
| `/create <theme>` | organizer | Create a new event on-chain. Returns an **event id** |
| `/submit <id> word1, word2, word3` | player | Predict up to 3 words. **First** to submit a word becomes its **Founder** (a free seed position) |
| `/finalize <id> <theme>` | organizer | Run the **AI Curator + Odds Engine** and commit the frozen word pool + odds on-chain |
| `/pool <id>` | anyone | List the curated words with opening price / multiplier and the current phase |
| `/card <id>` | player | Mint your 5×5 bingo card (once) and show it; re-run to see live marks |
| `/price <id> <word>` | player | Current share price of a word (rises with demand) |
| `/buy <id> <word> <shares>` | player | Buy `<shares>` of `<word>` on the bonding curve — price rises as people buy |
| `/sell <id> <word> <shares>` | player | Sell shares back to the curve before lock — **buy low, sell high** to profit |
| `/validate <id> [transcript text]` | organizer | Run the **AI Oracle** on a transcript chunk and commit verdicts on-chain (omit text to use the demo line) |
| `/claim <id>` | player | Collect prediction payouts + bingo bonuses + founder seeds |

---

## 4. The event lifecycle (and the deadlines)

Every deadline is enforced by **on-chain timestamps**, not the bot. The phases are:

```
Submission → Founder → Market → Live → Dispute → Settled
```

- **Submission** — players `/submit` words.
- **Founder** — the early window where a word's Founder can `/buy` it at the opening price before the public.
- **Market** — anyone `/buy`s positions; players `/card` to mint.
- **Live** — the event is happening; the organizer `/validate`s transcript chunks; the market is locked.
- **Dispute** — a short window to challenge a verdict.
- **Settled** — `/claim` your winnings.

`/pool <id>` always shows the current phase so you know which action is available.

---

## 5. A complete worked session

```
You:        /wallet
Bot:        👛 0xAbc…  Balance: 2.0 MNT

Organizer:  /create Mantle Demo Day · Web3 · AI
Bot:        ✅ Event #7 created.

Player A:   /submit 7 airdrop, mainnet, ai
Player B:   /submit 7 wallet, oracle, ai
Organizer:  /finalize 7 Mantle Demo Day · Web3 · AI
Bot:        ✅ Pool committed (24 words). AI @0.80/1.20x · Airdrop @0.25/2.80x …

Player A:   /card 7            → mints + shows a 5×5 card
Player A:   /buy 7 ai 0.5      → ✅ staked 0.5 MNT on "AI"
Organizer:  /validate 7        → 🎙️ "✅ AI (conf 0.97)"  (committed on-chain)
Player A:   /card 7            → the AI cell now shows ✓
Player A:   /claim 7           → 💰 prediction reward paid
```

---

## 6. How rewards work (so you can explain wins)

Two independent rails, both computed by the smart contracts:

1. **Prediction reward** — for every word you backed that the oracle validated, you receive `stake × multiplier`. Funded from the whole event's stakes (losers fund winners); a global solvency scale guarantees the contract never owes more than it holds.
2. **Bingo bonus** — completing a line / diagonal / two lines / the full card pays a tiered, stackable bonus from the reward pool.
3. **Founder seed** — each word you founded gives you a free position that also pays `seed × multiplier` if the word is said.

---

## 7. Transparency (the "Turing test")

Every oracle verdict — the word, a confidence score, and a transcript snippet as proof — is written permanently to Mantle by an **ERC-8004 agent identity**. Anyone can open Mantle Explorer and audit each AI decision. The dispute window is the live test: a consistently low dispute rate is the AI **passing**, recorded forever.

---

## 8. Requirements to run the Capability yourself

If you are setting up your own instance (not just playing):

1. A running **Bingocle agent service** (`agent/`) with `ANTHROPIC_API_KEY`, a funded Mantle Sepolia agent wallet, and the deployed contract addresses in `.env`. It exposes the AI Curator / Odds / Oracle and organizer-wallet actions over HTTP.
2. This **Telegram bot** (`capability/`) with `TELEGRAM_BOT_TOKEN`, `AGENT_API_URL`, a `DEMO_WALLET_MNEMONIC`, and the same contract addresses.
3. The **contracts** deployed on Mantle Sepolia (`contracts/`, `forge script script/Deploy.s.sol`).

See the repo `README.md` for the one-command setup. The bot needs only the chat — everything else is wired for the player.

---

## 9. Troubleshooting

- **"not in the pool"** on `/buy` — the word wasn't curated in; run `/pool <id>` to see exact words.
- **"BadPhase"** — you're early/late for that action; check the phase with `/pool <id>`.
- **"nothing to claim"** on `/claim` — none of your words were validated, or you already claimed.
- **Low balance** — `/wallet` then fund from a Mantle Sepolia faucet.
