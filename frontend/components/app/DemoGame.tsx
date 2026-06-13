"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAccount } from "wagmi";
import ConnectWalletButton from "../ConnectWalletButton";
import {
  BONUS_KEYS,
  FREE,
  bonusesFor,
  curateWord,
  makeCard,
  predictionRewards,
  type Bonus,
  type CurationResult,
  type WordInfo,
} from "./engine";
import {
  AI_CURATION_LOG,
  BASE_POOL,
  DEMO_EVENT,
  ORACLE_SCRIPT,
  RIVALS,
  SPEECH_TEXT,
  STARTING_BALANCE,
  SWAP_ORDER,
  USER_WORD_INFO,
  type OracleEvent,
} from "./data";

type Phase = "event" | "words" | "curate" | "market" | "live" | "settled";

type FeedEntry = {
  id: number;
  word: string | null;
  heard?: string;
  snippet: string;
  conf: number;
};

type IpoBid = {
  id: number;
  word: string;
  bidPrice: number; // max price willing to pay
  amount: number;   // USDC locked
};

type IpoResult = IpoBid & {
  openingPrice: number;
  inCard: boolean;
  priceOk: boolean;
  allocated: boolean;
};

const PHASE_STEPS: { key: Phase; label: string }[] = [
  { key: "event", label: "Event" },
  { key: "words", label: "Submit" },
  { key: "curate", label: "Curate" },
  { key: "market", label: "Trade" },
  { key: "live", label: "Live" },
  { key: "settled", label: "Claim" },
];

const CREATE_STEPS = [
  "Deploying event contract on Mantle Sepolia…",
  "Prize pool locked: 1,000 USDC ✓",
  "AI Oracle configured (Whisper STT + Claude) ✓",
  "Speaker dossier loaded for Demo Day ✓",
  "Word pool seeded with 24 curated terms ✓",
  `Event #42 — "${DEMO_EVENT.name}" — is live ✓`,
];

const fmt = (n: number) => Number(n.toFixed(2)).toString();

export default function DemoGame() {
  const { address } = useAccount();

  // ── core state ──
  const [phase, setPhase] = useState<Phase>("event");
  const [pool, setPool] = useState<WordInfo[]>(BASE_POOL);
  const [curations, setCurations] = useState<CurationResult[]>([]);
  const [wordInput, setWordInput] = useState("");
  const [card, setCard] = useState<string[] | null>(null);
  const [positions, setPositions] = useState<Record<string, number>>({});
  const [balance, setBalance] = useState(STARTING_BALANCE);
  const [spent, setSpent] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [validated, setValidated] = useState<Set<string>>(new Set());
  const [feed, setFeed] = useState<FeedEntry[]>([]);
  const [bonuses, setBonuses] = useState<Bonus[]>([]);
  const [bonusKeys, setBonusKeys] = useState<Set<string>>(new Set());
  const [eventIdx, setEventIdx] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [elapsed, setElapsed] = useState(0);
  const [banner, setBanner] = useState<string | null>(null);
  const [claimed, setClaimed] = useState(false);

  // ── event creation ──
  const [createStep, setCreateStep] = useState(0);

  // ── IPO pre-orders (placed during words phase) ──
  const [ipoBids, setIpoBids] = useState<IpoBid[]>([]);
  const [bidWord, setBidWord] = useState("");
  const [bidPrice, setBidPrice] = useState("0.50");
  const [bidAmount, setBidAmount] = useState("5");
  const [ipoResults, setIpoResults] = useState<IpoResult[]>([]);
  const [ipoSettleStep, setIpoSettleStep] = useState(0);

  // ── curation ──
  const [curatStep, setCuratStep] = useState(0);

  // ── market prices + fluctuation ──
  const [prices, setPrices] = useState<Record<string, number>>(
    () => Object.fromEntries(BASE_POOL.map((w) => [w.word, w.price]))
  );
  const [priceFlash, setPriceFlash] = useState<string | null>(null);

  // ── live transcript ──
  const [transcriptChars, setTranscriptChars] = useState(0);

  // ── derived ──
  const founderWords = useMemo(
    () => pool.filter((w) => w.isUserWord).map((w) => w.word),
    [pool]
  );
  const founderSeeds = useMemo(() => new Set(founderWords), [founderWords]);
  const submissions = curations.filter((c) => c.status !== "rejected").length;
  const ipoLocked = ipoBids.reduce((s, b) => s + b.amount, 0);

  const script = useMemo<OracleEvent[]>(() => {
    return ORACLE_SCRIPT.flatMap((e) => {
      if (e.word !== "__USER__") return [e];
      if (!founderWords[0]) return [];
      return [
        {
          ...e,
          word: founderWords[0],
          snippet: e.snippet.replace("{WORD}", founderWords[0].toLowerCase()),
        },
      ];
    });
  }, [founderWords]);

  const curatLog = useMemo(() => {
    return pool.map((w) => {
      if (w.isUserWord) {
        return {
          word: w.word,
          reason: "Community submission — Word Founder position secured ✦",
          prob: Math.round(w.aiProb * 100),
          isUser: true,
        };
      }
      const entry = AI_CURATION_LOG.find((e) => e.word === w.word);
      return {
        word: w.word,
        reason: entry?.reason ?? "Included based on context relevance",
        prob: entry?.prob ?? Math.round(w.aiProb * 100),
        isUser: false,
      };
    });
  }, [pool]);

  const who = address ? `${address.slice(0, 6)}…${address.slice(-4)}` : "Guest";
  const phaseIdx = PHASE_STEPS.findIndex((p) => p.key === phase);
  const selectedInfo = selected ? pool.find((w) => w.word === selected) ?? null : null;

  // ── Effects ──

  useEffect(() => {
    if (phase !== "event" || createStep >= CREATE_STEPS.length) return;
    const t = setTimeout(() => setCreateStep((s) => s + 1), 680);
    return () => clearTimeout(t);
  }, [phase, createStep]);

  useEffect(() => {
    if (phase !== "curate" || curatStep >= curatLog.length + 1) return;
    const delay = curatStep < curatLog.length ? 340 : 700;
    const t = setTimeout(() => setCuratStep((s) => s + 1), delay);
    return () => clearTimeout(t);
  }, [phase, curatStep, curatLog.length]);

  /* build card once curation finishes */
  useEffect(() => {
    if (phase !== "curate" || curatStep !== curatLog.length + 1 || card) return;
    setCard(makeCard(pool.map((w) => w.word), Date.now() & 0xffffffff));
  }, [phase, curatStep, curatLog.length, card, pool]);

  /* compute IPO settlement once card is ready */
  useEffect(() => {
    if (phase !== "curate" || !card || ipoResults.length > 0) return;
    if (ipoBids.length === 0) return;

    const results: IpoResult[] = ipoBids.map((bid) => {
      const wordInfo = pool.find((w) => w.word === bid.word);
      const openingPrice = wordInfo?.price ?? 0.5;
      const inCard = card.includes(bid.word);
      const priceOk = bid.bidPrice >= openingPrice;
      const allocated = inCard && priceOk;
      return { ...bid, openingPrice, inCard, priceOk, allocated };
    });
    setIpoResults(results);
    setIpoSettleStep(0);
  }, [phase, card, ipoBids, pool, ipoResults.length]);

  /* animate IPO settlement step by step */
  useEffect(() => {
    if (ipoResults.length === 0 || ipoSettleStep >= ipoResults.length) return;
    const t = setTimeout(() => {
      const result = ipoResults[ipoSettleStep];
      if (result.allocated) {
        setPositions((p) => ({ ...p, [result.word]: (p[result.word] ?? 0) + result.amount }));
        setSpent((s) => Math.round((s + result.amount) * 100) / 100);
      } else {
        setBalance((b) => Math.round((b + result.amount) * 100) / 100);
      }
      setIpoSettleStep((s) => s + 1);
    }, 900);
    return () => clearTimeout(t);
  }, [ipoResults, ipoSettleStep]);

  useEffect(() => {
    if (phase !== "market") return;
    const t = setInterval(() => {
      setPrices((prev) => {
        const next = { ...prev };
        const keys = Object.keys(next);
        const count = 2 + Math.floor(Math.random() * 3);
        const moved: string[] = [];
        for (let i = 0; i < count; i++) {
          const k = keys[Math.floor(Math.random() * keys.length)];
          const delta = Math.random() * 0.16 - 0.08;
          next[k] = Math.max(0.1, +(next[k] * (1 + delta)).toFixed(3));
          moved.push(`${k} ${delta > 0 ? "▲" : "▼"}`);
        }
        setPriceFlash(moved.join("  "));
        return next;
      });
    }, 3200);
    return () => clearInterval(t);
  }, [phase]);

  useEffect(() => {
    if (!priceFlash) return;
    const t = setTimeout(() => setPriceFlash(null), 1800);
    return () => clearTimeout(t);
  }, [priceFlash]);

  useEffect(() => {
    if (phase !== "live" || transcriptChars >= SPEECH_TEXT.length) return;
    const charsPerTick = Math.ceil(speed * 3);
    const t = setTimeout(
      () => setTranscriptChars((c) => Math.min(c + charsPerTick, SPEECH_TEXT.length)),
      55 / speed
    );
    return () => clearTimeout(t);
  }, [phase, transcriptChars, speed]);

  useEffect(() => {
    if (phase !== "live") return;
    if (eventIdx >= script.length) {
      const t = setTimeout(() => setPhase("settled"), 3000 / speed);
      return () => clearTimeout(t);
    }
    const e = script[eventIdx];
    const t = setTimeout(() => {
      setFeed((f) => [
        { id: eventIdx, word: e.word as string | null, heard: e.heard, snippet: e.snippet, conf: e.conf },
        ...f,
      ]);
      if (e.word) {
        const next = new Set(validated);
        next.add(e.word as string);
        setValidated(next);
        if (card) {
          const fresh = bonusesFor(card, next, bonusKeys);
          if (fresh.length > 0) {
            setBonuses((b) => [...b, ...fresh]);
            const nk = new Set(bonusKeys);
            fresh.forEach((bn) => nk.add(BONUS_KEYS[bn.label]));
            setBonusKeys(nk);
            setBanner(fresh.map((bn) => `${bn.label} +${bn.amount} USDC`).join("  ·  "));
          }
        }
      }
      setEventIdx((i) => i + 1);
    }, (e.gap * 1000) / speed);
    return () => clearTimeout(t);
  }, [phase, eventIdx, speed, script, card, bonusKeys, validated]);

  useEffect(() => {
    if (phase !== "live") return;
    const t = setInterval(() => setElapsed((s) => s + speed), 1000);
    return () => clearInterval(t);
  }, [phase, speed]);

  useEffect(() => {
    if (!banner) return;
    const t = setTimeout(() => setBanner(null), 3200);
    return () => clearTimeout(t);
  }, [banner]);

  // ── Actions ──

  function submitWord() {
    if (!wordInput.trim() || submissions >= 3) return;
    const result = curateWord(wordInput, pool);
    setCurations((c) => [...c, result]);
    if (result.status === "accepted") {
      setPool((p) => {
        const removed = SWAP_ORDER[p.filter((w) => w.isUserWord).length];
        return [
          ...p.filter((w) => w.word !== removed),
          { word: result.word, ...USER_WORD_INFO, isUserWord: true },
        ];
      });
      const removed = SWAP_ORDER[pool.filter((w) => w.isUserWord).length];
      const affected = ipoBids.filter((b) => b.word === removed);
      if (affected.length > 0) {
        const refundTotal = affected.reduce((s, b) => s + b.amount, 0);
        setIpoBids((prev) => prev.filter((b) => b.word !== removed));
        setBalance((bl) => Math.round((bl + refundTotal) * 100) / 100);
      }
    }
    setWordInput("");
  }

  function placeIpoBid() {
    const word = bidWord.trim();
    const price = parseFloat(bidPrice);
    const amount = parseFloat(bidAmount);
    if (!word || isNaN(price) || price <= 0 || isNaN(amount) || amount <= 0) return;
    if (amount > balance - ipoLocked) return;
    if (!pool.find((w) => w.word.toLowerCase() === word.toLowerCase())) return;
    const canonical = pool.find((w) => w.word.toLowerCase() === word.toLowerCase())!.word;
    setIpoBids((prev) => [
      ...prev,
      { id: Date.now(), word: canonical, bidPrice: price, amount },
    ]);
    setBalance((b) => Math.round((b - amount) * 100) / 100);
  }

  function cancelIpoBid(id: number) {
    const bid = ipoBids.find((b) => b.id === id);
    if (!bid) return;
    setIpoBids((prev) => prev.filter((b) => b.id !== id));
    setBalance((b) => Math.round((b + bid.amount) * 100) / 100);
  }

  function buy(word: string, amount: number) {
    if (phase !== "market") return;
    const amt = Math.min(amount, balance);
    if (amt <= 0) return;
    setPositions((p) => ({ ...p, [word]: (p[word] ?? 0) + amt }));
    setBalance((b) => Math.round((b - amt) * 100) / 100);
    setSpent((s) => Math.round((s + amt) * 100) / 100);
    setPrices((prev) => ({ ...prev, [word]: Math.min(3.0, +(prev[word] * 1.038).toFixed(3)) }));
  }

  function sell(word: string, amount: number) {
    if (phase !== "market") return;
    const pos = positions[word] ?? 0;
    const sellAmt = Math.min(amount, pos);
    if (sellAmt <= 0) return;
    const refund = Math.round(sellAmt * 0.88 * 100) / 100;
    setPositions((p) => ({ ...p, [word]: Math.max(0, pos - sellAmt) }));
    setBalance((b) => Math.round((b + refund) * 100) / 100);
    setSpent((s) => Math.round(Math.max(0, s - sellAmt) * 100) / 100);
    setPrices((prev) => ({ ...prev, [word]: Math.max(0.1, +(prev[word] * 0.964).toFixed(3)) }));
  }

  const rewardRows = useMemo(
    () => (card ? predictionRewards(pool, positions, founderSeeds, validated) : []),
    [card, pool, positions, founderSeeds, validated]
  );
  const rewardTotal =
    rewardRows.reduce((s, r) => s + r.payout, 0) +
    bonuses.reduce((s, b) => s + b.amount, 0);
  const profit = Math.round((rewardTotal - spent) * 100) / 100;

  function claim() {
    if (claimed) return;
    setBalance((b) => Math.round((b + rewardTotal) * 100) / 100);
    setClaimed(true);
  }

  function reset() {
    setPhase("event");
    setPool(BASE_POOL);
    setCurations([]);
    setWordInput("");
    setCard(null);
    setPositions({});
    setBalance(STARTING_BALANCE);
    setSpent(0);
    setSelected(null);
    setValidated(new Set());
    setFeed([]);
    setBonuses([]);
    setBonusKeys(new Set());
    setEventIdx(0);
    setSpeed(1);
    setElapsed(0);
    setClaimed(false);
    setCreateStep(0);
    setIpoBids([]);
    setBidWord("");
    setBidPrice("0.50");
    setBidAmount("5");
    setIpoResults([]);
    setIpoSettleStep(0);
    setCuratStep(0);
    setPrices(Object.fromEntries(BASE_POOL.map((w) => [w.word, w.price])));
    setPriceFlash(null);
    setTranscriptChars(0);
    setBanner(null);
  }

  // ── Render ──
  return (
    <div className="app-bg">
      <header className="topbar">
        <div className="mx-auto flex h-11 max-w-6xl items-center justify-between gap-4 px-4">
          <Link href="/" className="wordmark text-lg" aria-label="Back to home">
            Bingocle
          </Link>
          <nav aria-label="Game phase" className="hidden items-center gap-1.5 lg:flex">
            {PHASE_STEPS.map((p, i) => (
              <span
                key={p.key}
                className={`phase-step ${i === phaseIdx ? "active" : ""} ${i < phaseIdx ? "done" : ""}`}
              >
                <span className="p-rune">{i < phaseIdx ? "✓" : i + 1}</span>
                {p.label}
              </span>
            ))}
          </nav>
          <ConnectWalletButton />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-24 pt-8 sm:px-6">
        <p className="kicker mb-6 text-center">
          Interactive demo · simulated oracle · mirrors exact on-chain flow · no real funds required
        </p>

        {/* ═══ EVENT CREATION ═══ */}
        {phase === "event" && (
          <div className="mx-auto max-w-xl">
            <div className="ornate-frame p-6 sm:p-8">
              <p className="kicker text-center mb-2">AI is preparing the event</p>
              <h1 className="h-display text-center text-3xl sm:text-4xl mb-7">
                Creating <span className="gold">Live Event</span>
              </h1>
              <ul className="space-y-3 mb-6 min-h-[200px]">
                {CREATE_STEPS.map((step, i) => (
                  <li
                    key={i}
                    className={`flex items-center gap-3 transition-all duration-500 ${
                      i < createStep ? "opacity-100" : "opacity-0 translate-y-2"
                    }`}
                  >
                    <span
                      className={`shrink-0 h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold border ${
                        i < createStep && step.includes("✓")
                          ? "bg-teal-950 text-teal-300 border-teal-700"
                          : i < createStep
                            ? "bg-amber-950 text-amber-300 border-amber-700"
                            : "bg-zinc-900 border-zinc-700 text-zinc-600"
                      }`}
                    >
                      {i < createStep ? (step.includes("✓") ? "✓" : "⟳") : "·"}
                    </span>
                    <span className="text-sm text-cream/80">{step}</span>
                  </li>
                ))}
                {createStep < CREATE_STEPS.length && (
                  <li className="flex items-center gap-2 text-xs text-cream/30">
                    <span className="animate-pulse">●</span> Processing…
                  </li>
                )}
              </ul>
              {createStep >= CREATE_STEPS.length && (
                <>
                  <dl className="space-y-2 border-t border-gold/15 pt-5">
                    {(
                      [
                        ["Event", DEMO_EVENT.name],
                        ["Theme", DEMO_EVENT.theme],
                        ["Reward pool", DEMO_EVENT.pool],
                        ["AI Oracle", DEMO_EVENT.oracle],
                        ["Network", DEMO_EVENT.chain],
                      ] as const
                    ).map(([k, v]) => (
                      <div key={k} className="stat-row">
                        <dt>{k}</dt>
                        <dd>{v}</dd>
                      </div>
                    ))}
                  </dl>
                  <p className="body-copy mt-5 text-center text-base italic">
                    Playing as <span className="text-gold-bright">{who}</span> ·{" "}
                    {STARTING_BALANCE} demo USDC
                  </p>
                  <div className="mt-6 text-center">
                    <button type="button" className="btn btn-gold" onClick={() => setPhase("words")}>
                      Join Event →
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ═══ WORD SUBMISSION + IPO PRE-ORDER ═══ */}
        {phase === "words" && (
          <div className="mx-auto max-w-xl space-y-5">
            {/* Word submission */}
            <div className="ornate-frame p-6 sm:p-8">
              <h1 className="h-display text-center text-3xl sm:text-4xl">
                Submit your <span className="gold">words</span>
              </h1>
              <p className="body-copy mt-4 text-center text-base">
                Predict up to 3 words the speaker will say. A brand-new word makes
                you its <strong className="text-gold-bright">Word Founder</strong> — free
                position at base price.
              </p>
              <div className="mt-6 flex gap-3">
                <input
                  className="input-dark flex-1"
                  placeholder={submissions >= 3 ? "3 / 3 submitted" : "e.g. Liquidity"}
                  value={wordInput}
                  maxLength={24}
                  disabled={submissions >= 3}
                  onChange={(e) => setWordInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submitWord()}
                  aria-label="Word to submit"
                />
                <button
                  type="button"
                  className="btn btn-gold px-6"
                  onClick={submitWord}
                  disabled={submissions >= 3}
                >
                  Submit
                </button>
              </div>
              <ul className="mt-5 space-y-2">
                {curations.map((c, i) => (
                  <li key={i} className={`curation ${c.status}`}>
                    {c.status === "accepted" && (
                      <><strong>{c.word}</strong> — accepted. You are the Founder: 1 free seed share. ✦</>
                    )}
                    {c.status === "merged" && (
                      <><strong>{c.word}</strong> — {c.reason}</>
                    )}
                    {c.status === "rejected" && (
                      <><strong>"{c.input}"</strong> rejected — {c.reason}</>
                    )}
                  </li>
                ))}
              </ul>
              <p className="kicker mt-5 text-center">{submissions} / 3 submitted</p>
            </div>

            {/* IPO Pre-order */}
            <div className="ornate-frame p-6 sm:p-8">
              <p className="kicker mb-1">Optional — IPO Pre-Order</p>
              <h2 className="h-display text-2xl mb-3">
                Book a <span className="gold">position</span> now
              </h2>
              <p className="body-copy text-sm mb-4">
                Like a stock IPO — deposit before the card is formed. If your word
                ends up on the card{" "}
                <strong className="text-cream/90">and</strong> your bid price ≥ the
                AI&apos;s opening price, your position is confirmed. Otherwise your
                deposit is fully refunded.
              </p>

              <div className="grid grid-cols-[1fr_auto_auto] gap-2 items-end">
                <div>
                  <label className="kicker block mb-1">Word</label>
                  <input
                    className="input-dark w-full text-sm"
                    style={{ padding: "0.6rem 0.8rem" }}
                    placeholder="e.g. AI"
                    list="pool-words"
                    value={bidWord}
                    onChange={(e) => setBidWord(e.target.value)}
                  />
                  <datalist id="pool-words">
                    {pool.map((w) => <option key={w.word} value={w.word} />)}
                  </datalist>
                </div>
                <div>
                  <label className="kicker block mb-1">Bid price</label>
                  <input
                    type="number"
                    step="0.05"
                    min="0.01"
                    className="input-dark w-20 text-sm text-center"
                    style={{ padding: "0.6rem 0.5rem" }}
                    value={bidPrice}
                    onChange={(e) => setBidPrice(e.target.value)}
                  />
                </div>
                <div>
                  <label className="kicker block mb-1">USDC</label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    className="input-dark w-20 text-sm text-center"
                    style={{ padding: "0.6rem 0.5rem" }}
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                  />
                </div>
              </div>

              {/* hint: show opening price for chosen word */}
              {bidWord && (() => {
                const w = pool.find((p) => p.word.toLowerCase() === bidWord.toLowerCase());
                if (!w) return (
                  <p className="text-xs text-amber-400/70 mt-1">
                    "{bidWord}" not in current pool — check spelling
                  </p>
                );
                return (
                  <p className="text-xs text-cream/40 mt-1">
                    AI opening price for <strong className="text-cream/70">{w.word}</strong>:{" "}
                    <strong className="text-gold">{w.price} USDC</strong> ·{" "}
                    {parseFloat(bidPrice) >= w.price ? (
                      <span style={{ color: "#2be3d4" }}>bid OK — will be allocated if on card ✓</span>
                    ) : (
                      <span className="text-amber-400">bid too low — will be refunded ✗</span>
                    )}
                  </p>
                );
              })()}

              <button
                type="button"
                className="btn btn-gold mt-4 w-full"
                onClick={placeIpoBid}
                disabled={
                  !bidWord ||
                  parseFloat(bidAmount) > balance - ipoLocked ||
                  balance - ipoLocked < 1
                }
              >
                Place IPO Order · Lock {bidAmount} USDC
              </button>

              <p className="text-xs text-cream/30 mt-2 text-center">
                Available to lock: {fmt(balance - ipoLocked)} USDC · Total locked: {fmt(ipoLocked)} USDC
              </p>

              {ipoBids.length > 0 && (
                <div className="mt-4 border-t border-gold/15 pt-3">
                  <p className="kicker mb-2">Your pre-orders ({ipoBids.length})</p>
                  <ul className="space-y-1.5">
                    {ipoBids.map((b) => {
                      const w = pool.find((p) => p.word === b.word);
                      const ok = w && b.bidPrice >= w.price;
                      return (
                        <li key={b.id} className="flex items-center gap-2">
                          <span
                            className="text-xs shrink-0"
                            style={{ color: ok ? "#2be3d4" : "#e07a4a" }}
                          >
                            {ok ? "✓" : "!"}
                          </span>
                          <span className="text-xs flex-1 text-cream/80">
                            <strong>{b.word}</strong> · bid {b.bidPrice} · {fmt(b.amount)} USDC locked
                          </span>
                          <button
                            type="button"
                            onClick={() => cancelIpoBid(b.id)}
                            className="text-[10px] text-cream/30 hover:text-cream/70 transition underline shrink-0"
                          >
                            cancel
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>

            <div className="text-center">
              <button
                type="button"
                className="btn btn-gold"
                onClick={() => { setCuratStep(0); setPhase("curate"); }}
              >
                {submissions > 0 ? "Continue — AI Curates Card →" : "Skip — Let AI Choose →"}
              </button>
            </div>
          </div>
        )}

        {/* ═══ AI CURATION + IPO SETTLEMENT ═══ */}
        {phase === "curate" && (
          <div className="mx-auto max-w-2xl">
            <div className="ornate-frame p-6 sm:p-8">
              <p className="kicker text-center mb-2">AI Oracle is working</p>
              <h1 className="h-display text-center text-3xl sm:text-4xl mb-6">
                Assembling <span className="gold">Bingo Card</span>
              </h1>

              <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                {curatLog.slice(0, curatStep).map((entry) => (
                  <div
                    key={entry.word}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${
                      entry.isUser
                        ? "border border-gold/40 bg-gold/5"
                        : "border border-white/5 bg-white/[0.02]"
                    }`}
                  >
                    <span
                      className={`shrink-0 w-8 text-right text-xs font-bold ${
                        entry.prob >= 70 ? "text-teal-400" : entry.prob >= 45 ? "text-gold" : "text-cream/40"
                      }`}
                    >
                      {entry.prob}%
                    </span>
                    <span className="font-bold text-cream min-w-[72px]">{entry.word}</span>
                    <span className="text-cream/50 text-xs italic truncate flex-1">{entry.reason}</span>
                    {entry.isUser && <span className="founder-tag shrink-0">✦ Yours</span>}
                    <span className="text-teal-400 shrink-0 text-xs font-bold">✓</span>
                  </div>
                ))}
                {curatStep <= curatLog.length && curatStep > 0 && (
                  <div className="flex items-center gap-2 px-3 py-2 text-xs text-cream/30">
                    <span className="animate-pulse">●</span> Analyzing next word…
                  </div>
                )}
              </div>

              {/* Card assembled */}
              {curatStep > curatLog.length && card && (
                <div className="mt-6 border-t border-gold/15 pt-5">
                  <p className="kicker text-center mb-4">Card assembled — 25 tiles</p>
                  <div className="bingo-board">
                    {card.map((w, i) => (
                      <div
                        key={i}
                        className={`bingo-tile ${w === FREE ? "free" : ""} ${founderSeeds.has(w) ? "sel" : ""}`}
                      >
                        {w}
                        {founderSeeds.has(w) && <span className="owned-chip">✦</span>}
                      </div>
                    ))}
                  </div>

                  {/* IPO settlement results */}
                  {ipoBids.length > 0 && (
                    <div className="mt-6">
                      <p className="kicker mb-3">Settling IPO Pre-orders</p>
                      <ul className="space-y-2">
                        {ipoResults.slice(0, ipoSettleStep).map((r, i) => (
                          <li
                            key={i}
                            className={`flex items-start gap-3 rounded-lg px-3 py-2.5 text-sm border ${
                              r.allocated
                                ? "border-teal-800/50 bg-teal-950/30"
                                : "border-amber-900/40 bg-amber-950/20"
                            }`}
                          >
                            <span
                              className={`shrink-0 mt-0.5 text-base font-bold ${
                                r.allocated ? "text-teal-400" : "text-amber-400"
                              }`}
                            >
                              {r.allocated ? "✓" : "✗"}
                            </span>
                            <div className="flex-1 text-xs leading-relaxed">
                              <strong className="text-cream">{r.word}</strong>
                              {" · "}
                              {r.inCard ? "in card ✓" : "not in card ✗"}
                              {r.inCard && (
                                <>
                                  {" · "}
                                  bid {r.bidPrice} {r.priceOk ? "≥" : "<"} opening {r.openingPrice}{" "}
                                  {r.priceOk ? "✓" : "✗"}
                                </>
                              )}
                            </div>
                            <span
                              className={`shrink-0 text-xs font-bold ${
                                r.allocated ? "text-teal-300" : "text-amber-300"
                              }`}
                            >
                              {r.allocated
                                ? `+${fmt(r.amount)} staked`
                                : `${fmt(r.amount)} refunded`}
                            </span>
                          </li>
                        ))}
                        {ipoSettleStep < ipoResults.length && (
                          <li className="flex items-center gap-2 text-xs text-cream/30 px-3">
                            <span className="animate-pulse">●</span> Settling…
                          </li>
                        )}
                        {ipoSettleStep === 0 && ipoResults.length > 0 && (
                          <li className="flex items-center gap-2 text-xs text-cream/30 px-3">
                            <span className="animate-pulse">●</span> Matching orders to card…
                          </li>
                        )}
                      </ul>
                    </div>
                  )}

                  {/* Proceed button — show after settlement done (or immediately if no bids) */}
                  {(ipoBids.length === 0 || ipoSettleStep >= ipoResults.length) && (
                    <div className="mt-6 text-center">
                      {founderSeeds.size > 0 && (
                        <p className="body-copy text-sm italic mb-4">
                          Gold border = your submitted words · free founder share locked in
                        </p>
                      )}
                      <button
                        type="button"
                        className="btn btn-gold"
                        onClick={() => setPhase("market")}
                      >
                        Open Trading →
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══ MARKET / LIVE / SETTLED ═══ */}
        {card && (phase === "market" || phase === "live" || phase === "settled") && (
          <div className="grid items-start gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            {/* Left: card + transcript */}
            <div className="space-y-4">
              <div className="ornate-frame">
                <div className="frame-screen board-scene px-2 pb-4 pt-4 sm:px-4 sm:pb-5">
                  <div className="mb-3 flex flex-wrap items-center justify-center gap-2 sm:justify-between">
                    <span className="hud-plate">
                      <span className="dot gold" aria-hidden="true" />
                      {who} · {fmt(balance)} USDC
                    </span>
                    <span className="hud-plate hidden xl:inline-flex">{DEMO_EVENT.name}</span>
                    <span className="hud-plate">
                      <span className={`dot ${phase === "live" ? "live" : "gold"}`} aria-hidden="true" />
                      {phase === "market" && "Oracle · Standing by"}
                      {phase === "live" && `Oracle · Listening ${elapsed}s`}
                      {phase === "settled" && "Oracle · Settled"}
                    </span>
                  </div>

                  <div className="bingo-board">
                    {card.map((w) => {
                      const free = w === FREE;
                      const hit = !free && validated.has(w);
                      const own = (positions[w] ?? 0) > 0 || founderSeeds.has(w);
                      return (
                        <button
                          type="button"
                          key={w}
                          className={`bingo-tile ${free ? "free" : ""} ${hit ? "hit" : ""} ${selected === w ? "sel" : ""}`}
                          onClick={() => !free && phase === "market" && setSelected(w)}
                          disabled={free || phase !== "market"}
                          aria-label={free ? "Free tile" : `${w}${hit ? " — validated" : ""}`}
                        >
                          {w}
                          {own && !free && (
                            <span className="owned-chip" aria-hidden="true">
                              {founderSeeds.has(w) && (positions[w] ?? 0) === 0 ? "✦" : fmt(positions[w] ?? 0)}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <p className="kicker mt-3 text-center">
                    {phase === "market"
                      ? "Tap a tile to trade · prices are live"
                      : phase === "live"
                        ? "Tiles light up as AI validates spoken words"
                        : "Final card — oracle settled"}
                  </p>
                </div>
              </div>

              {phase === "live" && (
                <div className="ornate-frame">
                  <div className="frame-screen board-scene p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <span
                        aria-hidden="true"
                        style={{
                          width: 7, height: 7, borderRadius: "50%",
                          background: "#2be3d4", boxShadow: "0 0 8px rgba(0,198,184,0.9)",
                          display: "inline-block", flexShrink: 0,
                          animation: "pulse-dot 1.6s ease-in-out infinite",
                        }}
                      />
                      <span className="kicker">Live Transcript — Whisper STT</span>
                    </div>
                    <div className="font-body text-sm text-cream/80 leading-relaxed max-h-28 overflow-y-auto">
                      {SPEECH_TEXT.slice(0, transcriptChars)}
                      {transcriptChars < SPEECH_TEXT.length && (
                        <span className="animate-pulse" style={{ color: "#2be3d4" }}>▌</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right: market / oracle panel */}
            <div className="game-panel">
              {phase === "market" && (
                <>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <h2 className="step-title text-sm">Word Market — Live Prices</h2>
                    {priceFlash && (
                      <span className="text-[10px] font-mono animate-pulse" style={{ color: "rgba(43,227,212,0.6)" }}>
                        {priceFlash}
                      </span>
                    )}
                  </div>

                  {selectedInfo ? (
                    <div>
                      <div className="flex items-baseline justify-between mb-3">
                        <span className="h-display text-2xl">{selectedInfo.word}</span>
                        {selectedInfo.isUserWord && <span className="founder-tag">✦ Founder</span>}
                      </div>
                      <div className="space-y-2 mb-4">
                        {[
                          ["Price", `${fmt(prices[selectedInfo.word] ?? selectedInfo.price)} USDC`],
                          ["Multiplier", `${selectedInfo.mult}×`],
                          ["AI probability", `${Math.round(selectedInfo.aiProb * 100)}%`],
                          [
                            "Your position",
                            `${fmt(positions[selectedInfo.word] ?? 0)} USDC${
                              founderSeeds.has(selectedInfo.word) ? " + free seed" : ""
                            }`,
                          ],
                        ].map(([k, v]) => (
                          <div key={k} className="stat-row">
                            <dt>{k}</dt>
                            <dd className={k === "Multiplier" ? "text-teal-glow" : ""}>{v}</dd>
                          </div>
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {[1, 5, 10].map((amt) => (
                          <button key={`b${amt}`} type="button" className="btn btn-mini-gold"
                            onClick={() => buy(selectedInfo.word, amt)} disabled={balance < 1}>
                            Buy +{amt}
                          </button>
                        ))}
                        {(positions[selectedInfo.word] ?? 0) > 0 &&
                          [1, 5].map((amt) => (
                            <button key={`s${amt}`} type="button" className="btn btn-blood"
                              style={{ fontSize: "0.62rem" }}
                              onClick={() => sell(selectedInfo.word, amt)}>
                              Sell -{amt}
                            </button>
                          ))}
                      </div>
                      <button type="button"
                        className="mt-3 text-xs text-cream/30 hover:text-cream/60 transition underline block"
                        onClick={() => setSelected(null)}>
                        ← All words
                      </button>
                    </div>
                  ) : (
                    <div>
                      <p className="body-copy text-sm mb-3">
                        Prices move with demand. Sell before the event locks to exit.
                        IPO positions already showing on your card.
                      </p>
                      <div className="grid grid-cols-2 gap-1.5">
                        {pool.slice(0, 8).map((w) => {
                          const cur = prices[w.word] ?? w.price;
                          const up = cur > w.price;
                          return (
                            <button key={w.word} type="button" onClick={() => setSelected(w.word)}
                              className="flex items-center justify-between rounded-lg border border-gold/15 bg-black/25 px-2.5 py-2 text-xs hover:border-gold/40 transition">
                              <span className="font-bold text-cream truncate">{w.word}</span>
                              <span className="font-bold ml-1 shrink-0" style={{ color: up ? "#2be3d4" : "#e07a4a" }}>
                                {fmt(cur)}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="mt-5 border-t border-gold/15 pt-4 space-y-1.5">
                    <div className="stat-row"><dt>Balance</dt><dd>{fmt(balance)} USDC</dd></div>
                    <div className="stat-row"><dt>Total staked</dt><dd>{fmt(spent)} USDC</dd></div>
                  </div>
                  <button type="button" className="btn btn-gold mt-6 w-full"
                    onClick={() => { setTranscriptChars(0); setPhase("live"); }}>
                    ▶ Lock Market — Start Live Event
                  </button>
                </>
              )}

              {(phase === "live" || phase === "settled") && (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="step-title text-sm">
                      {phase === "live" ? "AI Oracle — Live Feed" : "Oracle — Settled"}
                    </h2>
                    {phase === "live" && (
                      <span className="flex items-center gap-1">
                        {[1, 2, 4].map((s) => (
                          <button key={s} type="button" className={`chip-btn ${speed === s ? "on" : ""}`}
                            onClick={() => setSpeed(s)}>{s}×</button>
                        ))}
                      </span>
                    )}
                  </div>

                  {phase === "settled" && (
                    <div className="mt-4">
                      <div className="rounded-lg border px-4 py-3 mb-4"
                        style={{ borderColor: "rgba(43,227,212,0.2)", background: "rgba(0,30,27,0.3)" }}>
                        <p className="step-title text-xs mb-2" style={{ color: "#2be3d4" }}>AI Oracle Report</p>
                        <div className="space-y-1">
                          {[
                            ["Words in pool", String(pool.length)],
                            ["Events processed", String(script.length)],
                            ["Validated ✓", String(validated.size)],
                            ["Avg. confidence", "0.93"],
                          ].map(([k, v]) => (
                            <div key={k} className="stat-row">
                              <dt>{k}</dt>
                              <dd style={k === "Validated ✓" ? { color: "#2be3d4" } : undefined}>{v}</dd>
                            </div>
                          ))}
                        </div>
                      </div>

                      <h3 className="h-display text-2xl mb-3">Settlement <span className="gold">&amp; Rewards</span></h3>
                      <div className="space-y-1.5">
                        {rewardRows.map((r, i) => (
                          <div key={i} className="stat-row">
                            <dt>{r.word} {r.seed ? "(founder seed)" : `· ${fmt(r.stake)} staked`}</dt>
                            <dd className="text-teal-glow">+{fmt(r.payout)}</dd>
                          </div>
                        ))}
                        {bonuses.map((b, i) => (
                          <div key={`b${i}`} className="stat-row">
                            <dt>✦ {b.label}</dt>
                            <dd className="text-gold-bright">+{fmt(b.amount)}</dd>
                          </div>
                        ))}
                        {rewardRows.length === 0 && bonuses.length === 0 && (
                          <p className="body-copy text-base">No winning positions — try more words next round!</p>
                        )}
                        <div className="stat-row border-t border-gold/20 pt-2">
                          <dt>Total rewards</dt>
                          <dd className="text-gold-bright">+{fmt(rewardTotal)} USDC</dd>
                        </div>
                        <div className="stat-row">
                          <dt>Profit (after {fmt(spent)} staked)</dt>
                          <dd className={profit >= 0 ? "text-teal-glow" : ""}>
                            {profit >= 0 ? "+" : ""}{fmt(profit)} USDC
                          </dd>
                        </div>
                      </div>

                      {!claimed ? (
                        <button type="button" className="btn btn-gold mt-5 w-full" onClick={claim}>
                          Claim {fmt(rewardTotal)} USDC on Mantle
                        </button>
                      ) : (
                        <>
                          <p className="curation accepted mt-4">
                            Claimed! Balance: <strong>{fmt(balance)} USDC</strong>
                          </p>
                          <div className="mt-5">
                            <h3 className="step-title text-xs mb-2">Leaderboard — Human vs AI</h3>
                            <div className="space-y-1.5">
                              {[...RIVALS, { name: `${who} (you)`, kind: "Human", profit }]
                                .sort((a, b) => b.profit - a.profit)
                                .map((r, i) => (
                                  <div key={r.name} className="stat-row">
                                    <dt>{i + 1}. {r.name} <span className="kicker">· {r.kind}</span></dt>
                                    <dd className={r.profit >= 0 ? "text-teal-glow" : ""}>
                                      {r.profit >= 0 ? "+" : ""}{fmt(r.profit)}
                                    </dd>
                                  </div>
                                ))}
                            </div>
                          </div>
                          <div className="mt-5 rounded-lg border px-4 py-3"
                            style={{ borderColor: "rgba(217,164,65,0.2)", background: "rgba(0,0,0,0.3)" }}>
                            <p className="step-title text-xs mb-2" style={{ color: "#e8c66b" }}>✦ Trustless by Design</p>
                            <p className="step-desc text-xs leading-relaxed mb-2">
                              AI oracle verdicts commit on-chain — no admin override after event starts.
                              Organizers fund prize pools and can cancel before go-live (full refund). Results are immutable.
                            </p>
                            <p className="step-desc text-xs leading-relaxed">
                              <strong style={{ color: "#cdbb96" }}>AI risk disclosed upfront:</strong>{" "}
                              Whisper may miss words in poor audio. Ambiguous homophones may not match.
                              Players accept oracle risk before any trade is placed — same as how prediction
                              markets agree on resolution sources in advance.
                            </p>
                          </div>
                          <div className="mt-5 flex gap-3">
                            <button type="button" className="btn btn-ghost flex-1" onClick={reset}>Play Again</button>
                            <Link href="/" className="btn btn-gold flex-1">Back Home</Link>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  <ul className="feed mt-4" aria-live="polite">
                    {feed.map((e) => (
                      <li key={e.id} className={`feed-item ${e.word ? "" : "reject"}`}>
                        <span className="feed-head">
                          {e.word ? (
                            <><strong>{e.word}</strong> ✓ validated · conf {e.conf.toFixed(2)}</>
                          ) : (
                            <>heard &ldquo;{e.heard}&rdquo; — no match · conf {e.conf.toFixed(2)}</>
                          )}
                        </span>
                        <span className="quote">{e.snippet}</span>
                      </li>
                    ))}
                    {feed.length === 0 && (
                      <li className="feed-item">
                        <span className="feed-head">Oracle warming up…</span>
                        <span className="quote">
                          Whisper is transcribing the venue audio. Verdicts land here and commit on-chain in real time.
                        </span>
                      </li>
                    )}
                  </ul>
                </>
              )}
            </div>
          </div>
        )}
      </main>

      {banner && (
        <div className="bingo-banner" role="status">✦ BINGO — {banner}</div>
      )}
    </div>
  );
}
