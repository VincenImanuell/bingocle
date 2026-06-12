# Hackathon Compute Credits — Plan

~$110k compute-credit pool for Phase II. **Apply via the "Computing Credits" form** on the official page ([devhub.mantle.xyz](https://devhub.mantle.xyz/) / [DoraHacks](https://dorahacks.io/hackathon/mantleturingtesthackathon2026)). All Phase II participants eligible.

## What Bingocle actually needs

| Need | Who covers it | Plan |
|---|---|---|
| **LLM API** (Curator · Odds · Validation Oracle) | **Anthropic** (own credits) *or* **AltLLM** (pool) | Primary cost. Use Anthropic Claude (`claude-opus-4-8`). If we land AltLLM/Tencent LLM credits instead, swap via a provider abstraction (~20 lines; agent is currently Anthropic-SDK-only). |
| **Hosting** (agent service + Telegram/email bot) | **Tencent Cloud** (pool) | Run `agent/` (HTTP API) + `capability/` (bot) on a Tencent VM. Free with credits. |
| **Speech-to-text** (Whisper, optional) | OpenAI (own) | ~$0.01/demo. Optional — recorded-transcript path is free. |
| On-chain analytics | **Nansen** (pool) | Optional. Could enrich the odds engine / leaderboard later. Not needed for MVP. |
| Social / sentiment data | **Elfa AI**, **Surf AI**, **Orbit AI** (pool) | Optional. Not used by the MVP. Apply anyway — free, may help marketing/Community Voting. |
| Chain / gas | Mantle Sepolia faucet | Free (testnet, not a credit). |

## Decision (what we WILL use)

1. **Tencent Cloud** → host agent + bot. **Apply.**
2. **LLM:** prefer **Anthropic** own credits (no code change). Fallback: **AltLLM** pool credit → I add the provider switch. **Apply to both.**
3. **Nansen** → apply (free upside for analytics later).
4. **Elfa / Surf / Orbit** → apply (free; possible Community-Voting boost), but not on the build path.
5. OpenAI Whisper → skip unless we want the live-audio demo (negligible cost anyway).

## Reality check
Out-of-pocket without any credits ≈ **<$10** (just the LLM calls; no mainnet, no paid hosting required for submission). Credits are upside/convenience, not a blocker.

## Action items
- [ ] Submit the Computing Credits form (Tencent + AltLLM + Nansen at minimum).
- [ ] Get an Anthropic key (or confirm a Claude credit balance) for `agent/.env`.
- [ ] If AltLLM/Tencent LLM granted → ask to add the provider abstraction in `agent/`.
