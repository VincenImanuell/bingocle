# Bingocle

**AI-Powered Community Bingo Prediction Market on Mantle**

> Trade the words before they hit the card — verified live by an AI Oracle, settled on Mantle.

**Bingocle** = **Bing**o + Or**acle** — the bingo game refereed by an on-chain AI oracle.

- **Hackathon:** The Turing Test Hackathon 2026 (Phase II — AI Awakening) · Mantle Network
- **Track:** Consumer & Viral DApps — Track 04 (Animoca Minds · Animoca Brands · OpenCheck)
- **Status:** 🚧 Work in progress (hackathon build)

---

## What is Bingocle?

Bingocle turns the passive audience of any live event (conference, podcast, debate, livestream, demo day) into active players in a **bingo-shaped prediction market** — where the whole game loop is run and verified by **AI agents on Mantle Network**.

The community proposes words they predict a speaker will say; AI curates them into a word pool and bingo cards; each word becomes an on-chain prediction asset; then an **AI Validation Oracle listens to the event live (speech-to-text + LLM) and writes its verdicts straight to a smart contract on Mantle** — triggering settlement, card marking, and reward distribution automatically and transparently.

No admin marks words by hand. No black box. Every AI decision is recorded permanently on-chain — embodying the Turing Test theme: *on-chain benchmarking of AI, agent identity, and radical transparency.*

For the Consumer & Viral DApps track, the whole experience is **wrapped as a Minds Capability** so a user — or another user's Mind — can play by simply talking to it over email/Telegram.

## Two coupled deliverables

1. **Bingocle Capability** — the consumer surface. A Minds Bazaar skill that lets anyone create/join an event, submit words, buy positions, watch live, and claim — entirely through chat.
2. **Bingocle on-chain** — the trust + innovation layer. Smart contracts on Mantle + the AI Speech Oracle + a public web app.

## Architecture (planned)

```
Consumer surface : Minds Capability (Bazaar) · Telegram · Email · Next.js web app
AI agent layer   : Validation Oracle (Whisper STT + LLM) · Word Curator · Odds Engine
                   → signed txs via ERC-8004 agent identity
Smart contracts  : EventFactory · WordPool · WordMarket · OracleRegistry
   (Mantle)        BingoCardNFT · RewardVault · AgentIdentity
```

**Stack:** Solidity (Foundry/Hardhat) · Next.js + wagmi/viem · Node.js agent service · Whisper (STT) · Claude API · Minds Capability SDK · Telegram Bot API · Mantle Sepolia → Mainnet.

## Repository structure

```
.
├── docs/
│   ├── Bingocle_EN.md   # Full project spec (English)
│   ├── Bingocle_ID.md   # Full project spec (Bahasa Indonesia)
│   ├── project.md       # Master / brainstorm doc
│   └── SUBMISSION.md    # Mantle Turing Test 2026 submission readiness checklist
├── contracts/           # Solidity (Foundry) — 7 contracts + lib + tests + deploy script
├── agent/               # Node/TS — AI Curator + Odds Engine + Validation Oracle + HTTP API
├── capability/          # Node/TS — Telegram Capability + /agent-guide (Part B surface)
├── frontend/            # Next.js web app (landing + playable demo)
├── LICENSE
└── README.md
```

## Quickstart

```bash
# 1. Contracts — build, test, deploy to Mantle Sepolia
cd contracts && forge build && forge test && cd ..

# Deploy + auto-write addresses into agent/.env and capability/.env:
PRIVATE_KEY=0x... AGENT_ADDRESS=0x... RPC_URL=https://rpc.sepolia.mantle.xyz \
  scripts/deploy.sh --broadcast --verify
# (or run forge script script/Deploy.s.sol directly and copy the printed addresses)

# 2. Agent service — AI Curator / Odds / Oracle + organizer API
cd ../agent
cp .env.example .env   # ANTHROPIC_API_KEY, AGENT_PRIVATE_KEY, deployed addresses
npm install && npm run start

# 3. Capability — the Telegram chat surface
cd ../capability
cp .env.example .env   # TELEGRAM_BOT_TOKEN, AGENT_API_URL, DEMO_WALLET_MNEMONIC, addresses
npm install && npm run start
```

The AI agent wallet (`AGENT_ADDRESS`) is registered as the ERC-8004 oracle and the WordPool curator by the deploy script. Read [`capability/AGENT-GUIDE.md`](capability/AGENT-GUIDE.md) to operate the game from chat.

## Deployed addresses (Mantle Sepolia)

> Filled after `forge script Deploy` — paste the console output here for the submission.

| Contract | Address |
|---|---|
| EventFactory | `0x…` |
| WordPool | `0x…` |
| WordMarket | `0x…` |
| OracleRegistry | `0x…` |
| BingoCardNFT | `0x…` |
| RewardVault | `0x…` |
| AgentIdentity (ERC-8004) | `0x…` |

## Documentation

The complete design — features, architecture, judging-criteria alignment, MVP scope, and roadmap — lives in [`docs/`](docs/):

- 📄 [English spec](docs/Bingocle_EN.md)
- 📄 [Bahasa Indonesia spec](docs/Bingocle_ID.md)

## Roadmap (hackathon MVP)

- [x] Core contracts (7) — `EventFactory · WordPool · WordMarket · OracleRegistry · BingoCardNFT · RewardVault · AgentIdentity` — compiling, unit-tested (Foundry)
- [x] ERC-8004 identity NFT for the oracle agent (soulbound, accruing reputation)
- [x] AI Word Curator + Odds Engine (Claude `claude-opus-4-8`)
- [x] AI Validation Oracle (LLM matching → on-chain commit; recorded-transcript demo path)
- [x] Bingocle Capability over Telegram + `/agent-guide` (per-user demo wallets)
- [ ] Deploy + verify on Mantle Sepolia Explorer (run `Deploy.s.sol`, paste addresses above)
- [ ] Publish the Capability to the Minds Bazaar; capture the build conversation
- [ ] Web app wiring to live contracts (frontend) + demo video

## License

[MIT](LICENSE)
