import Link from "next/link";
import Reveal from "./Reveal";
import { ArrowOrb, FrameCorners, Gear, Sparks, type SparkSpec } from "./ornaments";

const STEPS = [
  {
    n: "I",
    title: "Submit Words",
    desc: "Pitch the words you believe will be spoken or appear.",
  },
  {
    n: "II",
    title: "Community Votes",
    desc: "The crowd votes and contributes to the word pool.",
  },
  {
    n: "III",
    title: "Card Is Generated",
    desc: "The most loved words are forged into a bingo card.",
  },
  {
    n: "IV",
    title: "Players Join",
    desc: "Everyone receives a card and enters the session.",
  },
  {
    n: "V",
    title: "Mark Words Live",
    desc: "Words light up on every card as they appear.",
  },
  {
    n: "VI",
    title: "Bingo & Rewards",
    desc: "Complete a line, claim your bingo, win rewards.",
  },
];

const EMBER_SPARKS: SparkSpec[] = [
  { left: "4%", top: "78%", size: 4, delay: "0s" },
  { left: "9%", top: "86%", size: 3, delay: "1.8s" },
  { left: "14%", top: "74%", size: 3, delay: "3.2s" },
  { left: "6%", top: "64%", size: 2, delay: "2.4s" },
];

/* tiny stylized board inside the "video" frame */
const PREVIEW_TILES = [
  "hit",
  "",
  "",
  "hit",
  "",
  "",
  "hit",
  "",
  "",
  "hit",
  "",
  "",
];

export default function HowToPlay() {
  return (
    <section id="how-to-play" className="relative scroll-mt-16">
      {/* warm ember glow rising from the lower-left corner,
          standing in for the reference's creature art */}
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
          {/* ── left: heading + copy ── */}
          <Reveal>
          <div className="text-center lg:text-left">
            <div className="relative inline-block">
              <Gear className="gear-spin absolute -right-10 -top-7 h-12 w-12 opacity-35 lg:-right-12" />
              <h2 className="h-display relative text-4xl sm:text-5xl">
                How to <span className="gold">play?</span>
              </h2>
            </div>
            <p className="body-copy mt-6">
              Submit your words, generate the card, join the session, and mark
              every word as it appears. Complete a line, claim your bingo, and
              compete with the community.
            </p>
            <a href="#game-preview" className="link-arrow mt-8">
              <ArrowOrb />
              Check the Game Flow
            </a>
          </div>
          </Reveal>

          {/* ── right: video / preview frame ── */}
          <Reveal delay={150}>
          <div className="ornate-frame">
            <FrameCorners />
            <div className="frame-screen board-scene aspect-[16/10]">
              {/* mini board sketch */}
              <div className="absolute inset-0 grid grid-cols-4 gap-2 p-6 opacity-45 sm:p-8">
                {PREVIEW_TILES.map((state, i) => (
                  <div key={i} className={`bingo-tile ${state}`} aria-hidden="true" />
                ))}
              </div>
              {/* dark veil + play */}
              <div
                className="absolute inset-0 flex flex-col items-center justify-center gap-4"
                style={{
                  background:
                    "radial-gradient(60% 60% at 50% 50%, rgba(2, 10, 9, 0.25), rgba(2, 10, 9, 0.78))",
                }}
              >
                <Link href="/app" className="play-btn" aria-label="Play the demo">
                  <span className="tri" aria-hidden="true" />
                </Link>
                <span className="watch-label">Play the Demo</span>
              </div>
            </div>
          </div>
          </Reveal>
        </div>

        {/* ── the game-flow panels ── */}
        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
      </div>
    </section>
  );
}
