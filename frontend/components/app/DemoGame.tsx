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
  BASE_POOL,
  DEMO_EVENT,
  ORACLE_SCRIPT,
  RIVALS,
  STARTING_BALANCE,
  SWAP_ORDER,
  USER_WORD_INFO,
  type OracleEvent,
} from "./data";

type Phase = "lobby" | "words" | "market" | "live" | "settled";

type FeedEntry = {
  id: number;
  word: string | null;
  heard?: string;
  snippet: string;
  conf: number;
};

const PHASES: { key: Phase; label: string }[] = [
  { key: "lobby", label: "Join" },
  { key: "words", label: "Words" },
  { key: "market", label: "Market" },
  { key: "live", label: "Live" },
  { key: "settled", label: "Claim" },
];

const fmt = (n: number) => Number(n.toFixed(2)).toString();

export default function DemoGame() {
  const { address } = useAccount();

  const [phase, setPhase] = useState<Phase>("lobby");
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

  const founderWords = useMemo(
    () => pool.filter((w) => w.isUserWord).map((w) => w.word),
    [pool],
  );
  const founderSeeds = useMemo(() => new Set(founderWords), [founderWords]);
  const submissions = curations.filter((c) => c.status !== "rejected").length;

  /* the oracle script with the player's first founded word spliced in */
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

  /* ── oracle simulation ── */
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
            setBanner(
              fresh.map((bn) => `${bn.label} +${bn.amount} USDC`).join("  ·  "),
            );
          }
        }
      }
      setEventIdx((i) => i + 1);
    }, (e.gap * 1000) / speed);
    return () => clearTimeout(t);
  }, [phase, eventIdx, speed, script, card, bonusKeys, validated]);

  /* live timer + bingo banner auto-hide */
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

  /* ── actions ── */
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
    }
    setWordInput("");
  }

  function enterMarket() {
    setCard(makeCard(pool.map((w) => w.word), Date.now() & 0xffffffff));
    setPhase("market");
  }

  function buy(word: string, amount: number) {
    const amt = Math.min(amount, balance);
    if (amt <= 0 || phase !== "market") return;
    setPositions((p) => ({ ...p, [word]: (p[word] ?? 0) + amt }));
    setBalance((b) => Math.round((b - amt) * 100) / 100);
    setSpent((s) => Math.round((s + amt) * 100) / 100);
  }

  const rewardRows = useMemo(
    () =>
      card ? predictionRewards(pool, positions, founderSeeds, validated) : [],
    [card, pool, positions, founderSeeds, validated],
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
    setPhase("lobby");
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
  }

  const who = address
    ? `${address.slice(0, 6)}…${address.slice(-4)}`
    : "Guest Player";
  const phaseIdx = PHASES.findIndex((p) => p.key === phase);
  const selectedInfo = selected
    ? pool.find((w) => w.word === selected) ?? null
    : null;

  return (
    <div className="app-bg">
      {/* ── app bar ── */}
      <header className="topbar">
        <div className="mx-auto flex h-11 max-w-6xl items-center justify-between gap-4 px-4">
          <Link href="/" className="wordmark text-lg" aria-label="Back to home">
            Bingocle
          </Link>
          <nav aria-label="Game phase" className="hidden items-center gap-3 md:flex">
            {PHASES.map((p, i) => (
              <span
                key={p.key}
                className={`phase-step ${i === phaseIdx ? "active" : ""} ${
                  i < phaseIdx ? "done" : ""
                }`}
              >
                <span className="p-rune">{i < phaseIdx ? "✓" : i + 1}</span>
                {p.label}
              </span>
            ))}
          </nav>
          <ConnectWalletButton />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-20 pt-8 sm:px-6">
        <p className="kicker mb-6 text-center">
          Demo mode — simulated oracle, no real funds. Contracts coming soon.
        </p>

        {phase === "lobby" && (
          <div className="mx-auto max-w-xl">
            <div className="ornate-frame p-6 sm:p-8">
              <h1 className="h-display text-center text-3xl sm:text-4xl">
                Join the <span className="gold">Live Event</span>
              </h1>
              <dl className="mt-6 space-y-2">
                {[
                  ["Event", DEMO_EVENT.name],
                  ["Theme", DEMO_EVENT.theme],
                  ["Reward pool", DEMO_EVENT.pool],
                  ["AI Oracle", DEMO_EVENT.oracle],
                  ["Network", DEMO_EVENT.chain],
                ].map(([k, v]) => (
                  <div key={k} className="stat-row">
                    <dt>{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
              <p className="body-copy mt-5 text-center text-base italic">
                Playing as <span className="text-gold-bright">{who}</span> with{" "}
                {STARTING_BALANCE} demo USDC.
              </p>
              <div className="mt-7 text-center">
                <button type="button" className="btn btn-gold" onClick={() => setPhase("words")}>
                  Join Event
                </button>
              </div>
            </div>
          </div>
        )}

        {phase === "words" && (
          <div className="mx-auto max-w-xl">
            <div className="ornate-frame p-6 sm:p-8">
              <h1 className="h-display text-center text-3xl sm:text-4xl">
                Submit your <span className="gold">words</span>
              </h1>
              <p className="body-copy mt-4 text-center text-base">
                Predict up to 3 words the speakers will say. A brand-new word
                that survives AI curation makes you its{" "}
                <strong className="text-gold-bright">Word Founder</strong> — you
                get a free seed position on your own prediction.
              </p>
              <div className="mt-6 flex gap-3">
                <input
                  className="input-dark flex-1"
                  placeholder={
                    submissions >= 3 ? "3 of 3 words submitted" : "e.g. Liquidity"
                  }
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
                      <>
                        <strong>{c.word}</strong> — accepted into the pool. You
                        are the Founder: 1 free seed share is yours. ✦
                      </>
                    )}
                    {c.status === "merged" && (
                      <>
                        <strong>{c.word}</strong> — {c.reason}
                      </>
                    )}
                    {c.status === "rejected" && (
                      <>
                        <strong>“{c.input}”</strong> rejected — {c.reason}
                      </>
                    )}
                  </li>
                ))}
              </ul>
              <p className="kicker mt-5 text-center">{submissions} / 3 submitted</p>
              <div className="mt-6 text-center">
                <button type="button" className="btn btn-gold" onClick={enterMarket}>
                  {submissions > 0 ? "Continue to Market" : "Skip — straight to Market"}
                </button>
              </div>
            </div>
          </div>
        )}

        {card && phase !== "lobby" && phase !== "words" && (
          <div className="grid items-start gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            {/* ── the card ── */}
            <div className="ornate-frame">
              <div className="frame-screen board-scene px-2 pb-4 pt-4 sm:px-4 sm:pb-5">
                <div className="mb-3 flex flex-wrap items-center justify-center gap-2 sm:justify-between">
                  <span className="hud-plate">
                    <span className="dot gold" aria-hidden="true" />
                    {who} · {fmt(balance)} USDC
                  </span>
                  <span className="hud-plate hidden xl:inline-flex">{DEMO_EVENT.name}</span>
                  <span className="hud-plate">
                    <span
                      className={`dot ${phase === "live" ? "live" : "gold"}`}
                      aria-hidden="true"
                    />
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
                        className={`bingo-tile ${free ? "free" : ""} ${
                          hit ? "hit" : ""
                        } ${selected === w ? "sel" : ""}`}
                        onClick={() => !free && setSelected(w)}
                        disabled={free}
                        aria-label={free ? "Free tile" : `Select ${w}`}
                      >
                        {w}
                        {own && !free && (
                          <span className="owned-chip" aria-hidden="true">
                            {founderSeeds.has(w) && (positions[w] ?? 0) === 0
                              ? "✦"
                              : fmt(positions[w] ?? 0)}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                <p className="kicker mt-3 text-center">
                  {phase === "market"
                    ? "Tap a tile to inspect & buy a position"
                    : phase === "live"
                      ? "Tiles light up as the AI validates spoken words"
                      : "Final card — settlement complete"}
                </p>
              </div>
            </div>

            {/* ── side panel ── */}
            <div className="game-panel">
              {phase === "market" && (
                <>
                  <h2 className="step-title text-sm">Word Market</h2>
                  {selectedInfo ? (
                    <div className="mt-4">
                      <div className="flex items-baseline justify-between">
                        <span className="h-display text-2xl">{selectedInfo.word}</span>
                        {selectedInfo.isUserWord && (
                          <span className="founder-tag">✦ Your word — Founder</span>
                        )}
                      </div>
                      <div className="mt-3 space-y-2">
                        <div className="stat-row">
                          <dt>Opening price</dt>
                          <dd>{fmt(selectedInfo.price)} USDC</dd>
                        </div>
                        <div className="stat-row">
                          <dt>Multiplier</dt>
                          <dd className="text-teal-glow">{selectedInfo.mult}×</dd>
                        </div>
                        <div className="stat-row">
                          <dt>AI probability</dt>
                          <dd>{Math.round(selectedInfo.aiProb * 100)}%</dd>
                        </div>
                        <div className="stat-row">
                          <dt>Your position</dt>
                          <dd>
                            {fmt(positions[selectedInfo.word] ?? 0)} USDC
                            {founderSeeds.has(selectedInfo.word) && " + free seed"}
                          </dd>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center gap-2">
                        {[1, 5, 10].map((amt) => (
                          <button
                            key={amt}
                            type="button"
                            className="btn btn-mini-gold"
                            onClick={() => buy(selectedInfo.word, amt)}
                            disabled={balance < 1}
                          >
                            Buy +{amt}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="body-copy mt-4 text-base">
                      Select a word on your card. Buy low-probability words for
                      big multipliers, or back the sure things for steady
                      returns. Market locks when the event goes live.
                    </p>
                  )}

                  <div className="mt-6 border-t border-gold/15 pt-4">
                    <div className="stat-row">
                      <dt>Balance</dt>
                      <dd>{fmt(balance)} USDC</dd>
                    </div>
                    <div className="stat-row">
                      <dt>Total staked</dt>
                      <dd>{fmt(spent)} USDC</dd>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-gold mt-6 w-full"
                    onClick={() => setPhase("live")}
                  >
                    ▶ Start Live Event
                  </button>
                </>
              )}

              {(phase === "live" || phase === "settled") && (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="step-title text-sm">
                      {phase === "live" ? "Oracle Feed — Live" : "Oracle Feed — Ended"}
                    </h2>
                    {phase === "live" && (
                      <span className="flex items-center gap-1">
                        {[1, 2, 4].map((s) => (
                          <button
                            key={s}
                            type="button"
                            className={`chip-btn ${speed === s ? "on" : ""}`}
                            onClick={() => setSpeed(s)}
                          >
                            {s}×
                          </button>
                        ))}
                      </span>
                    )}
                  </div>

                  {phase === "settled" && (
                    <div className="mt-4">
                      <h3 className="h-display text-2xl">
                        Settlement <span className="gold">& Rewards</span>
                      </h3>
                      <div className="mt-3 space-y-1.5">
                        {rewardRows.map((r, i) => (
                          <div key={i} className="stat-row">
                            <dt>
                              {r.word} {r.seed ? "(founder seed)" : `· ${fmt(r.stake)} staked`}
                            </dt>
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
                          <p className="body-copy text-base">
                            No winning positions this round — try backing more words!
                          </p>
                        )}
                        <div className="stat-row border-t border-gold/20 pt-2">
                          <dt>Total rewards</dt>
                          <dd className="text-gold-bright">+{fmt(rewardTotal)} USDC</dd>
                        </div>
                        <div className="stat-row">
                          <dt>Profit (after {fmt(spent)} staked)</dt>
                          <dd className={profit >= 0 ? "text-teal-glow" : ""}>
                            {profit >= 0 ? "+" : ""}
                            {fmt(profit)} USDC
                          </dd>
                        </div>
                      </div>

                      {!claimed ? (
                        <button type="button" className="btn btn-gold mt-5 w-full" onClick={claim}>
                          Claim {fmt(rewardTotal)} USDC
                        </button>
                      ) : (
                        <>
                          <p className="curation accepted mt-4">
                            Claimed! Balance: <strong>{fmt(balance)} USDC</strong>
                          </p>
                          <div className="mt-4">
                            <h3 className="step-title text-xs">Leaderboard — Human vs AI</h3>
                            <div className="mt-2 space-y-1.5">
                              {[...RIVALS, { name: `${who} (you)`, kind: "Human", profit }]
                                .sort((a, b) => b.profit - a.profit)
                                .map((r, i) => (
                                  <div key={r.name} className="stat-row">
                                    <dt>
                                      {i + 1}. {r.name}{" "}
                                      <span className="kicker">· {r.kind}</span>
                                    </dt>
                                    <dd className={r.profit >= 0 ? "text-teal-glow" : ""}>
                                      {r.profit >= 0 ? "+" : ""}
                                      {fmt(r.profit)}
                                    </dd>
                                  </div>
                                ))}
                            </div>
                          </div>
                          <div className="mt-5 flex gap-3">
                            <button type="button" className="btn btn-ghost flex-1" onClick={reset}>
                              Play Again
                            </button>
                            <Link href="/" className="btn btn-gold flex-1">
                              Back Home
                            </Link>
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
                            <>
                              <strong>{e.word}</strong> ✓ validated · conf{" "}
                              {e.conf.toFixed(2)}
                            </>
                          ) : (
                            <>
                              heard “{e.heard}” — no match · conf {e.conf.toFixed(2)}
                            </>
                          )}
                        </span>
                        <span className="quote">{e.snippet}</span>
                      </li>
                    ))}
                    {feed.length === 0 && (
                      <li className="feed-item">
                        <span className="feed-head">Oracle warming up…</span>
                        <span className="quote">
                          Whisper is transcribing the venue audio. Verdicts land
                          here — and on-chain — in real time.
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

      {/* bingo banner */}
      {banner && (
        <div className="bingo-banner" role="status">
          ✦ BINGO — {banner}
        </div>
      )}
    </div>
  );
}
