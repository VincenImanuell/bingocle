/**
 * Local anvil end-to-end: drives the real agent ethers wiring (createEvent struct
 * encoding, EventCreated log parsing, buy/mint/validate/claim) against deployed
 * bytecode. Skips Claude (commits a hand-built pool directly). No testnet/API key.
 *
 * Prereq: anvil running + Deploy.s.sol broadcast to it + agent/.env pointed at anvil.
 * Run:    npx tsx scripts/e2e-local.ts
 */
import { ethers } from "ethers";
import { createEvent, phaseOf } from "../src/services/event.js";
import { contracts, provider, signer, wordHash, merkleRoot } from "../src/chain.js";

/** Mine a block at an exact timestamp (deterministic phase control on anvil). */
async function setTime(ts: bigint) {
  await provider().send("evm_setNextBlockTimestamp", [Number(ts)]);
  await provider().send("evm_mine", []);
}

async function main() {
  const me = signer().address;
  console.log("actor:", me);

  // 1. createEvent (exercises the BonusTiers tuple encoding + log parsing)
  const { eventId } = await createEvent({
    submissionMins: 1,
    founderMins: 1,
    marketMins: 1,
    liveMins: 1,
    disputeMins: 1,
  });
  console.log(`event #${eventId} — phase ${await phaseOf(eventId)}`);

  // fund the reward/sponsor pool
  await (await contracts.rewardVault().fund(eventId, ethers.parseEther("60"), {
    value: ethers.parseEther("60"),
  })).wait();
  console.log("funded reward pool 60");

  // 2. commit a hand-built pool (skip Claude) — actor founds word 0
  const words = Array.from({ length: 24 }, (_, i) => `Word${i}`);
  const hashes = words.map(wordHash);
  const prices = words.map(() => 5000);
  const mults = words.map(() => 20000);
  const founders = words.map(() => ethers.ZeroAddress);
  founders[0] = me;
  await (
    await contracts.wordPool().commitPool(eventId, hashes, prices, mults, founders, merkleRoot(words))
  ).wait();
  console.log("pool committed (24 words)");

  // read the on-chain schedule so we can land exactly inside each phase
  const cfg = await contracts.eventFactory().getConfig(eventId);

  // 3. founder window: claim free seed + buy founded word at the opening curve price
  await setTime(cfg.submissionEnd + 1n); // -> Founder
  console.log("phase", await phaseOf(eventId));
  const market = contracts.wordMarket();
  await (await market.claimFounderSeed(eventId, 0)).wait();
  const buyShares = ethers.parseEther("10");
  const cost: bigint = await market.quoteBuy(eventId, 0, buyShares);
  await (await market.buy(eventId, 0, buyShares, cost, { value: cost })).wait();
  console.log(`founder seed + bought 10 Word0 shares for ${ethers.formatEther(cost)} MNT`);

  // demo a trade: sell half back, then re-buy (price moves)
  const sellRefund: bigint = await market.quoteSell(eventId, 0, ethers.parseEther("5"));
  await (await market.sell(eventId, 0, ethers.parseEther("5"), 0n)).wait();
  console.log(`sold 5 Word0 shares back for ${ethers.formatEther(sellRefund)} MNT`);

  // 4. market: mint card
  await setTime(cfg.founderEnd + 1n); // -> Market
  console.log("phase", await phaseOf(eventId));
  await (await contracts.bingoCardNFT().mint(eventId)).wait();
  const tokenId = await contracts.bingoCardNFT().cardOf(eventId, me);
  console.log("card minted, tokenId", Number(tokenId));

  // 5. live: oracle validates word 0
  await setTime(cfg.marketLock + 1n); // -> Live
  console.log("phase", await phaseOf(eventId));
  await (await contracts.oracleRegistry().commitValidation(eventId, 0, 9700, "the AI flagged it")).wait();
  const bitmap = await contracts.oracleRegistry().validatedBitmap(eventId);
  console.log("validated bitmap", bitmap.toString(2));

  // 6. settled: settle + redeem trading payout + pool rewards
  await setTime(cfg.disputeEnd + 1n); // -> Settled
  console.log("phase", await phaseOf(eventId));
  await (await market.settle(eventId)).wait();
  const before = await provider().getBalance(me);
  await (await market.redeem(eventId)).wait();
  await (await contracts.rewardVault().claim(eventId)).wait();
  const after = await provider().getBalance(me);
  console.log("redeemed; net balance delta (incl gas):", ethers.formatEther(after - before));

  const marked = await contracts.bingoCardNFT().markedMask(tokenId);
  console.log("card markedMask", Number(marked).toString(2));
  console.log("\n✅ e2e passed: createEvent -> commitPool -> buy -> mint -> validate -> settle -> claim");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("❌ e2e failed:", e);
    process.exit(1);
  });
