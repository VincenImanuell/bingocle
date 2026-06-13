"use client";

import { useEffect, useMemo, useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useReadContract, useReadContracts, useWriteContract } from "wagmi";
import { useWaitForTransactionReceipt } from "wagmi";
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

const FREE = 255;

type PanelMode = "buy" | "sell";

interface PositionPanelProps {
  word: string;
  mode: PanelMode;
  onModeChange: (m: PanelMode) => void;
  shares: string;
  onSharesChange: (v: string) => void;
  price: bigint | undefined;
  myShares: bigint | undefined;
  prob: number;
  mult: number;
  busy: string | null;
  tradingOpen: boolean;
  isConnected: boolean;
  onBuy: () => void;
  onSell: () => void;
  onClose: () => void;
}

function PositionPanel({
  word, mode, onModeChange, shares, onSharesChange,
  price, myShares, prob, mult,
  busy, tradingOpen, isConnected, onBuy, onSell, onClose,
}: PositionPanelProps) {
  const priceEth = price ? +formatEther(price) : 0;
  const sharesNum = parseFloat(shares) || 0;
  const totalCost = priceEth * sharesNum;
  const hasPosition = myShares && myShares > BigInt(0);
  const mySharesNum = myShares ? +formatEther(myShares) : 0;
  const myValue = mySharesNum * priceEth;

  return (
    <div className="mx-4 mb-3 rounded-lg border border-[#d9a44159] bg-[#1a1410] p-4 text-sm">
      <div className="mb-3 flex items-center justify-between">
        <span className="font-semibold text-[#e8c66b]">{word}</span>
        <button onClick={onClose} className="text-xs opacity-40 hover:opacity-80">✕</button>
      </div>

      {/* Buy / Sell toggle */}
      <div className="mb-4 flex rounded-lg overflow-hidden border border-[#d9a44126]">
        <button
          onClick={() => onModeChange("buy")}
          className={`flex-1 py-2 text-xs font-bold transition ${
            mode === "buy"
              ? "bg-[#1a4d3f] text-[#4ecca3]"
              : "bg-[#16120d] text-[#f5e6c8] opacity-40 hover:opacity-70"
          }`}
        >
          Buy
        </button>
        <button
          onClick={() => onModeChange("sell")}
          disabled={!hasPosition}
          className={`flex-1 py-2 text-xs font-bold transition ${
            mode === "sell"
              ? "bg-[#3d1f10] text-[#e07a4a]"
              : "bg-[#16120d] text-[#f5e6c8] opacity-40 hover:opacity-70"
          } disabled:opacity-20`}
        >
          Sell
        </button>
      </div>

      {/* shares input */}
      <div className="mb-3 flex items-center gap-3">
        <label className="shrink-0 text-xs opacity-60">Shares</label>
        <input
          type="number"
          min={1}
          step="1"
          value={shares}
          onChange={(e) => onSharesChange(e.target.value)}
          className="w-full rounded border border-[#d9a44159] bg-[#16120d] px-3 py-2 text-sm text-center"
        />
      </div>

      {/* stats grid */}
      <div className="mb-4 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded bg-[#16120d] p-2.5">
          <div className="mb-0.5 opacity-50">Spot price</div>
          <div className="font-semibold">{priceEth > 0 ? `${priceEth.toFixed(5)} MNT/sh` : "—"}</div>
        </div>
        <div className="rounded bg-[#16120d] p-2.5">
          <div className="mb-0.5 opacity-50">{mode === "buy" ? "Est. cost" : "Est. refund"}</div>
          <div className="font-semibold">{totalCost > 0 ? `~${totalCost.toFixed(4)} MNT` : "—"}</div>
        </div>
        {mult > 0 && (
          <div className="rounded bg-[#16120d] p-2.5">
            <div className="mb-0.5 opacity-50">Payout mult</div>
            <div className="font-semibold text-[#e8c66b]">{(mult / 10000).toFixed(2)}×</div>
          </div>
        )}
        {hasPosition && (
          <div className="rounded bg-[#16120d] p-2.5">
            <div className="mb-0.5 opacity-50">Your position</div>
            <div className="font-semibold text-teal-300">
              {mySharesNum.toFixed(2)} sh · ~{myValue.toFixed(4)} MNT
            </div>
          </div>
        )}
      </div>

      {/* action button */}
      {mode === "buy" ? (
        <button
          disabled={!isConnected || !tradingOpen || !!busy || sharesNum <= 0}
          onClick={onBuy}
          className="w-full rounded py-3 text-sm font-bold bg-[#1a4d3f] text-[#4ecca3] border border-[#2f7d6b] hover:bg-[#2f7d6b] hover:text-white disabled:opacity-30 transition"
        >
          {busy === "buy" ? "⏳ confirming…" : `Buy ${sharesNum} shares`}
        </button>
      ) : (
        <button
          disabled={!isConnected || !tradingOpen || !!busy || !hasPosition || sharesNum <= 0}
          onClick={onSell}
          className="w-full rounded py-3 text-sm font-bold bg-[#3d1f10] text-[#e07a4a] border border-[#7d4a2f] hover:bg-[#7d4a2f] hover:text-white disabled:opacity-30 transition"
        >
          {busy === "sell" ? "⏳ confirming…" : `Sell ${sharesNum} shares`}
        </button>
      )}

      {!tradingOpen && (
        <p className="mt-2 text-center text-xs opacity-40">Trading opens in Founder &amp; Market phases.</p>
      )}
      {!isConnected && (
        <p className="mt-2 text-center text-xs opacity-40">Connect wallet to trade.</p>
      )}
    </div>
  );
}

export default function OnchainGame() {
  const { address, isConnected } = useAccount();
  const [eventId, setEventId] = useState(1);
  const [record, setRecord] = useState<EventRecord | null>(null);
  const [shares, setShares] = useState("10");
  const [busy, setBusy] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const [activeWord, setActiveWord] = useState<number | null>(null);
  const [panelMode, setPanelMode] = useState<PanelMode>("buy");

  const { isLoading: txPending } = useWaitForTransactionReceipt({ hash: txHash });
  const { writeContractAsync } = useWriteContract();

  useEffect(() => {
    fetchEventRecord(eventId).then(setRecord);
  }, [eventId, txPending]);

  const { data: meta, refetch: refetchMeta } = useReadContracts({
    contracts: [
      { address: addresses.eventFactory, abi: eventFactoryAbi, functionName: "phaseOf", args: [BigInt(eventId)] },
      { address: addresses.wordPool, abi: wordPoolAbi, functionName: "wordCount", args: [BigInt(eventId)] },
      { address: addresses.wordPool, abi: wordPoolAbi, functionName: "isCommitted", args: [BigInt(eventId)] },
    ],
  });
  const phase = meta?.[0]?.result !== undefined ? PHASES[Number(meta[0].result)] : "…";
  const wordCount = meta?.[1]?.result ? Number(meta[1].result) : record?.words.length ?? 0;
  const committed = Boolean(meta?.[2]?.result);

  const priceCalls = useMemo(
    () =>
      Array.from({ length: wordCount }, (_, w) => ({
        address: addresses.wordMarket,
        abi: wordMarketAbi,
        functionName: "spotPrice" as const,
        args: [BigInt(eventId), BigInt(w)] as const,
      })),
    [wordCount, eventId],
  );
  const shareCalls = useMemo(
    () =>
      address
        ? Array.from({ length: wordCount }, (_, w) => ({
            address: addresses.wordMarket,
            abi: wordMarketAbi,
            functionName: "sharesOf" as const,
            args: [BigInt(eventId), BigInt(w), address] as const,
          }))
        : [],
    [wordCount, eventId, address],
  );
  const { data: prices, refetch: refetchPrices } = useReadContracts({ contracts: priceCalls });
  const { data: myShares, refetch: refetchShares } = useReadContracts({ contracts: shareCalls });

  const { data: card, refetch: refetchCard } = useReadContracts({
    contracts: address
      ? [
          { address: addresses.bingoCardNFT, abi: bingoCardAbi, functionName: "hasCard", args: [BigInt(eventId), address] },
          { address: addresses.bingoCardNFT, abi: bingoCardAbi, functionName: "cardOf", args: [BigInt(eventId), address] },
        ]
      : [],
  });
  const hasCard = Boolean(card?.[0]?.result);
  const tokenId = card?.[1]?.result as bigint | undefined;
  const { data: cardView, refetch: refetchCardView } = useReadContracts({
    contracts:
      hasCard && tokenId
        ? [
            { address: addresses.bingoCardNFT, abi: bingoCardAbi, functionName: "cardCells", args: [tokenId] },
            { address: addresses.bingoCardNFT, abi: bingoCardAbi, functionName: "markedMask", args: [tokenId] },
          ]
        : [],
  });
  const cells = cardView?.[0]?.result as readonly number[] | undefined;
  const marked = cardView?.[1]?.result ? Number(cardView[1].result) : 0;

  const { data: redeemable } = useReadContract({
    address: addresses.wordMarket,
    abi: wordMarketAbi,
    functionName: "previewRedeem",
    args: address ? [BigInt(eventId), address] : undefined,
    query: { enabled: Boolean(address) },
  });

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

  const tradingOpen = phase === "Founder" || phase === "Market";
  const sharesWei = (() => {
    try {
      return parseEther(shares || "0");
    } catch {
      return BigInt(0);
    }
  })();

  const buy = (w: number) =>
    run("buy", async () => {
      const cost = await readQuote("quoteBuy", w, sharesWei);
      return writeContractAsync({
        address: addresses.wordMarket,
        abi: wordMarketAbi,
        functionName: "buy",
        args: [BigInt(eventId), BigInt(w), sharesWei, cost],
        value: cost,
      });
    });

  const sell = (w: number) =>
    run("sell", async () =>
      writeContractAsync({
        address: addresses.wordMarket,
        abi: wordMarketAbi,
        functionName: "sell",
        args: [BigInt(eventId), BigInt(w), sharesWei, BigInt(0)],
      }),
    );

  const mint = () =>
    run("mint", async () =>
      writeContractAsync({ address: addresses.bingoCardNFT, abi: bingoCardAbi, functionName: "mint", args: [BigInt(eventId)] }),
    );

  const claim = () =>
    run("claim", async () => {
      await writeContractAsync({ address: addresses.wordMarket, abi: wordMarketAbi, functionName: "redeem", args: [BigInt(eventId)] }).catch(() => {});
      return writeContractAsync({ address: addresses.rewardVault, abi: rewardVaultAbi, functionName: "claim", args: [BigInt(eventId)] });
    });

  async function readQuote(fn: "quoteBuy" | "quoteSell", word: number, amount: bigint): Promise<bigint> {
    return readContract(wagmiConfig, {
      address: addresses.wordMarket,
      abi: wordMarketAbi,
      functionName: fn,
      args: [BigInt(eventId), BigInt(word), amount],
    });
  }

  const label = (w: number) => record?.words[w] ?? `#${w}`;

  // Probability that this word is said (0–100). From agent aiProb, else 50.
  const prob = (w: number): number => {
    const p = record?.odds[w]?.aiProb;
    return p !== undefined ? Math.round(p * 100) : 50;
  };
  const mult = (w: number): number => record?.odds[w]?.mult1e4 ?? 0;

  function openPanel(w: number, mode: PanelMode = "buy") {
    if (activeWord === w && panelMode === mode) {
      setActiveWord(null);
    } else {
      setActiveWord(w);
      setPanelMode(mode);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 text-[#f5e6c8]">
      {/* header */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="font-serif text-2xl text-[#e8c66b]">Bingocle — Live Market</h1>
        <ConnectButton />
      </div>

      {/* event selector + status bar */}
      <div className="mb-6 flex flex-wrap items-center gap-3 text-sm">
        <label className="opacity-80">Event</label>
        <input
          type="number"
          min={1}
          value={eventId}
          onChange={(e) => { setEventId(Math.max(1, Number(e.target.value))); setActiveWord(null); }}
          className="w-20 rounded border border-[#d9a44159] bg-[#1a1410] px-2 py-1"
        />
        <span className="rounded bg-[#2a2118] px-2 py-1">
          Phase: <b className="text-[#e8c66b]">{phase}</b>
        </span>
        {record && <span className="opacity-70">{record.theme}</span>}
        {!committed && <span className="text-amber-400">pool not committed yet</span>}
        {(busy || txPending) && <span className="text-teal-300">⏳ {busy ?? "confirming"}…</span>}
      </div>

      {/* ── Word Market (Polymarket-style) ── */}
      <div className="rounded-lg border border-[#d9a44126] bg-[#16120d] overflow-hidden">
        {/* column header */}
        <div className="grid grid-cols-[1fr_110px_100px_auto] items-center gap-x-3 border-b border-[#d9a44126] px-4 py-2.5 text-xs font-semibold opacity-50">
          <span>Word</span>
          <span>Probability</span>
          <span>Price / share</span>
          <span>Position</span>
        </div>

        {/* rows */}
        {Array.from({ length: wordCount }, (_, w) => {
          const price = prices?.[w]?.result as bigint | undefined;
          const sh = myShares?.[w]?.result as bigint | undefined;
          const hasPosition = sh && sh > BigInt(0);
          const p = prob(w);
          const isActive = activeWord === w;

          return (
            <div key={w} className="border-b border-[#d9a44126] last:border-0">
              {/* main row */}
              <div
                className={`grid grid-cols-[1fr_110px_100px_auto] items-center gap-x-3 px-4 py-3 cursor-pointer transition ${
                  isActive ? "bg-[#1e1810]" : "hover:bg-[#1a1610]"
                }`}
                onClick={() => openPanel(w)}
              >
                {/* word + position badge */}
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-medium truncate">{label(w)}</span>
                  {hasPosition && (
                    <span className="shrink-0 rounded-full bg-teal-900 px-1.5 py-0.5 text-[10px] font-semibold text-teal-300">
                      holding
                    </span>
                  )}
                </div>

                {/* probability bar */}
                <div className="flex items-center gap-2">
                  <div className="h-1.5 flex-1 rounded-full bg-[#2a2118] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#e8c66b] transition-all"
                      style={{ width: `${p}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-xs font-bold text-[#e8c66b]">{p}%</span>
                </div>

                {/* price */}
                <div className="text-sm opacity-80">
                  {price ? `${(+formatEther(price)).toFixed(4)} MNT` : "…"}
                </div>

                {/* position amount */}
                <div className="text-sm">
                  {hasPosition ? (
                    <span className="font-semibold text-teal-300">{(+formatEther(sh)).toFixed(2)} sh</span>
                  ) : (
                    <span className="opacity-25">—</span>
                  )}
                </div>
              </div>

              {/* action buttons (always visible, collapsed to icons) */}
              <div className="flex gap-2 border-t border-[#d9a44113] px-4 py-2">
                <button
                  disabled={!isConnected || !tradingOpen || !!busy}
                  onClick={(e) => { e.stopPropagation(); openPanel(w, "buy"); }}
                  className={`rounded px-3 py-1 text-xs font-semibold border transition ${
                    isActive && panelMode === "buy"
                      ? "bg-[#2f7d6b] text-white border-[#2f7d6b]"
                      : "bg-[#1a4d3f] text-[#4ecca3] border-[#2f7d6b] hover:bg-[#2f7d6b] hover:text-white"
                  } disabled:opacity-30`}
                >
                  Buy
                </button>
                <button
                  disabled={!isConnected || !tradingOpen || !!busy || !hasPosition}
                  onClick={(e) => { e.stopPropagation(); openPanel(w, "sell"); }}
                  className={`rounded px-3 py-1 text-xs font-semibold border transition ${
                    isActive && panelMode === "sell"
                      ? "bg-[#7d4a2f] text-white border-[#7d4a2f]"
                      : "bg-[#3d1f10] text-[#e07a4a] border-[#7d4a2f] hover:bg-[#7d4a2f] hover:text-white"
                  } disabled:opacity-30`}
                >
                  Sell
                </button>
                {mult(w) > 0 && (
                  <span className="ml-auto self-center text-xs opacity-40">
                    {(mult(w) / 10000).toFixed(2)}× payout
                  </span>
                )}
              </div>

              {/* inline order panel */}
              {isActive && (
                <PositionPanel
                  word={label(w)}
                  mode={panelMode}
                  onModeChange={setPanelMode}
                  shares={shares}
                  onSharesChange={setShares}
                  price={price}
                  myShares={sh}
                  prob={p}
                  mult={mult(w)}
                  busy={busy}
                  tradingOpen={tradingOpen}
                  isConnected={isConnected}
                  onBuy={() => buy(w)}
                  onSell={() => sell(w)}
                  onClose={() => setActiveWord(null)}
                />
              )}
            </div>
          );
        })}

        {!tradingOpen && wordCount > 0 && (
          <div className="px-4 py-3 text-xs opacity-50 text-center">
            Trading opens in Founder &amp; Market phases.
          </div>
        )}
        {wordCount === 0 && (
          <div className="px-4 py-6 text-sm opacity-50 text-center">No words committed yet.</div>
        )}
      </div>

      {/* bingo card */}
      <div className="mt-6 rounded-lg border border-[#d9a44126] bg-[#16120d] p-4">
        <div className="mb-3 flex items-center justify-between">
          <b className="text-[#e8c66b]">Your bingo card</b>
          {isConnected && !hasCard && committed && (
            <button
              onClick={mint}
              disabled={!!busy}
              className="rounded bg-[#2f7d6b] px-3 py-1 text-sm text-white disabled:opacity-40"
            >
              Mint card
            </button>
          )}
        </div>
        {hasCard && cells ? (
          <div className="grid grid-cols-5 gap-1">
            {cells.map((c, i) => {
              const hit = (marked >> i) & 1;
              const text = c === FREE ? "★" : label(c).slice(0, 7);
              return (
                <div
                  key={i}
                  className={`flex aspect-square cursor-pointer items-center justify-center rounded text-center text-[10px] transition ${
                    hit ? "bg-[#2f7d6b] text-white" : "bg-[#221a12] text-[#cdbb96] hover:bg-[#2a2118]"
                  }`}
                  onClick={() => c !== FREE && openPanel(c, "buy")}
                  title={c !== FREE ? `Trade "${label(c)}"` : "FREE"}
                >
                  {text}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm opacity-60">
            No card yet.{!committed && " Wait for pool to commit."}
          </p>
        )}
      </div>

      {/* settle & claim */}
      <div className="mt-6 rounded-lg border border-[#d9a44126] bg-[#16120d] p-4">
        <div className="flex items-center justify-between">
          <div>
            <b className="text-[#e8c66b]">Settle &amp; claim</b>
            <div className="text-xs opacity-70">
              redeemable:{" "}
              {redeemable ? `${(+formatEther(redeemable as bigint)).toFixed(3)} MNT` : "—"}
            </div>
          </div>
          <button
            disabled={!isConnected || phase !== "Settled" || !!busy}
            onClick={claim}
            className="rounded bg-[#d9a441] px-4 py-2 text-sm font-semibold text-[#2b1a05] disabled:opacity-40"
          >
            Claim winnings
          </button>
        </div>
      </div>

      <p className="mt-6 text-center text-xs opacity-50">
        On-chain on Mantle · AI-powered probability · trustless settlement
      </p>
    </div>
  );
}
