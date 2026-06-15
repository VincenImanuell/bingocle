# Bingocle

**AI-Powered Community Bingo Prediction Market on Mantle**

> Trade the words before they hit the card — verified live by an AI Oracle, settled on Mantle.

**Bingocle** = **Bing**o + Or**acle** — a bingo game refereed by an on-chain AI oracle.

- **Hackathon:** The Turing Test Hackathon 2026 (Phase II — AI Awakening) · Mantle Network
- **Track:** Consumer & Viral DApps — Track 04 (Animoca Minds · Animoca Brands · OpenCheck)
- **Status:** ✅ Deployed — 7 verified contracts on Mantle Sepolia, live web app, hosted agent + bot, Minds Bazaar skill published
- **Live app:** https://bingocle-play.vercel.app
- **Docs:** https://bingocle-doc.vercel.app
- **Telegram bot:** [@Bingocle_teleBot](https://t.me/Bingocle_teleBot)

---

## What is Bingocle?

Imagine a Trump rally. The crowd already *knows* he'll say "tremendous", "fake news", "wall" — so why not turn that into a prediction market? A shareable bingo card, words priced by crowd demand, settled live by an AI oracle. That's Bingocle — and it works for any live talk, debate, earnings call, or conference.

Players predict which words a speaker will say, trade those words like positions on a bonding curve, and an **AI Validation Oracle** processes the speech transcript — Gemini matches each spoken word against the predicted pool and writes its verdicts straight to a smart contract on Mantle, triggering settlement and reward distribution automatically and transparently.

No admin marks words by hand. No black box. Every AI decision is recorded on-chain forever.

---

## Try It Now

### Option 1 — Web App (no wallet needed to start)

**https://bingocle-play.vercel.app**

| Route | What you get |
|---|---|
| `/` | Landing page — smooth-scroll intro, how-to-play, live price tickers |
| `/play` | **Demo Mode** — full game loop in-browser, no wallet, no gas. Submit words → simulated curation → bingo card → buy positions (prices animate) → oracle marks tiles → settle & claim. Instant feel of the full loop — no real contracts called. |
| `/app` | **On-chain Mode** — connect MetaMask on Mantle Sepolia, see real live events in the lobby, mint a bingo card NFT, buy word positions, watch the oracle mark tiles, claim rewards. |

For `/app`: set MetaMask to **Mantle Sepolia** (chainId 5003, RPC `https://rpc.sepolia.mantle.xyz`). Get free MNT from the [faucet](https://faucet.sepolia.mantle.xyz/).

### Option 2 — Telegram Bot (no wallet, no install)

Chat with **[@Bingocle_teleBot](https://t.me/Bingocle_teleBot)**. A testnet demo wallet is auto-created for you. Talk naturally:

```
"show my wallet"       → your demo wallet address + balance
"mint my card"         → mints a bingo card on the current event
"buy Oracle"           → buys a word position
"show my card"         → your current card + marked tiles
"check event"          → current phase + active words
```

Natural language works — you don't need exact commands.

### Option 3 — Animoca Minds Bazaar

Search for **"Bingocle"** in the Minds Bazaar (Skill ID `AD1A503E-F36B-1410-8464-00039CE7DF11`). Equip it to your Mind and ask it to play.

---

## What Is Deployed and Working

| Component | Status | Detail |
|---|---|---|
| 7 Smart Contracts | ✅ Deployed + Verified | Mantle Sepolia (chainId 5003) — verified on Mantlescan |
| ERC-8004 Agent Identity | ✅ Live | Oracle signs txs via `AgentIdentity` |
| AI Word Curator + Odds Engine | ✅ Live | Gemini `gemini-2.5-flash` — curates submissions, prices words |
| AI Validation Oracle | ✅ Live | Gemini matches transcript words → `commitValidation` on-chain |
| Agent Service | ✅ Hosted | https://bingocle-production.up.railway.app |
| Telegram Bot | ✅ Hosted | @Bingocle_teleBot — NL commands + demo wallets working |
| Web App | ✅ Live | https://bingocle-play.vercel.app (`/play` demo + `/app` on-chain) |
| Docs Site | ✅ Live | https://bingocle-doc.vercel.app |
| Minds Bazaar Skill | ✅ Published + Listed | Skill ID `AD1A503E-F36B-1410-8464-00039CE7DF11`, slug `bingocle-skill` |
| Live On-chain Event | ✅ Exists | eventCount > 0, playable on `/app` right now |

---

## What Is Not Yet Live (Honest Limitations)

| Feature | Status | Note |
|---|---|---|
| Real-time audio STT | ⚠️ Demo uses transcript | The Oracle pipeline supports Whisper STT for live mics/streams (see `agent/src/cli/validateAudio.ts`), but this requires an OpenAI API key not set in the deployed instance. In the demo, a prepared transcript of the same speech is fed to Gemini — same AI matching, same on-chain commits, fully reproducible. |
| Email channel | ⚠️ Coded, not wired | Email adapter (`capability/src/email.ts`) is fully built and NL-capable, but no live email address is connected for the hackathon demo. Telegram is the live channel. |
| Oracle self-trigger | ⚠️ Manual for now | The oracle is triggered by the organizer (via the agent API or CLI) when an event goes Live. Auto-trigger on phase change is on the roadmap. |
| WalletConnect | ⚠️ Placeholder | WalletConnect project ID is a placeholder. Injected wallets (MetaMask, Rabby) work fully. |

---

## If Something Doesn't Work — Read This First

These are the known behaviors you might encounter when trying the live demo. All are by design or expected trade-offs of a hackathon deployment.

**Telegram bot doesn't understand my message**
> The bot uses Gemini `gemini-2.5-flash` for natural-language understanding. Under high demand or free-tier rate limits, Gemini may return a 429 error and the NL layer silently falls back. If plain English doesn't get a response, use explicit commands instead — they work without Gemini:
> ```
> /start          → register + create demo wallet
> /help           → full command list
> /wallet         → show wallet address + balance
> /card           → show your bingo card
> /event          → current event status
> ```

**Bot is offline / not responding at all**
> The bot runs on Railway's free tier (500 hrs/month). If the service has exhausted its quota for the month, it may be sleeping. The web app at `https://bingocle.vercel.app/play` gives the full game experience with no external dependency — use `https://bingocle-play.vercel.app/play` (demo mode) to see the complete loop, or `/app` for real on-chain play.

**I can't mint a card on `/app` — button is greyed out**
> Minting is only available during the **Market phase** of an event. Each event goes through phases: Submission → Founder → Market → Live → Settled. If the current event is in Live or Settled phase, wait for the next event or try `/play` (demo mode) which lets you experience the full loop instantly.

**Tiles aren't lighting up on `/app` during the Live phase**
> The oracle is triggered manually by the organizer when an event goes Live (auto-trigger is on the roadmap). Verdicts committed on-chain are visible at [OracleRegistry txs](https://sepolia.mantlescan.xyz/txs?a=0xe998c6F467876b2dA1C5D126EA5576A6943c2073). If no new tiles light up, the oracle run for this event may not have happened yet.

**I need MNT to use `/app` but my wallet is empty**
> Get free Mantle Sepolia testnet MNT from the faucet: https://faucet.sepolia.mantle.xyz/ — paste your MetaMask address, wait ~30s, then retry.

**"Mint" button works but then says I already have a card**
> Each wallet can only mint one bingo card per event. If you already minted for this event, your card is already on-chain — scroll down to see it, or click "Show My Card".

**MetaMask shows "nonce too low" or transaction keeps pending**
> Open MetaMask → Settings → Advanced → "Clear activity and nonce data". This resets the local nonce cache without touching your funds.

**WalletConnect QR doesn't work**
> The WalletConnect project ID is a placeholder. Browser-extension wallets (MetaMask, Rabby) work fully — connect via the injected wallet option.

**The web app shows word labels like `#0`, `#1` instead of real words**
> This means the frontend couldn't reach the agent service to fetch word labels. The agent is hosted at `https://bingocle-production.up.railway.app` — if it's temporarily down (Railway cold start takes ~10s), reload the page after a few seconds.

**The oracle ran but only a few tiles lit up, not all the words I expected**
> The oracle uses Gemini to match words spoken in the transcript against the event's word pool. Only words that appear clearly in the transcript with confidence ≥ 0.6 get committed. This is intentional — the oracle doesn't guess; it only marks what it heard with high confidence.

**`/play` looks identical to `/app` — what's the difference?**
> `/play` is a fully browser-side simulation — no wallet, no gas, no real contracts. It's there so anyone can feel the complete game loop instantly. `/app` makes real on-chain transactions on Mantle Sepolia: minting the NFT card, buying word positions, and claiming rewards all hit the deployed contracts and cost testnet MNT.

---

## Deployed Contract Addresses (Mantle Sepolia)

Network: Mantle Sepolia (chainId 5003)
Oracle / Agent wallet: `0x785cF4596b932B4319Eb31b9C353fE7Ae7695D2D`

| Contract | Address | Mantlescan |
|---|---|---|
| AgentIdentity (ERC-8004) | `0x6EC7E9AE2dD88fAe0F1851487Fbd15F0b89382A0` | [view](https://sepolia.mantlescan.xyz/address/0x6EC7E9AE2dD88fAe0F1851487Fbd15F0b89382A0#code) |
| EventFactory | `0x4ded43273E1b3be15bBBF1A5cE9494f77B045Afb` | [view](https://sepolia.mantlescan.xyz/address/0x4ded43273E1b3be15bBBF1A5cE9494f77B045Afb#code) |
| WordPool | `0x1F0BebC4D0f7C4B8428Ac2FE14BBeb2178e63C29` | [view](https://sepolia.mantlescan.xyz/address/0x1F0BebC4D0f7C4B8428Ac2FE14BBeb2178e63C29#code) |
| WordMarket | `0x2a853222d57d28a713F45b8F78503376ccF5471b` | [view](https://sepolia.mantlescan.xyz/address/0x2a853222d57d28a713F45b8F78503376ccF5471b#code) |
| OracleRegistry | `0xe998c6F467876b2dA1C5D126EA5576A6943c2073` | [view](https://sepolia.mantlescan.xyz/address/0xe998c6F467876b2dA1C5D126EA5576A6943c2073#code) |
| BingoCardNFT | `0x1A7643b31EfD272F65fe7D8653fE35172284A1F3` | [view](https://sepolia.mantlescan.xyz/address/0x1A7643b31EfD272F65fe7D8653fE35172284A1F3#code) |
| RewardVault | `0x0B0766bF126180730E408105C35A761D7AADe968` | [view](https://sepolia.mantlescan.xyz/address/0x0B0766bF126180730E408105C35A761D7AADe968#code) |

All 7 contracts verified on Mantlescan. Oracle `commitValidation` transactions visible at:
https://sepolia.mantlescan.xyz/txs?a=0xe998c6F467876b2dA1C5D126EA5576A6943c2073

---

## Architecture

```
Consumer surface : Minds Bazaar Skill · Telegram bot · Next.js web app (/play + /app)
AI agent layer   : Validation Oracle (transcript → Gemini → commitValidation)
                   Word Curator + Odds Engine (Gemini gemini-2.5-flash)
                   → signed txs via ERC-8004 AgentIdentity
Smart contracts  : EventFactory · WordPool · WordMarket · OracleRegistry
   (Mantle)        BingoCardNFT · RewardVault · AgentIdentity
Hosting          : Agent + Bot on Railway · Frontend on Vercel · Contracts on Mantle Sepolia
```

**Stack:** Solidity (Foundry) · Next.js + wagmi v2 + RainbowKit · Node.js/TypeScript agent service · Google Gemini `gemini-2.5-flash` (Curator / Odds / Oracle reasoning) · Minds Capability (`SKILL.md` + `AGENT-GUIDE.md`) · Telegram bot · Mantle Sepolia (chainId 5003).

## Repository Structure

```
.
├── contracts/     # Solidity (Foundry) — 7 contracts + BingoLib + tests + deploy script
├── agent/         # Node/TS — AI Curator + Odds Engine + Validation Oracle + HTTP API (:8787)
├── capability/    # Node/TS — Telegram bot + email adapter + Minds Skill + agent-guide
├── frontend/      # Next.js — landing + /play (demo mode) + /app (on-chain)
├── docs-bingocle/ # Separate Next.js docs site (deployed at bingocle-doc.vercel.app)
└── README.md
```

## Run Locally

```bash
# Contracts
cd contracts && forge build && forge test

# Agent service (needs agent/.env with GEMINI_API_KEY + AGENT_PRIVATE_KEY + contract addresses)
cd agent && npm install && npm run dev     # API on :8787

# Telegram bot (needs capability/.env with TELEGRAM_BOT_TOKEN + AGENT_API_URL)
cd capability && npm install && npm run dev

# Frontend (needs frontend/.env.local with NEXT_PUBLIC_* contract addresses)
cd frontend && npm install && npm run dev  # /play and /app on :3000
```

See [`capability/AGENT-GUIDE.md`](capability/AGENT-GUIDE.md) for the full game operation guide.

---

## License

[MIT](LICENSE)
