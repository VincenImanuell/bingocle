import { ethers } from "ethers";
import { contracts, wordHash, merkleRoot } from "../chain.js";
import { curate, type Submission } from "../ai/curator.js";
import { computeOdds } from "../ai/odds.js";
import { putEvent, type EventRecord } from "../store.js";

/**
 * Full curate -> odds -> on-chain commit pipeline for one event.
 * Runs the AI Word Curator and Odds Engine, then writes the frozen pool
 * (word hashes + prices + multipliers + founders + merkle root) to WordPool.
 */
export async function curateAndCommit(args: {
  eventId: number;
  theme: string;
  description: string;
  submissions: Submission[];
}): Promise<EventRecord> {
  const { pool } = await curate({
    theme: args.theme,
    description: args.description,
    submissions: args.submissions,
  });
  if (pool.length < 24) {
    throw new Error(`Curated pool too small (${pool.length}); need >= 24 words.`);
  }
  const odds = await computeOdds({
    theme: args.theme,
    description: args.description,
    pool,
  });

  const words = pool.map((w) => w.word);
  const founders = pool.map((w) =>
    w.founder && ethers.isAddress(w.founder) ? w.founder : ethers.ZeroAddress,
  );
  const hashes = words.map(wordHash);
  const prices = odds.map((o) => o.price1e4);
  const mults = odds.map((o) => o.mult1e4);
  const root = merkleRoot(words);

  const tx = await contracts.wordPool().commitPool(
    args.eventId,
    hashes,
    prices,
    mults,
    founders,
    root,
  );
  const receipt = await tx.wait();

  const rec: EventRecord = {
    eventId: args.eventId,
    theme: args.theme,
    description: args.description,
    words,
    founders,
    odds,
    merkleRoot: root,
    committedTx: receipt?.hash ?? tx.hash,
  };
  putEvent(rec);
  return rec;
}
