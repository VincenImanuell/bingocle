"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import ConnectWalletButton from "@/components/ConnectWalletButton";
import {
  useAccount,
  useReadContract,
  useReadContracts,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { readContract } from "wagmi/actions";
import { formatEther, parseEther } from "viem";
import { wagmiConfig } from "@/lib/wagmi";
import {
  addresses,
  bingoCardAbi,
  eventFactoryAbi,
  fetchEventRecord,
  PHASES,
  rewardVaultAbi,
  wordMarketAbi,
  wordPoolAbi,
  type EventRecord,
} from "@/lib/contracts";
import { PriceChart, type PricePoint } from "./PriceChart";

// ── types ──
type UiPhase = "event" | "words" | "curate" | "market" | "live" | "settled";

const PHASE_STEPS: { key: UiPhase; label: string }[] = [
  { key: "event", label: "Event" },
  { key: "words", label: "Submit" },
  { key: "curate", label: "Curate" },
  { key: "market", label: "Trade" },
  { key: "live", label: "Live" },
  { key: "settled", label: "Claim" },
];

function contractToUi(phase: string): UiPhase {
  switch (phase) {
    case "Submission": return "words";
    case "Founder":    return "curate";
    case "Market":     return "market";
    case "Live":       return "live";
    case "Dispute":
    case "Settled":    return "settled";
    default:           return "event";
  }
}

const fmt = (n: number, d = 4) => Number(n.toFixed(d)).toString();
const FREE_IDX = 255;

export default function OnchainGame() {
  const { address, isConnected } = useAccount();
  const [eventId, setEventId] = useState(0);
  const [record, setRecord] = useState<EventRecord | null>(null);
  const [wordInput, setWordInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState<string | null>(null);
  const [selectedWord, setSelectedWord] = useState<number | null>(null);
  const [buyAmount, setBuyAmount] = useState("0.01");
  const [busy, setBusy] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const [priceHistory, setPriceHistory] = useState<Record<number, PricePoint[]>>({});
  const pricesRef = useRef<Record<number, number>>({});

  const { isLoading: txPending } = useWaitForTransactionReceipt({ hash: txHash });
  const { writeContractAsync } = useWriteContract();

  // ── event count (for lobby) ──
  const { data: eventCountData, refetch: refetchEventCount } = useReadContract({
    address: addresses.eventFactory,
    abi: eventFactoryAbi,
    functionName: "eventCount",
  });
  const totalEvents = eventCountData ? Number(eventCountData as bigint) : 0;

  // Fetch phase for each event in lobby
  const lobbyCalls = useMemo(
    () => Array.from({ length: totalEvents }, (_, i) => ({
      address: addresses.eventFactory,
      abi: eventFactoryAbi,
      functionName: "phaseOf" as const,
      args: [BigInt(i + 1)] as const,
    })),
    [totalEvents]
  );
  const { data: lobbyPhases } = useReadContracts({ contracts: lobbyCalls });

  // ── contract reads ──
  const { data: meta, refetch: refetchMeta } = useReadContracts({
    contracts: eventId > 0 ? [
      { address: addresses.eventFactory, abi: eventFactoryAbi, functionName: "phaseOf", args: [BigInt(eventId)] },
      { address: addresses.wordPool, abi: wordPoolAbi, functionName: "wordCount", args: [BigInt(eventId)] },
      { address: addresses.wordPool, abi: wordPoolAbi, functionName: "isCommitted", args: [BigInt(eventId)] },
    ] : [],
  });
  const contractPhase = meta?.[0]?.result !== undefined ? PHASES[Number(meta[0].result)] : "None";
  const wordCount = meta?.[1]?.result ? Number(meta[1].result) : record?.words.length ?? 0;
  const committed = Boolean(meta?.[2]?.result);
  const uiPhase = contractToUi(contractPhase);
  const phaseIdx = PHASE_STEPS.findIndex((p) => p.key === uiPhase);

  const priceCalls = useMemo(
    () => Array.from({ length: wordCount }, (_, w) => ({
      address: addresses.wordMarket,
      abi: wordMarketAbi,
      functionName: "spotPrice" as const,
      args: [BigInt(eventId), BigInt(w)] as const,
    })),
    [wordCount, eventId]
  );
  const shareCalls = useMemo(
    () => address
      ? Array.from({ length: wordCount }, (_, w) => ({
          address: addresses.wordMarket,
          abi: wordMarketAbi,
          functionName: "sharesOf" as const,
          args: [BigInt(eventId), BigInt(w), address] as const,
        }))
      : [],
    [wordCount, eventId, address]
  );
  const { data: spotPrices, refetch: refetchPrices } = useReadContracts({ contracts: priceCalls });
  const { data: myShares, refetch: refetchShares } = useReadContracts({ contracts: shareCalls });

  const { data: cardData, refetch: refetchCard } = useReadContracts({
    contracts: address && eventId > 0 ? [
      { address: addresses.bingoCardNFT, abi: bingoCardAbi, functionName: "hasCard", args: [BigInt(eventId), address] },
      { address: addresses.bingoCardNFT, abi: bingoCardAbi, functionName: "cardOf", args: [BigInt(eventId), address] },
    ] : [],
  });
  const hasCard = Boolean(cardData?.[0]?.result);
  const tokenId = cardData?.[1]?.result as bigint | undefined;

  const { data: cardView, refetch: refetchCardView } = useReadContracts({
    contracts: hasCard && tokenId ? [
      { address: addresses.bingoCardNFT, abi: bingoCardAbi, functionName: "cardCells", args: [tokenId] },
      { address: addresses.bingoCardNFT, abi: bingoCardAbi, functionName: "markedMask", args: [tokenId] },
    ] : [],
  });
  const cells = cardView?.[0]?.result as readonly number[] | undefined;
  const markedMask = cardView?.[1]?.result ? Number(cardView[1].result) : 0;

  const { data: redeemable } = useReadContract({
    address: addresses.wordMarket,
    abi: wordMarketAbi,
    functionName: "previewRedeem",
    args: address && eventId > 0 ? [BigInt(eventId), address] : undefined,
    query: { enabled: Boolean(address) && eventId > 0 },
  });

  // ── fetch agent record ──
  useEffect(() => {
    if (eventId > 0) fetchEventRecord(eventId).then(setRecord);
  }, [eventId, txPending]);

  // ── accumulate price history ──
  useEffect(() => {
    if (!spotPrices) return;
    const now = Date.now();
    setPriceHistory((prev) => {
      const next = { ...prev };
      spotPrices.forEach((r, w) => {
        if (r.result === undefined) return;
        const price = +formatEther(r.result as bigint);
        pricesRef.current[w] = price;
        next[w] = [...(next[w] ?? []).slice(-49), { time: now, price }];
      });
      return next;
    });
  }, [spotPrices]);

  // ── helpers ──
  function refetchAll() {
    refetchMeta();
    refetchPrices();
    refetchShares();
    refetchCard();
    refetchCardView();
  }

  async function run(label: string, fn: () => Promise<`0x${string}`>) {
    try {
      setBusy(label);
      const hash = await fn();
      setTxHash(hash);
      await new Promise((r) => setTimeout(r, 2500));
      refetchAll();
    } catch (e) {
      alert((e as { shortMessage?: string })?.shortMessage ?? String(e));
    } finally {
      setBusy(null);
    }
  }

  async function submitWordToAgent() {
    if (!wordInput.trim() || !address) return;
    setSubmitting(true);
    setSubmitMsg(null);
    try {
      const { AGENT_API } = await import("@/lib/contracts");
      const res = await fetch(`${AGENT_API}/events/${eventId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: wordInput.trim(), player: address }),
      });
      if (res.ok) {
        setSubmitMsg(`"${wordInput.trim()}" submitted ✓`);
        setWordInput("");
        setTimeout(() => refetchAll(), 2000);
      } else {
        const err = await res.json().catch(() => ({}));
        setSubmitMsg(err?.reason ?? "submission rejected");
      }
    } catch {
      setSubmitMsg("network error — try again");
    } finally {
      setSubmitting(false);
    }
  }

  const sharesWei = (() => {
    try { return parseEther(buyAmount || "0"); } catch { return BigInt(0); }
  })();

  async function buy(w: number) {
    const cost = await readContract(wagmiConfig, {
      address: addresses.wordMarket, abi: wordMarketAbi,
      functionName: "quoteBuy", args: [BigInt(eventId), BigInt(w), sharesWei],
    });
    return run("buy", () => writeContractAsync({
      address: addresses.wordMarket, abi: wordMarketAbi,
      functionName: "buy", args: [BigInt(eventId), BigInt(w), sharesWei, cost as bigint],
      value: cost as bigint,
    }));
  }

  async function sell(w: number, amount: bigint) {
    return run("sell", () => writeContractAsync({
      address: addresses.wordMarket, abi: wordMarketAbi,
      functionName: "sell", args: [BigInt(eventId), BigInt(w), amount, BigInt(0)],
    }));
  }

  function mintCard() {
    return run("mint", () => writeContractAsync({
      address: addresses.bingoCardNFT, abi: bingoCardAbi,
      functionName: "mint", args: [BigInt(eventId)],
    }));
  }

  async function claim() {
    return run("claim", async () => {
      await writeContractAsync({ address: addresses.wordMarket, abi: wordMarketAbi, functionName: "redeem", args: [BigInt(eventId)] }).catch(() => {});
      return writeContractAsync({ address: addresses.rewardVault, abi: rewardVaultAbi, functionName: "claim", args: [BigInt(eventId)] });
    });
  }

  const wordLabel = (w: number) => record?.words[w] ?? `#${w}`;
  const wordProb = (w: number) => {
    const p = record?.odds[w]?.aiProb;
    return p !== undefined ? Math.round(p * 100) : 50;
  };
  const wordMult = (w: number) => {
    const m = record?.odds[w]?.mult1e4;
    return m ? (m / 10000).toFixed(2) : "—";
  };
  const spotEth = (w: number) => {
    const r = spotPrices?.[w]?.result;
    return r ? +formatEther(r as bigint) : 0;
  };
  const mySharesNum = (w: number) => {
    const r = myShares?.[w]?.result;
    return r ? +formatEther(r as bigint) : 0;
  };
  const isMarked = (idx: number) => Boolean(markedMask & (1 << idx));

  // ── render ──
  return (
    <div className="app-bg">
      <header className="topbar">
        <div className="mx-auto flex h-11 max-w-6xl items-center justify-between gap-4 px-4">
          <Link href="/" className="wordmark text-lg">Bingocle</Link>
          {eventId > 0 ? (
            <nav aria-label="Game phase" className="hidden items-center gap-1.5 lg:flex">
              {PHASE_STEPS.map((p, i) => (
                <span key={p.key} className={`phase-step ${i === phaseIdx ? "active" : ""} ${i < phaseIdx ? "done" : ""}`}>
                  <span className="p-rune">{i < phaseIdx ? "✓" : i + 1}</span>
                  {p.label}
                </span>
              ))}
            </nav>
          ) : (
            <span className="kicker hidden lg:block" style={{ color: "#9c8a64" }}>
              On-Chain · Mantle Sepolia
            </span>
          )}
          <ConnectWalletButton />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-24 pt-8 sm:px-6">
        {/* breadcrumb when inside an event */}
        {eventId > 0 && (
          <div className="mb-4 flex items-center gap-3">
            <button
              type="button"
              onClick={() => { setEventId(0); setRecord(null); setSelectedWord(null); }}
              className="kicker hover:text-cream/80 transition-colors"
            >
              ← All Events
            </button>
            <span className="kicker text-cream/20">|</span>
            <span className="kicker">Event #{eventId}</span>
            <span className="kicker rounded bg-black/30 px-2 py-1">
              {contractPhase}
            </span>
          </div>
        )}

        {!isConnected && (
          <div className="mx-auto max-w-md ornate-frame p-8 text-center mb-8">
            <p className="h-display text-2xl mb-2">Connect your wallet</p>
            <p className="body-copy text-base mb-6">
              You need a wallet on Mantle Sepolia to participate on-chain. Switch to demo mode to explore without a wallet.
            </p>
            <div className="flex justify-center">
              <ConnectWalletButton />
            </div>
            <div className="mt-4">
              <Link href="/play" className="text-xs text-cream/40 hover:text-cream/70 underline transition">
                ← Back to demo
              </Link>
            </div>
          </div>
        )}

        {/* ═══ LOBBY (no event selected) ═══ */}
        {isConnected && eventId === 0 && (
          <div className="mx-auto max-w-2xl">
            <div className="mb-6 text-center">
              <p className="kicker mb-1">On-Chain · Mantle Sepolia</p>
              <h1 className="h-display text-3xl sm:text-4xl">
                Live <span className="gold">Events</span>
              </h1>
              <p className="body-copy mt-2 text-sm">
                Select an event to view its phase and participate.
              </p>
            </div>
            {totalEvents === 0 ? (
              <div className="ornate-frame p-8 text-center">
                <p className="body-copy text-sm text-cream/50">No events on-chain yet.</p>
                <button type="button" className="btn btn-ghost mt-4" onClick={() => refetchEventCount()}>Refresh</button>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {Array.from({ length: totalEvents }, (_, i) => {
                  const id = i + 1;
                  const phaseNum = lobbyPhases?.[i]?.result !== undefined ? Number(lobbyPhases[i].result) : undefined;
                  const phaseName = phaseNum !== undefined ? PHASES[phaseNum] : "…";
                  const ui = contractToUi(phaseName);
                  const stepIdx = PHASE_STEPS.findIndex((p) => p.key === ui);
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => { setEventId(id); setSelectedWord(null); }}
                      style={{
                        textAlign: "left",
                        background: "linear-gradient(160deg, #1a1005 0%, #0e0a04 100%)",
                        border: "1px solid rgba(217,164,65,0.3)",
                        borderRadius: 6,
                        padding: "1rem 1.2rem",
                        cursor: "pointer",
                        transition: "border-color 0.2s, box-shadow 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(217,164,65,0.65)";
                        (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 16px rgba(217,164,65,0.12)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(217,164,65,0.3)";
                        (e.currentTarget as HTMLButtonElement).style.boxShadow = "";
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.6rem" }}>
                        <span className="kicker" style={{ color: "#e9b95c" }}>Event #{id}</span>
                        <span className="kicker" style={{
                          background: ui === "settled" ? "rgba(43,100,90,0.3)" : "rgba(43,227,212,0.08)",
                          color: ui === "settled" ? "#2be3d4" : "#9c8a64",
                          border: "1px solid rgba(43,227,212,0.2)",
                          borderRadius: 3,
                          padding: "0.1rem 0.5rem",
                          fontSize: "0.58rem",
                        }}>
                          {phaseName}
                        </span>
                      </div>
                      <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
                        {PHASE_STEPS.map((p, pi) => (
                          <div key={p.key} style={{
                            flex: 1,
                            height: 3,
                            borderRadius: 2,
                            background: pi < stepIdx ? "#2be3d4" : pi === stepIdx ? "#e9b95c" : "rgba(255,255,255,0.08)",
                          }} />
                        ))}
                      </div>
                      <p style={{ fontSize: "0.6rem", color: "rgba(205,187,150,0.4)", marginTop: "0.5rem", fontFamily: "var(--font-ui)", letterSpacing: "0.05em" }}>
                        {PHASE_STEPS[stepIdx]?.label ?? "—"} phase · tap to enter →
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
            <div className="mt-6 text-center">
              <Link href="/play" className="text-xs text-cream/30 hover:text-cream/60 underline transition">
                ← Try demo mode
              </Link>
            </div>
          </div>
        )}

        {/* ═══ EVENT (None / default) ═══ */}
        {isConnected && eventId > 0 && uiPhase === "event" && (
          <div className="mx-auto max-w-xl ornate-frame p-6 sm:p-8">
            <p className="kicker text-center mb-2">On-Chain · Mantle Sepolia</p>
            <h1 className="h-display text-center text-3xl sm:text-4xl mb-6">
              {record?.theme ?? "Bingocle Live"}
            </h1>
            <dl className="space-y-2 border-t border-gold/15 pt-5">
              {[
                ["Event ID", `#${eventId}`],
                ["Phase", contractPhase],
                ["Words in pool", String(wordCount)],
                ["Network", "Mantle Sepolia"],
              ].map(([k, v]) => (
                <div key={k} className="stat-row"><dt>{k}</dt><dd>{v}</dd></div>
              ))}
            </dl>
            <p className="body-copy mt-5 text-center text-sm italic">
              Playing as{" "}
              <span className="text-gold-bright">
                {address?.slice(0, 6)}…{address?.slice(-4)}
              </span>
            </p>
            <p className="text-xs text-cream/30 mt-3 text-center">
              Waiting for event to enter Submission phase · refresh to check
            </p>
            <div className="mt-6 text-center">
              <button type="button" className="btn btn-ghost" onClick={() => refetchAll()}>
                Refresh
              </button>
            </div>
          </div>
        )}

        {/* ═══ WORDS (Submission phase) ═══ */}
        {isConnected && eventId > 0 && uiPhase === "words" && (
          <div className="mx-auto max-w-xl space-y-5">
            <div className="ornate-frame p-6 sm:p-8">
              <h1 className="h-display text-center text-3xl sm:text-4xl">
                Submit your <span className="gold">words</span>
              </h1>
              <p className="body-copy mt-4 text-center text-base">
                Predict words the speaker will say. Submitting a new word makes
                you its <strong className="text-gold-bright">Word Founder</strong> — you receive a free seed position when the card assembles.
              </p>
              <div className="mt-6 flex gap-3">
                <input
                  className="input-dark flex-1"
                  placeholder="e.g. Liquidity"
                  value={wordInput}
                  maxLength={32}
                  disabled={submitting || committed}
                  onChange={(e) => setWordInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submitWordToAgent()}
                  aria-label="Word to submit"
                />
                <button
                  type="button"
                  className="btn btn-gold px-5"
                  onClick={submitWordToAgent}
                  disabled={submitting || !wordInput.trim() || committed}
                >
                  {submitting ? "…" : "Submit"}
                </button>
              </div>
              {submitMsg && (
                <p className={`mt-3 text-sm ${submitMsg.includes("✓") ? "text-teal-400" : "text-amber-400"}`}>
                  {submitMsg}
                </p>
              )}
              {committed && (
                <p className="mt-3 text-sm text-amber-400">
                  Word pool committed — submission closed.
                </p>
              )}
            </div>

            {/* Pool preview */}
            {wordCount > 0 && (
              <div className="ornate-frame p-5">
                <p className="kicker mb-3">Current pool — {wordCount} words</p>
                <div className="flex flex-wrap gap-1.5">
                  {Array.from({ length: wordCount }, (_, w) => (
                    <span key={w} className="rounded border border-gold/20 bg-black/20 px-2 py-0.5 text-xs text-cream/70">
                      {wordLabel(w)}
                      <span className="ml-1 text-cream/30">{wordProb(w)}%</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="text-center">
              <p className="text-xs text-cream/30 mb-3">
                Waiting for organizer to close submissions and trigger AI curation.
              </p>
              <button type="button" className="btn btn-ghost" onClick={() => refetchAll()}>
                Refresh Phase
              </button>
            </div>
          </div>
        )}

        {/* ═══ CURATE (Founder phase — AI assembling card) ═══ */}
        {isConnected && eventId > 0 && uiPhase === "curate" && (
          <div className="mx-auto max-w-2xl ornate-frame p-6 sm:p-8">
            <p className="kicker text-center mb-2">AI Oracle is working</p>
            <h1 className="h-display text-center text-3xl sm:text-4xl mb-6">
              Assembling <span className="gold">Bingo Card</span>
            </h1>

            {!hasCard ? (
              <div className="text-center space-y-4">
                <p className="body-copy text-base">
                  The AI has curated the word pool. Mint your personal bingo card NFT to lock in your tile layout.
                </p>
                <button
                  type="button"
                  className="btn btn-gold"
                  onClick={mintCard}
                  disabled={!!busy}
                >
                  {busy === "mint" ? "Minting…" : "Mint Bingo Card NFT"}
                </button>
                <p className="text-xs text-cream/30">
                  Token ID is assigned on-chain · tile order randomised from your address
                </p>
              </div>
            ) : cells ? (
              <>
                <p className="kicker text-center mb-4">Your card — token #{tokenId?.toString()}</p>
                <div className="bingo-board">
                  {(cells as number[]).map((cellWordIdx, i) => {
                    const free = cellWordIdx === FREE_IDX;
                    return (
                      <div key={i} className={`bingo-tile ${free ? "free" : ""}`}>
                        {free ? "★" : wordLabel(cellWordIdx)}
                      </div>
                    );
                  })}
                </div>
                <div className="mt-6 text-center">
                  <p className="body-copy text-sm italic mb-4">
                    Market opens when the Founder phase ends.
                  </p>
                  <button type="button" className="btn btn-ghost" onClick={() => refetchAll()}>
                    Refresh Phase
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center">
                <p className="body-copy text-base animate-pulse">Loading card…</p>
              </div>
            )}
          </div>
        )}

        {/* ═══ MARKET (Market phase) ═══ */}
        {isConnected && eventId > 0 && uiPhase === "market" && (
          <div className="grid items-start gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            {/* Left: bingo card */}
            <div className="ornate-frame">
              <div className="frame-screen board-scene px-2 pb-4 pt-4 sm:px-4 sm:pb-5">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <span className="hud-plate">
                    <span className="dot gold" />
                    {address?.slice(0, 6)}…{address?.slice(-4)}
                  </span>
                  <span className="hud-plate">
                    <span className="dot gold" />
                    Market Open · Trade to Win
                  </span>
                </div>
                {cells ? (
                  <div className="bingo-board">
                    {(cells as number[]).map((cellWordIdx, i) => {
                      const free = cellWordIdx === FREE_IDX;
                      const hasPos = mySharesNum(cellWordIdx) > 0;
                      return (
                        <button
                          key={i}
                          type="button"
                          className={`bingo-tile ${free ? "free" : ""} ${selectedWord === cellWordIdx ? "sel" : ""}`}
                          onClick={() => !free && setSelectedWord(cellWordIdx)}
                          disabled={free}
                        >
                          {free ? "★" : wordLabel(cellWordIdx)}
                          {hasPos && !free && (
                            <span className="owned-chip">{fmt(mySharesNum(cellWordIdx), 2)}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="body-copy text-base mb-4">No card yet — mint one first.</p>
                    <button type="button" className="btn btn-gold" onClick={mintCard} disabled={!!busy}>
                      {busy === "mint" ? "Minting…" : "Mint Card"}
                    </button>
                  </div>
                )}
                <p className="kicker mt-3 text-center">Tap a tile to trade</p>
              </div>
            </div>

            {/* Right: market panel */}
            <div className="game-panel">
              <div className="flex items-center justify-between gap-2 mb-3">
                <h2 className="step-title text-sm">Word Market — Live Prices</h2>
              </div>

              {selectedWord !== null ? (
                <div>
                  <button
                    type="button"
                    className="text-xs text-cream/30 hover:text-cream/60 underline block mb-3"
                    onClick={() => setSelectedWord(null)}
                  >
                    ← All words
                  </button>
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="h-display text-2xl">{wordLabel(selectedWord)}</span>
                  </div>
                  <div className="mb-4 rounded-lg border border-gold/10 bg-black/20 p-2">
                    <PriceChart
                      history={(priceHistory[selectedWord] ?? []).slice(-30)}
                      height={120}
                      compact={false}
                    />
                  </div>
                  <div className="space-y-2 mb-4">
                    {[
                      ["Price", `${fmt(spotEth(selectedWord))} MNT/sh`],
                      ["AI probability", `${wordProb(selectedWord)}%`],
                      ["Multiplier", `${wordMult(selectedWord)}×`],
                      ["Your shares", `${fmt(mySharesNum(selectedWord), 4)} sh`],
                    ].map(([k, v]) => (
                      <div key={k} className="stat-row"><dt>{k}</dt><dd>{v}</dd></div>
                    ))}
                  </div>
                  <div className="flex gap-2 items-center mb-3">
                    <label className="kicker text-[10px]">Amount (MNT)</label>
                    <input
                      type="number" step="0.001" min="0.001"
                      className="input-dark flex-1 text-sm text-center py-1"
                      value={buyAmount}
                      onChange={(e) => setBuyAmount(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button" className="btn btn-mini-gold"
                      onClick={() => buy(selectedWord)}
                      disabled={!!busy || !isConnected}
                    >
                      {busy === "buy" ? "…" : "Buy"}
                    </button>
                    {mySharesNum(selectedWord) > 0 && (
                      <button
                        type="button" className="btn btn-blood"
                        style={{ fontSize: "0.62rem" }}
                        onClick={() => {
                          const r = myShares?.[selectedWord]?.result;
                          if (r) sell(selectedWord, r as bigint);
                        }}
                        disabled={!!busy || !isConnected}
                      >
                        {busy === "sell" ? "…" : "Sell All"}
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <p className="body-copy text-sm mb-3">
                    Prices move via bonding curve. Buy words you predict the speaker will say.
                  </p>
                  <div className="space-y-1.5 overflow-y-auto pr-1" style={{ maxHeight: 340 }}>
                    {Array.from({ length: wordCount }, (_, w) => {
                      const cur = spotEth(w);
                      const hist = priceHistory[w] ?? [];
                      const startP = hist[0]?.price ?? cur;
                      const pct = startP > 0 ? ((cur - startP) / startP) * 100 : 0;
                      const isUp = cur >= startP;
                      return (
                        <button
                          key={w}
                          type="button"
                          onClick={() => setSelectedWord(w)}
                          className="w-full rounded-lg border border-gold/10 bg-black/20 px-3 py-2 hover:border-gold/35 transition text-left"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-cream truncate">{wordLabel(w)}</span>
                            <div className="text-right shrink-0 ml-2">
                              <span className="text-xs font-bold" style={{ color: isUp ? "#2be3d4" : "#e07a4a" }}>
                                {fmt(cur)} MNT
                              </span>
                              <span className="text-[9px] ml-1" style={{ color: isUp ? "#2be3d4" : "#e07a4a" }}>
                                {isUp ? "+" : ""}{pct.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                          <PriceChart history={hist.slice(-20)} height={28} compact />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="mt-5 border-t border-gold/15 pt-4 space-y-1.5">
                <div className="stat-row"><dt>Redeemable</dt><dd>{redeemable ? `${fmt(+formatEther(redeemable as bigint))} MNT` : "—"}</dd></div>
              </div>
              <p className="text-xs text-cream/30 mt-3 text-center">
                Organizer locks the market when the event starts.
              </p>
            </div>
          </div>
        )}

        {/* ═══ LIVE (Live phase) ═══ */}
        {isConnected && eventId > 0 && uiPhase === "live" && (
          <div className="grid items-start gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            {/* Left: card */}
            <div className="ornate-frame">
              <div className="frame-screen board-scene px-2 pb-4 pt-4 sm:px-4 sm:pb-5">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <span className="hud-plate">
                    <span className="dot gold" />
                    {address?.slice(0, 6)}…{address?.slice(-4)}
                  </span>
                  <span className="hud-plate">
                    <span className="dot live" />
                    Oracle · Listening
                  </span>
                </div>
                {cells ? (
                  <div className="bingo-board">
                    {(cells as number[]).map((cellWordIdx, i) => {
                      const free = cellWordIdx === FREE_IDX;
                      const hit = !free && isMarked(i);
                      return (
                        <div key={i} className={`bingo-tile ${free ? "free" : ""} ${hit ? "hit" : ""}`}>
                          {free ? "★" : wordLabel(cellWordIdx)}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="body-copy text-base mb-4">No card — you can still watch.</p>
                  </div>
                )}
                <p className="kicker mt-3 text-center">Tiles light up as oracle validates words</p>
              </div>
            </div>

            {/* Right: oracle panel */}
            <div className="game-panel">
              <div className="flex items-center justify-between gap-2 mb-4">
                <h2 className="step-title text-sm">AI Oracle — Live</h2>
                <button type="button" className="btn btn-ghost py-1 text-xs" onClick={() => refetchAll()}>
                  Refresh
                </button>
              </div>
              <div
                className="rounded-lg border px-4 py-3 mb-4"
                style={{ borderColor: "rgba(43,227,212,0.2)", background: "rgba(0,30,27,0.3)" }}
              >
                <p className="step-title text-xs mb-2" style={{ color: "#2be3d4" }}>Oracle Status</p>
                <p className="body-copy text-sm">
                  Whisper STT is transcribing the event audio. Oracle verdicts are written on-chain by the AI agent identity.
                  Validated words mark your card automatically.
                </p>
              </div>
              {cells && (
                <div>
                  <p className="kicker mb-2">Validated so far</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(cells as number[]).map((cellWordIdx, i) => {
                      if (cellWordIdx === FREE_IDX) return null;
                      const hit = isMarked(i);
                      if (!hit) return null;
                      return (
                        <span key={i} className="rounded border border-teal-700/50 bg-teal-950/30 px-2 py-0.5 text-xs text-teal-300">
                          {wordLabel(cellWordIdx)} ✓
                        </span>
                      );
                    })}
                    {!cells.some((_, i) => isMarked(i)) && (
                      <p className="text-xs text-cream/30 animate-pulse">Waiting for first oracle validation…</p>
                    )}
                  </div>
                </div>
              )}
              <p className="text-xs text-cream/30 mt-6">
                Event ends when the organizer closes it on-chain. Dispute period follows.
              </p>
            </div>
          </div>
        )}

        {/* ═══ SETTLED (Dispute / Settled phase) ═══ */}
        {isConnected && eventId > 0 && uiPhase === "settled" && (
          <div className="mx-auto max-w-xl space-y-5">
            <div className="ornate-frame p-6 sm:p-8">
              <p className="kicker text-center mb-2">
                {contractPhase === "Dispute" ? "Dispute Period" : "Event Settled"}
              </p>
              <h1 className="h-display text-center text-3xl sm:text-4xl mb-6">
                Claim <span className="gold">Rewards</span>
              </h1>

              {cells && (
                <div className="mb-6">
                  <p className="kicker mb-3">Final Card</p>
                  <div className="bingo-board">
                    {(cells as number[]).map((cellWordIdx, i) => {
                      const free = cellWordIdx === FREE_IDX;
                      const hit = !free && isMarked(i);
                      return (
                        <div key={i} className={`bingo-tile ${free ? "free" : ""} ${hit ? "hit" : ""}`}>
                          {free ? "★" : wordLabel(cellWordIdx)}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="space-y-2 mb-6">
                <div className="stat-row">
                  <dt>Redeemable from word stakes</dt>
                  <dd className="text-teal-glow">
                    {redeemable ? `${fmt(+formatEther(redeemable as bigint))} MNT` : "—"}
                  </dd>
                </div>
              </div>

              <button
                type="button"
                className="btn btn-gold w-full"
                onClick={claim}
                disabled={!!busy || contractPhase === "Dispute"}
              >
                {busy === "claim" ? "Claiming…" : contractPhase === "Dispute" ? "Dispute period — wait to claim" : "Claim Rewards"}
              </button>

              {contractPhase === "Dispute" && (
                <p className="text-xs text-amber-400/70 mt-3 text-center">
                  Dispute period active. Claims open after it ends.
                </p>
              )}

              <div
                className="mt-5 rounded-lg border px-4 py-3"
                style={{ borderColor: "rgba(217,164,65,0.2)", background: "rgba(0,0,0,0.3)" }}
              >
                <p className="step-title text-xs mb-2" style={{ color: "#e8c66b" }}>✦ Trustless by Design</p>
                <p className="step-desc text-xs leading-relaxed mb-2">
                  Oracle verdicts are committed on-chain — no admin override possible after event start.
                  Stakes on unspoken words are forfeited into the prize pool and paid out to correct predictors.
                </p>
                <p className="step-desc text-xs leading-relaxed">
                  <strong style={{ color: "#cdbb96" }}>AI risk:</strong>{" "}
                  Whisper may miss words in poor audio. Resolution sources are agreed on-chain before any stake is placed.
                </p>
              </div>
            </div>

            <div className="text-center">
              <Link href="/" className="btn btn-ghost">← Back Home</Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
