/** Concise operator guide surfaced via /agentguide inside the chat. */
export const AGENT_GUIDE = `BINGOCLE CAPABILITY — OPERATOR GUIDE

What it is: a chat game where you predict words a speaker will say live. An AI oracle listens, calls the bingo, and settles on Mantle. You play with an embedded testnet wallet — no seed phrase.

PLAY LOOP
1. /wallet — see your demo wallet + MNT balance (fund it from a Mantle Sepolia faucet).
2. /create <theme> — (organizer) start an event. Note the event id.
3. /submit <id> word1, word2, word3 — predict up to 3 words. First to submit a word = its Founder (free seed).
4. /finalize <id> <theme> — (organizer) AI curates the pool + sets odds on-chain.
5. /card <id> — mint your 5x5 bingo card.
6. /buy <id> <word> <amount> — back a word with MNT at the running odds.
7. /validate <id> [text] — (organizer) the AI oracle matches a transcript and commits verdicts on-chain.
8. /card <id> — watch cells mark as words are validated.
9. /claim <id> — collect prediction payouts (stake x multiplier) + bingo bonuses + founder seeds.

WIN RAILS
- Prediction: every word you backed that is validated pays stake x multiplier.
- Bingo bonus: line / diagonal / double-line / full-card bonuses, tiered + stackable.
- Founder seed: a free position on each word you founded.

NOTES
- All deadlines (submission / founder / market / live / dispute) are enforced by on-chain timestamps.
- Every AI verdict (word, confidence, transcript proof) is written to Mantle and publicly auditable.`;
