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

**Stack:** Solidity (Foundry) · Next.js + wagmi/viem · Node.js agent service · Whisper (STT, optional) · Google Gemini `gemini-2.0-flash` (Curator / Odds / Oracle reasoning) · Minds Capability (`SKILL.md` + `/agent-guide`, Telegram + email) · Mantle Sepolia → Mainnet.

## Repository structure

```
.
├── docs/
│   ├── Bingocle_EN.md   # Full project spec (English)
│   ├── Bingocle_ID.md   # Full project spec (Bahasa Indonesia)
│   └── project.md       # Master / brainstorm doc
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
cp .env.example .env   # GEMINI_API_KEY, AGENT_PRIVATE_KEY, deployed addresses
npm install && npm run start

# 3. Capability — the Telegram chat surface
cd ../capability
cp .env.example .env   # TELEGRAM_BOT_TOKEN, AGENT_API_URL, DEMO_WALLET_MNEMONIC, addresses
npm install && npm run start

# 4. Frontend — landing + the on-chain live market
cd ../frontend
# deploy.sh already wrote frontend/.env.local with NEXT_PUBLIC_* addresses
npm install && npm run dev   # landing at /, demo at /play, real on-chain app at /app
```

### Hosting the side services (for a public submission)

The contracts are on Mantle Sepolia and the web app deploys to Vercel. The two
Node services ship with Docker + a Render Blueprint:

```bash
# Agent service — build context is the repo root (it reads ABIs from contracts/out):
docker build -f agent/Dockerfile -t bingocle-agent .

# Capability (Telegram bot) — self-contained (ABIs embedded):
docker build -t bingocle-capability ./capability
```

Or push to GitHub and deploy `render.yaml` as a Render Blueprint (agent = web with a
public URL, capability = always-on worker). Set the agent's public URL as
`NEXT_PUBLIC_AGENT_API` (Vercel) and `AGENT_API_URL` (capability). Verify the
contracts with `MANTLE_API_KEY=… scripts/verify.sh`.

The AI agent wallet (`AGENT_ADDRESS`) is registered as the ERC-8004 oracle and the WordPool curator by the deploy script. Read [`capability/AGENT-GUIDE.md`](capability/AGENT-GUIDE.md) to operate the game from chat.

## Deployed addresses (Mantle Sepolia)

Network: Mantle Sepolia (chainId 5003) · Deployer/Oracle: `0x785cF4596b932B4319Eb31b9C353fE7Ae7695D2D`

| Contract | Address |
|---|---|
| EventFactory | `0x4ded43273E1b3be15bBBF1A5cE9494f77B045Afb` |
| WordPool | `0x1F0BebC4D0f7C4B8428Ac2FE14BBeb2178e63C29` |
| WordMarket | `0x2a853222d57d28a713F45b8F78503376ccF5471b` |
| OracleRegistry | `0xe998c6F467876b2dA1C5D126EA5576A6943c2073` |
| BingoCardNFT | `0x1A7643b31EfD272F65fe7D8653fE35172284A1F3` |
| RewardVault | `0x0B0766bF126180730E408105C35A761D7AADe968` |
| AgentIdentity (ERC-8004) | `0x6EC7E9AE2dD88fAe0F1851487Fbd15F0b89382A0` |

## Documentation

The complete design — features, architecture, judging-criteria alignment, MVP scope, and roadmap — lives in [`docs/`](docs/):

- 📄 [English spec](docs/Bingocle_EN.md)
- 📄 [Bahasa Indonesia spec](docs/Bingocle_ID.md)

## Roadmap (hackathon MVP)

- [x] Core contracts (7) — `EventFactory · WordPool · WordMarket · OracleRegistry · BingoCardNFT · RewardVault · AgentIdentity` — compiling, unit-tested (Foundry)
- [x] ERC-8004 identity NFT for the oracle agent (soulbound, accruing reputation)
- [x] AI Word Curator + Odds Engine (Gemini `gemini-2.0-flash`)
- [x] AI Validation Oracle (LLM matching → on-chain commit; recorded-transcript demo path)
- [x] Bingocle Capability over Telegram + `/agent-guide` (per-user demo wallets)
- [ ] Deploy + verify on Mantle Sepolia Explorer (run `Deploy.s.sol`, paste addresses above)
- [ ] Publish the Capability to the Minds Bazaar; capture the build conversation
- [ ] Web app wiring to live contracts (frontend) + demo video

## License

[MIT](LICENSE)
