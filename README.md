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
│   └── project.md       # Master / brainstorm doc
├── contracts/           # (planned) Solidity contracts + Foundry/Hardhat
├── agent/               # (planned) AI oracle + curator + odds service
├── web/                 # (planned) Next.js web app
├── capability/          # (planned) Minds Bazaar Capability + /agent-guide
├── LICENSE
└── README.md
```

## Documentation

The complete design — features, architecture, judging-criteria alignment, MVP scope, and roadmap — lives in [`docs/`](docs/):

- 📄 [English spec](docs/Bingocle_EN.md)
- 📄 [Bahasa Indonesia spec](docs/Bingocle_ID.md)

## Roadmap (hackathon MVP)

- [ ] Bingocle Capability published to the Minds Bazaar (Telegram + email, `/agent-guide`)
- [ ] Core contracts on Mantle Sepolia (verified on Explorer)
- [ ] AI Word Curator + Odds Engine (Claude API)
- [ ] AI Validation Oracle (Whisper STT + LLM → on-chain commit)
- [ ] Web app: join → submit → buy → live marking → claim
- [ ] ERC-8004 identity NFT for the oracle agent
- [ ] Demo video + deployed addresses + public frontend

## License

[MIT](LICENSE)
