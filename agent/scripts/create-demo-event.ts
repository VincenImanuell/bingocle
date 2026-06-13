/**
 * Create a REAL Bingocle event on Mantle Sepolia: createEvent -> fund reward pool
 * -> commit a word pool. This makes the live deployment non-empty (eventCount > 0)
 * and gives judges an on-chain event to inspect on Mantle Explorer — clearing the
 * "core loop runs end-to-end on Mantle" bar that local-anvil-only testing leaves open.
 *
 * Unlike e2e-local.ts, this does NOT time-warp (impossible on a public chain): phases
 * advance by real wall-clock, so buy / validate / claim are then driven from the bot or
 * web app as each phase opens. Use short windows for a fast live demo.
 *
 * Prereq: agent/.env with a FUNDED AGENT_PRIVATE_KEY on Mantle Sepolia + deployed
 *         addresses. Run:  npm run demo:event
 *
 * Env (all optional; minutes):
 *   SUBMISSION_MINS FOUNDER_MINS MARKET_MINS LIVE_MINS DISPUTE_MINS  REWARD_MNT  THEME
 */
import { ethers } from "ethers";
import { createEvent, phaseOf } from "../src/services/event.js";
import { contracts, provider, signer, wordHash, merkleRoot } from "../src/chain.js";

const num = (k: string, d: number) => Number(process.env[k] ?? d);

const THEME = process.env.THEME ?? "Mantle Demo Day · Web3 · AI";
const WORDS = [
  "airdrop", "mainnet", "liquidity", "oracle", "agent", "wallet",
  "rollup", "modular", "restaking", "TVL", "gasless", "bridge",
  "zk", "settlement", "validator", "token", "yield", "onchain",
  "consumer", "viral", "bingo", "Mantle", "Animoca", "Turing",
];

async function main() {
  const me = signer().address;
  const bal = await provider().getBalance(me);
  console.log(`agent wallet: ${me}  (balance ${ethers.formatEther(bal)} MNT)`);
  if (bal === 0n) throw new Error("Agent wallet has 0 MNT — fund it from https://faucet.sepolia.mantle.xyz/ first.");

  // 1. Create the event on-chain.
  const { eventId, txHash } = await createEvent({
    submissionMins: num("SUBMISSION_MINS", 5),
    founderMins: num("FOUNDER_MINS", 2),
    marketMins: num("MARKET_MINS", 10),
    liveMins: num("LIVE_MINS", 15),
    disputeMins: num("DISPUTE_MINS", 5),
  });
  console.log(`✅ event #${eventId} created (tx ${txHash}) — phase ${await phaseOf(eventId)}`);

  // 2. Fund the sponsor/reward pool so bingo bonuses + founder seeds are payable.
  const reward = ethers.parseEther(String(num("REWARD_MNT", 5)));
  await (await contracts.rewardVault().fund(eventId, reward, { value: reward })).wait();
  console.log(`✅ funded reward pool with ${ethers.formatEther(reward)} MNT`);

  // 3. Commit a word pool (deterministic — no AI needed for the on-chain record).
  const hashes = WORDS.map(wordHash);
  const prices = WORDS.map(() => 5000); // 0.50 opening (1e4 fixed point)
  const mults = WORDS.map(() => 20000); // 2.00x
  const founders = WORDS.map(() => ethers.ZeroAddress);
  await (
    await contracts
      .wordPool()
      .commitPool(eventId, hashes, prices, mults, founders, merkleRoot(WORDS))
  ).wait();
  console.log(`✅ committed pool of ${WORDS.length} words for theme "${THEME}"`);

  console.log("\nInspect on-chain:");
  console.log(`  https://explorer.sepolia.mantle.xyz/tx/${txHash}`);
  console.log(`  EventFactory: https://explorer.sepolia.mantle.xyz/address/${await contracts.eventFactory().getAddress()}`);
  console.log("\nNext (as phases open by real time): players /buy + /card, organizer /validate, then /claim.");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("❌ create-demo-event failed:", e);
    process.exit(1);
  });
