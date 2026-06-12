# Blockers — what needs you (I can't do these)

Everything here needs an account, credential, funded wallet, or a human action I can't perform. Ordered by submission impact. Code is done + tested; these are the gates to a live submission.

## 1. Deploy to Mantle Sepolia  ⛔ unblocks everything
- **Need:** a wallet private key with **testnet MNT** (faucet: https://faucet.sepolia.mantle.xyz), and a **Mantlescan API key** for `--verify` (https://mantlescan.xyz → API keys).
- **Do:**
  ```bash
  export MANTLE_API_KEY=...        # for verification
  PRIVATE_KEY=0x<deployer> AGENT_ADDRESS=0x<same-or-agent-wallet> \
    RPC_URL=https://rpc.sepolia.mantle.xyz scripts/deploy.sh --broadcast --verify
  ```
  This deploys, wires modules, registers the oracle, sets the curator, and writes addresses into `agent/.env` + `capability/.env`.
- **Then:** paste the 7 addresses into `README.md` (Deployed addresses table).

## 2. Run the AI agents once (validate prompts)  🟡 quality
- **Need:** `ANTHROPIC_API_KEY` (https://console.anthropic.com).
- **Do:** put it in `agent/.env`, `cd agent && npm run start`, then drive a real curate + validate (via the bot or curl) to confirm the Curator/Odds/Oracle prompts behave. They typecheck but have never run against real Claude.

## 3. Run the live Telegram bot  ⛔ Part B
- **Need:** `TELEGRAM_BOT_TOKEN` from @BotFather; a `DEMO_WALLET_MNEMONIC` (any fresh 12-word testnet phrase — `cast wallet new-mnemonic`).
- **Do:** fill `capability/.env`, `cd capability && npm run start`. Fund a couple demo wallets from the faucet to demo buy/claim.

## 4. (Optional) Whisper audio + email channel
- **Whisper:** `OPENAI_API_KEY` → `npm run oracle:audio <eventId> <audio.mp3>`. Without it, the recorded-transcript path (`npm run oracle`) works.
- **Email:** a dedicated mailbox's IMAP/SMTP creds (Gmail: enable IMAP + app password) → fill `IMAP_*`/`SMTP_*` in `capability/.env`, `npm run email`.

## 5. Publish the Capability to the Minds Bazaar  ⛔ Part B (50 pts)
- **Need:** a Minds builder account at **https://build.hellominds.ai** (docs are login-gated).
- **Do:** follow their "ship your first Skill" journey. Use `capability/capability.json` (name/public-id/commands) and `capability/AGENT-GUIDE.md` as the skill's guide. Make the published skill reach the same flows (it can call your running agent service / bot).
- **Note:** publishing here is how the **Animoca Consumer & Viral DApps track** is scored. Confirm the exact requirement on the DoraHacks detail page (it's JS-gated — open it in a browser).

## 6. Capture the build-conversation artifact  ⛔ scored ≤10 pts
- Fill `docs/BUILD-LOG.md` with the real builder↔Mind thread (Telegram/email export). Can't be reconstructed later — do it as you build/publish.

## 7. Demo video (≥2 min) with a *different* Mind
- Rehearse `AGENT-GUIDE.md` against a clean Mind, then record it equipping + playing end-to-end. This is the explicit Part B execution test.

## 8. Submit
- Public **Vercel URL** for the frontend (friend wires it to the deployed addresses first).
- **X thread** tagged `#MantleAIHackathon` (pitch + video + repo + a Mantle contract address).
- **BUIDL** on DoraHacks before **2026-06-15 15:59**.

## 9. Frontend ↔ chain (friend's job)
- Wire the Next.js app to the deployed contracts (read `cardCells` from chain — do not recompute the demo's mulberry32 layout). ABIs in `contracts/out/<Name>.sol/<Name>.json`.

---

### What's already done (no action needed)
Contracts (7, 13 tests, adversarial-reviewed, e2e-verified, on-chain tokenURI), agent service (Curator/Odds/Oracle + Whisper STT + API + 5 unit tests), Telegram + email Capability (shared command core), `/agent-guide`, deploy automation, build-log + pitch scaffolds.
