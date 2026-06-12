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

export default function OnchainGame() {
  const { address, isConnected } = useAccount();
  const [eventId, setEventId] = useState(1);
  const [record, setRecord] = useState<EventRecord | null>(null);
  const [selected, setSelected] = useState(0);
  const [shares, setShares] = useState("10");
  const [busy, setBusy] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();

  const { isLoading: txPending } = useWaitForTransactionReceipt({ hash: txHash });
  const { writeContractAsync } = useWriteContract();

  // word labels + odds from the agent service
  useEffect(() => {
    fetchEventRecord(eventId).then(setRecord);
  }, [eventId, txPending]);

  // phase + word count + commit status
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

  // per-word spot price + my shares (batched)
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

  // card
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

  // claim previews
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
      // surface contract reverts to the user
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

  const buy = () =>
    run("buy", async () => {
      const cost = await readQuote("quoteBuy", selected, sharesWei);
      return writeContractAsync({
        address: addresses.wordMarket,
        abi: wordMarketAbi,
        functionName: "buy",
        args: [BigInt(eventId), BigInt(selected), sharesWei, cost],
        value: cost,
      });
    });
  const sell = () =>
    run("sell", async () =>
      writeContractAsync({
        address: addresses.wordMarket,
        abi: wordMarketAbi,
        functionName: "sell",
        args: [BigInt(eventId), BigInt(selected), sharesWei, BigInt(0)],
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

  // read a buy/sell quote on demand (for the exact value to send)
  async function readQuote(fn: "quoteBuy" | "quoteSell", word: number, amount: bigint): Promise<bigint> {
    return readContract(wagmiConfig, {
      address: addresses.wordMarket,
      abi: wordMarketAbi,
      functionName: fn,
      args: [BigInt(eventId), BigInt(word), amount],
    });
  }

  const label = (w: number) => record?.words[w] ?? `#${w}`;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 text-[#f5e6c8]">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="font-serif text-2xl text-[#e8c66b]">Bingocle — Live Market</h1>
        <ConnectButton />
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3 text-sm">
        <label className="opacity-80">Event</label>
        <input
          type="number"
          min={1}
          value={eventId}
          onChange={(e) => setEventId(Math.max(1, Number(e.target.value)))}
          className="w-20 rounded border border-[#d9a44159] bg-[#1a1410] px-2 py-1"
        />
        <span className="rounded bg-[#2a2118] px-2 py-1">Phase: <b className="text-[#e8c66b]">{phase}</b></span>
        {record && <span className="opacity-70">{record.theme}</span>}
        {!committed && <span className="text-amber-400">pool not committed yet</span>}
        {(busy || txPending) && <span className="text-teal-300">⏳ {busy ?? "confirming"}…</span>}
      </div>

      {!isConnected && <p className="opacity-70">Connect a wallet on Mantle Sepolia to trade.</p>}

      {/* word market */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {Array.from({ length: wordCount }, (_, w) => {
          const price = prices?.[w]?.result as bigint | undefined;
          const sh = myShares?.[w]?.result as bigint | undefined;
          return (
            <button
              key={w}
              onClick={() => setSelected(w)}
              className={`rounded-lg border px-3 py-2 text-left transition ${
                selected === w ? "border-[#e8c66b] bg-[#2a2118]" : "border-[#d9a44126] bg-[#16120d] hover:border-[#d9a44159]"
              }`}
            >
              <div className="font-medium">{label(w)}</div>
              <div className="text-xs opacity-70">{price ? `${(+formatEther(price)).toFixed(3)} MNT/sh` : "…"}</div>
              {sh && sh > BigInt(0) && <div className="text-xs text-teal-300">you: {(+formatEther(sh)).toFixed(2)} sh</div>}
            </button>
          );
        })}
      </div>

      {/* trade panel */}
      <div className="mt-6 rounded-lg border border-[#d9a44126] bg-[#16120d] p-4">
        <div className="mb-3 flex items-center gap-2">
          <b className="text-[#e8c66b]">{label(selected)}</b>
          <input
            type="number"
            min={0}
            step="1"
            value={shares}
            onChange={(e) => setShares(e.target.value)}
            className="w-24 rounded border border-[#d9a44159] bg-[#1a1410] px-2 py-1 text-sm"
          />
          <span className="text-xs opacity-70">shares</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            disabled={!isConnected || !tradingOpen || !!busy}
            onClick={buy}
            className="rounded bg-[#2f7d6b] px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
          >
            Buy (price rises with demand)
          </button>
          <button
            disabled={!isConnected || !tradingOpen || !!busy}
            onClick={sell}
            className="rounded bg-[#7d4a2f] px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
          >
            Sell (take profit)
          </button>
        </div>
        {!tradingOpen && <p className="mt-2 text-xs opacity-60">Trading is open in the Founder &amp; Market phases.</p>}
      </div>

      {/* card */}
      <div className="mt-6 rounded-lg border border-[#d9a44126] bg-[#16120d] p-4">
        <div className="mb-3 flex items-center justify-between">
          <b className="text-[#e8c66b]">Your bingo card</b>
          {isConnected && !hasCard && committed && (
            <button onClick={mint} disabled={!!busy} className="rounded bg-[#2f7d6b] px-3 py-1 text-sm text-white disabled:opacity-40">
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
                  className={`flex aspect-square items-center justify-center rounded text-center text-[10px] ${
                    hit ? "bg-[#2f7d6b] text-white" : "bg-[#221a12] text-[#cdbb96]"
                  }`}
                >
                  {text}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm opacity-60">No card yet.</p>
        )}
      </div>

      {/* claim */}
      <div className="mt-6 rounded-lg border border-[#d9a44126] bg-[#16120d] p-4">
        <div className="flex items-center justify-between">
          <div>
            <b className="text-[#e8c66b]">Settle &amp; claim</b>
            <div className="text-xs opacity-70">
              redeemable now: {redeemable ? `${(+formatEther(redeemable as bigint)).toFixed(3)} MNT` : "—"}
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
        On-chain on Mantle. Word labels + odds via the Bingocle agent service.
      </p>
    </div>
  );
}
