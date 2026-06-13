/**
 * Populate an event with simulated players so the market feels alive for a demo:
 * derive N throwaway wallets, fund each from the agent wallet, then have each mint
 * a bingo card and buy random word shares (moves the bonding-curve prices).
 *
 * Event must be in Founder/Market phase with a committed pool.
 *   EVENT_ID=3 PLAYERS=8 FUND_MNT=3 npx tsx scripts/simulate-players.ts
 */
import { ethers } from "ethers";
import { provider, signer } from "../src/chain.js";
import { config } from "../src/config.js";

const EID = Number(process.env.EVENT_ID ?? 0);
const N = Number(process.env.PLAYERS ?? 6);
const FUND = ethers.parseEther(process.env.FUND_MNT ?? "3");
if (!EID) throw new Error("set EVENT_ID");

const MARKET_ABI = [
  "function quoteBuy(uint256,uint256,uint256) view returns (uint256)",
  "function buy(uint256,uint256,uint256,uint256) payable returns (uint256)",
];
const CARD_ABI = ["function mint(uint256) returns (uint256)"];
const POOL_ABI = ["function wordCount(uint256) view returns (uint256)"];

const rnd = (n: number) => Math.floor(Math.random() * n);

async function main() {
  const prov = provider();
  const funder = signer();
  const A = config.addresses;
  const nWords = Number(await new ethers.Contract(A.wordPool, POOL_ABI, prov).wordCount(EID));
  if (!nWords) throw new Error(`event ${EID} has no committed pool`);
  console.log(`event ${EID}: ${nWords} words · spawning ${N} players (${ethers.formatEther(FUND)} MNT each)`);

  for (let i = 0; i < N; i++) {
    const w = ethers.Wallet.createRandom().connect(prov);
    try {
      await (await funder.sendTransaction({ to: w.address, value: FUND })).wait();
      await (await new ethers.Contract(A.bingoCardNFT, CARD_ABI, w).mint(EID)).wait();

      const market = new ethers.Contract(A.wordMarket, MARKET_ABI, w);
      const buys = 1 + rnd(2); // 1-2 buys per player
      const got: string[] = [];
      for (let b = 0; b < buys; b++) {
        const wi = rnd(nWords);
        const shares = ethers.parseEther((0.5 + Math.random() * 2.5).toFixed(2));
        const cost: bigint = await market.quoteBuy(EID, wi, shares);
        await (await market.buy(EID, wi, shares, cost, { value: cost })).wait();
        got.push(`word#${wi} x${ethers.formatEther(shares)}`);
      }
      console.log(`  ✅ player ${i + 1} ${w.address.slice(0, 8)} — minted card + bought ${got.join(", ")}`);
    } catch (e: any) {
      console.log(`  ⚠️ player ${i + 1} failed: ${e?.shortMessage ?? e?.message ?? e}`);
    }
  }
  console.log("done — refresh /app to see live prices move + multiple cards.");
}

main().then(() => process.exit(0)).catch((e) => { console.error(e?.message ?? e); process.exit(1); });
