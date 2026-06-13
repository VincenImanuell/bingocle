/**
 * Continuous trading bot — keeps bonding-curve prices fluctuating for a live demo.
 * Funds N throwaway wallets from the agent wallet once, then loops aggressive random
 * buys/sells concentrated on a few "hot" words so their prices swing visibly. Uses
 * separate player wallets (won't clash with your browser wallet). Testnet only.
 *
 *   EVENT_ID=3 PLAYERS=5 FUND_MNT=10 TICKS=120 TICK_MS=3000 HOT=6 \
 *     BUY_MIN=1.5 BUY_MAX=4 SELL_PROB=0.5 npx tsx scripts/trade-bot.ts
 */
import { ethers } from "ethers";
import { provider, signer } from "../src/chain.js";
import { config } from "../src/config.js";

const EID = Number(process.env.EVENT_ID ?? 0);
const N = Number(process.env.PLAYERS ?? 5);
const FUND = ethers.parseEther(process.env.FUND_MNT ?? "12");
const TICKS = Number(process.env.TICKS ?? 140);
const TICK_MS = Number(process.env.TICK_MS ?? 2500);
const HOT = Number(process.env.HOT ?? 5); // concentrate on the first HOT words for sharp swings
const BUY_MIN = Number(process.env.BUY_MIN ?? 2);
const BUY_MAX = Number(process.env.BUY_MAX ?? 6);
const SELL_PROB = Number(process.env.SELL_PROB ?? 0.5);
if (!EID) throw new Error("set EVENT_ID");

const MARKET_ABI = [
  "function quoteBuy(uint256,uint256,uint256) view returns (uint256)",
  "function buy(uint256,uint256,uint256,uint256) payable returns (uint256)",
  "function sell(uint256,uint256,uint256,uint256) returns (uint256)",
];
const POOL_ABI = ["function wordCount(uint256) view returns (uint256)"];
const FACTORY_ABI = ["function phaseOf(uint256) view returns (uint8)"];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const rnd = (n: number) => Math.floor(Math.random() * n);
const eth = (n: number) => ethers.parseEther(n.toFixed(2));

// Public RPC is flaky (ECONNRESET) — don't let a transient error crash the bot.
process.on("unhandledRejection", (e: any) => console.log("rpc hiccup:", e?.code ?? e?.message ?? e));
async function retry<T>(fn: () => Promise<T>, label: string, n = 4): Promise<T | null> {
  for (let k = 0; k < n; k++) {
    try {
      return await fn();
    } catch (e: any) {
      if (k === n - 1) { console.log(`${label} failed: ${e?.shortMessage ?? e?.message ?? e}`); return null; }
      await sleep(700 * (k + 1));
    }
  }
  return null;
}

type Player = { w: ethers.Wallet | ethers.HDNodeWallet; m: ethers.Contract; holds: Record<number, bigint> };

async function main() {
  const prov = provider();
  const funder = signer();
  const A = config.addresses;
  const nWords = Number(await new ethers.Contract(A.wordPool, POOL_ABI, prov).wordCount(EID));
  const factory = new ethers.Contract(A.eventFactory, FACTORY_ABI, prov);
  if (!nWords) throw new Error(`event ${EID} has no committed pool`);
  const hotN = Math.min(HOT, nWords);

  const players: Player[] = [];
  for (let i = 0; i < N; i++) {
    const w = ethers.Wallet.createRandom().connect(prov);
    const funded = await retry(() => funder.sendTransaction({ to: w.address, value: FUND }).then((tx) => tx.wait()), `fund ${i + 1}`);
    if (!funded) { console.log(`skip player ${i + 1} (fund failed)`); continue; }
    const m = new ethers.Contract(A.wordMarket, MARKET_ABI, w);
    const holds: Record<number, bigint> = {};
    const wi = rnd(hotN);
    const sh = eth(BUY_MIN + Math.random() * (BUY_MAX - BUY_MIN));
    try {
      const c: bigint = await m.quoteBuy(EID, wi, sh);
      await (await m.buy(EID, wi, sh, c, { value: c })).wait();
      holds[wi] = sh;
    } catch { /* seed optional */ }
    players.push({ w, m, holds });
    console.log(`funded+seeded player ${i + 1} ${w.address.slice(0, 8)}`);
  }

  console.log(`AGGRESSIVE trading: ${TICKS} ticks/${TICK_MS}ms · ${hotN} hot words · buy ${BUY_MIN}-${BUY_MAX} sh`);
  for (let t = 0; t < TICKS; t++) {
    const ph = await retry(() => factory.phaseOf(EID), "phase");
    if (ph !== null && Number(ph) !== 3) { console.log("not Market — stopping"); break; }
    const p = players[rnd(N)];
    const held = Object.entries(p.holds).filter(([, v]) => v > 0n);
    const doSell = held.length > 0 && Math.random() < SELL_PROB;
    try {
      if (doSell) {
        const [wiStr, amt] = held[rnd(held.length)];
        const wi = Number(wiStr);
        const want = eth(2 + Math.random() * 4); // big sells → sharp dips
        const sh = want < amt ? want : amt; // sell a chunk or all
        await (await p.m.sell(EID, wi, sh, 0n)).wait();
        p.holds[wi] = amt - sh;
        console.log(`t${t} SELL #${wi} x${ethers.formatEther(sh)} ${p.w.address.slice(0, 8)}`);
      } else {
        const wi = rnd(hotN);
        const sh = eth(BUY_MIN + Math.random() * (BUY_MAX - BUY_MIN));
        const c: bigint = await p.m.quoteBuy(EID, wi, sh);
        await (await p.m.buy(EID, wi, sh, c, { value: c })).wait();
        p.holds[wi] = (p.holds[wi] ?? 0n) + sh;
        console.log(`t${t} BUY  #${wi} x${ethers.formatEther(sh)} ${p.w.address.slice(0, 8)}`);
      }
    } catch (e: any) {
      console.log(`t${t} skip: ${e?.shortMessage ?? e?.message ?? e}`);
    }
    await sleep(TICK_MS);
  }
  console.log("trade-bot done");
}

main().then(() => process.exit(0)).catch((e) => { console.error(e?.message ?? e); process.exit(1); });
