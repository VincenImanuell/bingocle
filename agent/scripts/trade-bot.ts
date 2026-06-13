/**
 * Continuous trading bot — keeps the bonding-curve prices moving (up & down) so an
 * on-chain event feels alive for a demo, like the simulated /play market. Funds N
 * throwaway wallets from the agent wallet once, seeds a buy each, then loops random
 * buys/sells. Uses separate player wallets (won't clash with your browser wallet).
 *
 * Event must be in Market phase. Testnet only.
 *   EVENT_ID=3 PLAYERS=5 FUND_MNT=4 TICKS=80 TICK_MS=4000 npx tsx scripts/trade-bot.ts
 */
import { ethers } from "ethers";
import { provider, signer } from "../src/chain.js";
import { config } from "../src/config.js";

const EID = Number(process.env.EVENT_ID ?? 0);
const N = Number(process.env.PLAYERS ?? 5);
const FUND = ethers.parseEther(process.env.FUND_MNT ?? "4");
const TICKS = Number(process.env.TICKS ?? 80);
const TICK_MS = Number(process.env.TICK_MS ?? 4000);
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

type Player = { w: ethers.HDNodeWallet | ethers.Wallet; m: ethers.Contract; holds: Record<number, bigint> };

async function main() {
  const prov = provider();
  const funder = signer();
  const A = config.addresses;
  const nWords = Number(await new ethers.Contract(A.wordPool, POOL_ABI, prov).wordCount(EID));
  const factory = new ethers.Contract(A.eventFactory, FACTORY_ABI, prov);
  if (!nWords) throw new Error(`event ${EID} has no committed pool`);

  const players: Player[] = [];
  for (let i = 0; i < N; i++) {
    const w = ethers.Wallet.createRandom().connect(prov);
    await (await funder.sendTransaction({ to: w.address, value: FUND })).wait();
    const m = new ethers.Contract(A.wordMarket, MARKET_ABI, w);
    const holds: Record<number, bigint> = {};
    const wi = rnd(nWords);
    const sh = ethers.parseEther("1");
    try {
      const c: bigint = await m.quoteBuy(EID, wi, sh);
      await (await m.buy(EID, wi, sh, c, { value: c })).wait();
      holds[wi] = sh;
    } catch { /* seed buy optional */ }
    players.push({ w, m, holds });
    console.log(`funded+seeded player ${i + 1} ${w.address.slice(0, 8)}`);
  }

  console.log(`trading: ${TICKS} ticks every ${TICK_MS}ms on event ${EID}`);
  for (let t = 0; t < TICKS; t++) {
    if (Number(await factory.phaseOf(EID)) !== 3) { console.log("not Market anymore — stopping"); break; }
    const p = players[rnd(N)];
    const held = Object.entries(p.holds).filter(([, v]) => v > 0n);
    const doSell = held.length > 0 && Math.random() < 0.4;
    try {
      if (doSell) {
        const [wiStr, amt] = held[rnd(held.length)];
        const wi = Number(wiStr);
        const sh = amt > ethers.parseEther("0.5") ? ethers.parseEther((0.3 + Math.random() * 0.4).toFixed(2)) : amt;
        await (await p.m.sell(EID, wi, sh, 0n)).wait();
        p.holds[wi] = (p.holds[wi] ?? 0n) - sh;
        console.log(`t${t} SELL word#${wi} x${ethers.formatEther(sh)} ${p.w.address.slice(0, 8)}`);
      } else {
        const wi = rnd(nWords);
        const sh = ethers.parseEther((0.3 + Math.random() * 1.2).toFixed(2));
        const c: bigint = await p.m.quoteBuy(EID, wi, sh);
        await (await p.m.buy(EID, wi, sh, c, { value: c })).wait();
        p.holds[wi] = (p.holds[wi] ?? 0n) + sh;
        console.log(`t${t} BUY  word#${wi} x${ethers.formatEther(sh)} ${p.w.address.slice(0, 8)}`);
      }
    } catch (e: any) {
      console.log(`t${t} skip: ${e?.shortMessage ?? e?.message ?? e}`);
    }
    await sleep(TICK_MS);
  }
  console.log("trade-bot done");
}

main().then(() => process.exit(0)).catch((e) => { console.error(e?.message ?? e); process.exit(1); });
