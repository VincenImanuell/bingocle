import Link from "next/link";
import Reveal from "./Reveal";
import { ArrowOrb, FrameCorners, Gear, Sparks, type SparkSpec } from "./ornaments";

const STEPS = [
  {
    n: "I",
    title: "Submit Words",
    desc: "Pitch the words you believe the speaker will say — via Telegram or web. First submitter of each word becomes its founder.",
  },
  {
    n: "II",
    title: "AI Curates & Prices",
    desc: "The AI oracle selects, deduplicates, and prices every word based on how likely it is to be spoken. Founders receive an early position at base price.",
  },
  {
    n: "III",
    title: "Trade Positions",
    desc: "Buy or sell shares in any word. Price rises with demand on a bonding curve. Sell anytime before the event goes live.",
  },
  {
    n: "IV",
    title: "Event Goes Live",
    desc: "Trading closes. The AI oracle listens to the live speech — Whisper STT + LLM — and validates each word in real time.",
  },
  {
    n: "V",
    title: "Oracle Commits On-Chain",
    desc: "Every verdict (said / not said) is written to Mantle by the ERC-8004 agent identity — on-chain, permanent, no admin.",
  },
  {
    n: "VI",
    title: "Settle & Claim",
    desc: "Winners redeem trading profits from losers' reserves. Bingo bonuses (line, diagonal, full card) paid from the prize pool.",
  },
];

const EMBER_SPARKS: SparkSpec[] = [
  { left: "4%", top: "78%", size: 4, delay: "0s" },
  { left: "9%", top: "86%", size: 3, delay: "1.8s" },
  { left: "14%", top: "74%", size: 3, delay: "3.2s" },
  { left: "6%", top: "64%", size: 2, delay: "2.4s" },
];

const PREVIEW_TILES = [
  "hit", "", "", "hit", "",
  "", "hit", "", "", "hit",
  "", "", "", "", "",
];

const ROADMAP = [
  {
    title: "zkML Trustless Oracle",
    desc: "Prove AI inference on-chain with a ZK proof — no trust assumption at all. The oracle's reasoning becomes verifiable math.",
  },
  {
    title: "Multi-Oracle Consensus",
    desc: "M-of-N oracle threshold before a verdict commits. Single oracle manipulation becomes economically infeasible.",
  },
  {
    title: "Mainnet & Cross-Chain",
    desc: "Deploy to Mantle Mainnet. Bridge positions across chains — trade on any EVM, settle on Mantle.",
  },
  {
    title: "Creator Monetization",
    desc: "Event organizers earn from the house residual. Sponsored word slots create a B2B revenue layer on top of the game.",
  },
];

export default function HowToPlay() {
  return (
    <section id="how-to-play" className="relative scroll-mt-16">
      <div
        className="pointer-events-none absolute bottom-0 left-0 h-[420px] w-[420px]"
        style={{
          background:
            "radial-gradient(60% 60% at 18% 85%, rgba(122, 44, 16, 0.5), transparent 70%)",
        }}
        aria-hidden="true"
      />
      <Sparks items={EMBER_SPARKS} />

      <div className="relative mx-auto max-w-6xl px-6 py-20 sm:px-10 lg:py-28">
        <div className="grid items-center gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-10">
          {/* left: heading + copy */}
          <Reveal>
          <div className="text-center lg:text-left">
            <div className="relative inline-block">
              <Gear className="gear-spin absolute -right-10 -top-7 h-12 w-12 opacity-35 lg:-right-12" />
              <h2 className="h-display relative text-4xl sm:text-5xl">
                How to <span className="gold">play?</span>
              </h2>
            </div>
            <p className="body-copy mt-6">
              Submit words, let AI curate and price them, trade positions before
              the event, watch the oracle validate live on Mantle, then claim
              your winnings — trustlessly.
            </p>
            <a
              href={process.env.NEXT_PUBLIC_DOCS_URL ?? "https://bingocle-doc.vercel.app"}
              target="_blank"
              rel="noopener noreferrer"
              className="link-arrow mt-8"
            >
              <ArrowOrb />
              Need more details? Read the docs
            </a>
          </div>
          </Reveal>

          {/* right: demo frame */}
          <Reveal delay={150}>
          <div className="ornate-frame">
            <FrameCorners />
            <div className="frame-screen board-scene aspect-[16/10]">
              <div className="absolute inset-0 grid grid-cols-4 gap-2 p-6 opacity-45 sm:p-8">
                {PREVIEW_TILES.map((state, i) => (
                  <div key={i} className={`bingo-tile ${state}`} aria-hidden="true" />
                ))}
              </div>
              <div
                className="absolute inset-0 flex flex-col items-center justify-center gap-4"
                style={{
                  background:
                    "radial-gradient(60% 60% at 50% 50%, rgba(2, 10, 9, 0.25), rgba(2, 10, 9, 0.78))",
                }}
              >
                <Link href="/play" className="play-btn" aria-label="Play the demo game">
                  <span className="tri" aria-hidden="true" />
                </Link>
                <span className="watch-label">Play Demo</span>
              </div>
            </div>
          </div>
          </Reveal>
        </div>

        {/* game-flow step panels */}
        <div className="mt-16">
          <p className="kicker mb-1 text-center lg:text-left">Per-event lifecycle</p>
          <p className="body-copy mb-6 text-center text-sm lg:text-left" style={{ fontSize: "0.85rem", color: "rgba(205,187,150,0.55)" }}>
            Each live event runs through all 6 phases independently — you can participate in multiple events at the same time, each with its own card and positions.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {STEPS.map((s, i) => (
            <Reveal key={s.n} className="h-full" delay={i * 90}>
              <div className="step-panel flex h-full items-start gap-3.5">
                <span className="step-rune">{s.n}</span>
                <span>
                  <span className="step-title block">{s.title}</span>
                  <span className="step-desc mt-1 block">{s.desc}</span>
                </span>
              </div>
            </Reveal>
          ))}
        </div>


        {/* roadmap / future vision */}
        <Reveal delay={200}>
        <div className="mt-20 rounded-xl border border-[#d9a44126] bg-[#0e0c08]/60 px-6 py-8 sm:px-8">
          <p className="kicker mb-2">What comes next</p>
          <h3 className="h-display mb-8 text-2xl sm:text-3xl">
            The <span className="gold">Roadmap</span>
          </h3>
          <div className="grid gap-5 sm:grid-cols-2">
            {ROADMAP.map((r) => (
              <div key={r.title} className="flex gap-3">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#e8c66b]" aria-hidden="true" />
                <div>
                  <p className="step-title">{r.title}</p>
                  <p className="step-desc mt-0.5">{r.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        </Reveal>
      </div>
    </section>
  );
}
