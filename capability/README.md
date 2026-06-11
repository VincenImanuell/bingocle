# Bingocle Capability

The consumer surface — play the Bingocle AI bingo prediction market entirely over **Telegram** (and email). This is the Part B deliverable for the Consumer & Viral DApps track: a Minds-style Capability with a published command set and a self-documenting [`/agent-guide`](./AGENT-GUIDE.md).

## What it does

Wraps the full game loop in chat: create/join an event, submit & found words, buy positions, mint a bingo card, watch it mark live as the AI oracle validates, and claim — using a per-user **testnet demo wallet** (no seed phrase, Web2 onboarding).

## Run

```bash
cp .env.example .env   # fill TELEGRAM_BOT_TOKEN, AGENT_API_URL, DEMO_WALLET_MNEMONIC, addresses
npm install
npm run start          # or: npm run dev
```

Requires the [`agent/`](../agent) service running (AI + organizer-wallet actions) and the [`contracts/`](../contracts) deployed on Mantle Sepolia.

## Files

- `src/bot.ts` — Telegraf bot, the conversational game loop
- `src/wallets.ts` — per-user deterministic **testnet demo** wallets
- `src/chain.ts` — direct WordMarket / BingoCardNFT / RewardVault calls (buy/claim)
- `src/api.ts` — client for the agent service (curate / odds / oracle / card views)
- `src/guide.ts` — the in-chat `/agentguide` text
- `AGENT-GUIDE.md` — the full cross-Mind reproducibility guide (judges test this)
- `capability.json` — Bazaar manifest (name, public id, commands, channels)

> Testnet demo only. `DEMO_WALLET_MNEMONIC` derives throwaway wallets — never point it at a seed holding real value.
