import { test } from "node:test";
import assert from "node:assert/strict";
import { aggregate, type Submission, type Decision } from "../src/ai/curator.js";
import { blend } from "../src/ai/odds.js";
import { filterMatches } from "../src/ai/oracle.js";
import { merkleRoot, wordHash } from "../src/chain.js";
import type { CuratedWord } from "../src/ai/curator.js";

test("aggregate: earliest submitter founds, later ones vote", () => {
  const subs: Submission[] = [
    { raw: "ai", wallet: "0xAlice", ts: 1 },
    { raw: "AI", wallet: "0xBob", ts: 2 },
    { raw: "airdrop", wallet: "0xBob", ts: 3 },
  ];
  const decisions: Decision[] = [
    { input: "ai", status: "accepted", canonical: "AI" },
    { input: "AI", status: "merged", canonical: "AI" },
    { input: "airdrop", status: "accepted", canonical: "Airdrop" },
  ];
  const pool = aggregate(subs, decisions, [], 24);
  const ai = pool.find((w) => w.word === "AI")!;
  assert.equal(ai.founder, "0xAlice"); // earliest
  assert.equal(ai.votes, 2); // alice + bob
  assert.equal(pool.find((w) => w.word === "Airdrop")!.votes, 1);
});

test("aggregate: rejected dropped; AI fillers reach poolSize", () => {
  const subs: Submission[] = [
    { raw: "ai", wallet: "0xA", ts: 1 },
    { raw: "the", wallet: "0xB", ts: 2 },
  ];
  const decisions: Decision[] = [
    { input: "ai", status: "accepted", canonical: "AI" },
    { input: "the", status: "rejected", reason: "stopword" },
  ];
  const suggested = ["Mantle", "Wallet", "Oracle"];
  const pool = aggregate(subs, decisions, suggested, 3);
  assert.equal(pool.length, 3); // AI + 2 fillers (stops at poolSize)
  assert.ok(!pool.some((w) => w.word === "The"));
  const fillers = pool.filter((w) => w.aiSuggested);
  assert.ok(fillers.every((w) => w.founder === "" && w.votes === 0));
});

test("blend: higher probability => higher price, lower multiplier; bounds hold", () => {
  const pool: CuratedWord[] = [
    { word: "AI", votes: 10, founder: "0xA", aiSuggested: false },
    { word: "Airdrop", votes: 1, founder: "0xB", aiSuggested: false },
  ];
  const probs = new Map([
    ["AI", 0.95],
    ["Airdrop", 0.15],
  ]);
  const [ai, airdrop] = blend(pool, probs);
  assert.ok(ai.price1e4 > airdrop.price1e4);
  assert.ok(ai.mult1e4 < airdrop.mult1e4);
  // on-chain invariants: 0 < price <= 1e4, mult >= 1e4
  for (const o of [ai, airdrop]) {
    assert.ok(o.price1e4 > 0 && o.price1e4 <= 10000);
    assert.ok(o.mult1e4 >= 10000);
  }
});

test("filterMatches: drops out-of-bounds, dupes, already-validated; clamps", () => {
  const pool = ["AI", "Mantle", "Wallet"];
  const raw = [
    { wordIndex: 0, confidence: 1.4, snippet: "x".repeat(500) }, // clamp conf + snippet
    { wordIndex: 0, confidence: 0.9, snippet: "dupe" }, // duplicate
    { wordIndex: 9, confidence: 0.9, snippet: "oob" }, // out of bounds
    { wordIndex: 2, confidence: 0.8, snippet: "wallet said" },
  ];
  const out = filterMatches(raw, pool, new Set([1])); // Mantle already validated
  assert.equal(out.length, 2); // AI(0) + Wallet(2)
  const ai = out.find((m) => m.wordIndex === 0)!;
  assert.equal(ai.confidence, 1); // clamped
  assert.ok(ai.snippet.length <= 240);
  assert.ok(!out.some((m) => m.wordIndex === 9));
});

test("merkleRoot: deterministic + order-sensitive; wordHash matches keccak", () => {
  const a = merkleRoot(["AI", "Mantle", "Wallet", "Oracle"]);
  const b = merkleRoot(["AI", "Mantle", "Wallet", "Oracle"]);
  const c = merkleRoot(["Mantle", "AI", "Wallet", "Oracle"]);
  assert.equal(a, b);
  assert.notEqual(a, c);
  assert.match(wordHash("AI"), /^0x[0-9a-f]{64}$/);
});
