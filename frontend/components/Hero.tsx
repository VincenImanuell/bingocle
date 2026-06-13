import Link from "next/link";
import Reveal from "./Reveal";
import { ArrowOrb, Canopy, Sparks, type SparkSpec } from "./ornaments";

const HERO_SPARKS: SparkSpec[] = [
  { left: "12%", top: "38%", size: 4, delay: "0s" },
  { left: "20%", top: "66%", size: 3, delay: "1.4s" },
  { left: "34%", top: "30%", size: 3, delay: "2.6s", teal: true },
  { left: "47%", top: "72%", size: 4, delay: "0.8s" },
  { left: "55%", top: "24%", size: 3, delay: "3.4s", teal: true },
  { left: "64%", top: "58%", size: 3, delay: "2s" },
  { left: "82%", top: "34%", size: 4, delay: "1s" },
  { left: "90%", top: "70%", size: 3, delay: "4.2s", teal: true },
  { left: "7%", top: "82%", size: 3, delay: "3s" },
];

/* a fanned hand of cards, the front one carrying the demo play button */
const BACK_CARDS = [
  { rot: "-16deg", x: "-78%", y: "6%", art: "art-ember", z: 1 },
  { rot: "-8deg", x: "-52%", y: "0%", art: "art-teal", z: 2 },
  { rot: "10deg", x: "8%", y: "-2%", art: "art-gold", z: 3 },
  { rot: "19deg", x: "32%", y: "8%", art: "art-teal", z: 4 },
];

export default function Hero() {
  return (
    <section id="home" className="page-top relative">
      <div className="mx-auto max-w-7xl px-3 pt-3 pb-0 sm:px-5 sm:pt-5">
        <div className="hero-panel">
          {/* drifting smoke / mist */}
          <div
            className="hero-smoke left-[8%] top-[20%] h-72 w-96"
            style={{ background: "rgba(0, 198, 184, 0.16)" }}
            aria-hidden="true"
          />
          <div
            className="hero-smoke right-[5%] top-[45%] h-64 w-80"
            style={{ background: "rgba(245, 230, 200, 0.05)", animationDelay: "-7s" }}
            aria-hidden="true"
          />
          <div
            className="hero-smoke bottom-[-10%] left-[35%] h-60 w-[34rem]"
            style={{ background: "rgba(58, 23, 18, 0.35)", animationDelay: "-3s" }}
            aria-hidden="true"
          />

          <Sparks items={HERO_SPARKS} />
          <Canopy />

          <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-12 px-6 pb-16 pt-24 sm:px-10 sm:pt-28 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:pb-20 lg:pt-32">
            {/* ── left: title block ── */}
            <div className="text-center lg:text-left">
              <Reveal>
                <h1 className="wordmark text-5xl sm:text-6xl xl:text-7xl">
                  Bingocle
                </h1>
              </Reveal>
              <Reveal delay={120}>
                <p className="tagline-caps mt-4 text-[0.6rem] sm:text-xs">
                  Community-Driven Bingo Card Game
                </p>
              </Reveal>
              <Reveal delay={220}>
                <p className="mt-6 font-heading text-xl italic text-cream/90 sm:text-2xl">
                  Trade the words. Let AI decide. Win on Mantle.
                </p>
              </Reveal>
              <Reveal delay={300}>
                <p className="body-copy mx-auto mt-3 max-w-md text-base lg:mx-0">
                  A prediction market bingo game — buy positions on words you think
                  will be spoken, let the AI oracle validate live, and settle
                  trustlessly on Mantle Network.
                </p>
              </Reveal>
              <Reveal delay={400}>
                <div className="mt-9 flex flex-wrap items-center justify-center gap-x-7 gap-y-4 lg:justify-start">
                  <a href="#beta" className="btn btn-gold">
                    Join Beta
                  </a>
                  <a href="#about" className="link-arrow">
                    <ArrowOrb />
                    Explore the Game
                  </a>
                </div>
              </Reveal>
            </div>

            {/* ── right: fanned card stack + watch demo ── */}
            <Reveal delay={250}>
              <div className="relative mx-auto h-[300px] w-[260px] scale-[0.65] sm:h-[340px] sm:w-[300px] sm:scale-100">
                {BACK_CARDS.map((c, i) => (
                  <div
                    key={i}
                    className="gcard card-bob absolute left-1/2 top-1/2 h-[78%] w-[58%]"
                    style={{
                      transform: `translate(-50%, -50%) translate(${c.x}, ${c.y}) rotate(${c.rot})`,
                      zIndex: c.z,
                      animationDelay: `${i * 0.9}s`,
                    }}
                    aria-hidden="true"
                  >
                    <div className={`gcard-art ${c.art}`} />
                  </div>
                ))}

                {/* front card */}
                <div
                  className="gcard card-bob absolute left-1/2 top-1/2 z-10 h-[92%] w-[70%]"
                  style={{
                    transform: "translate(-54%, -50%) rotate(2deg)",
                    animationDelay: "0.4s",
                    animationDuration: "9s",
                  }}
                >
                <div className="gcard-art art-teal">
                  <div className="word-orb" aria-hidden="true" />
                </div>
                <span className="gcard-nameplate">Bingocle</span>
                <div className="absolute inset-0 z-[3] flex flex-col items-center justify-center gap-3 pt-6">
                  <Link href="/play" className="play-btn" aria-label="Play the live market">
                    <span className="tri" aria-hidden="true" />
                  </Link>
                  <span className="watch-label text-center leading-relaxed">
                    Trade
                    <br />
                    Live
                  </span>
                </div>
                </div>
              </div>
            </Reveal>
          </div>

          {/* bottom fade so the panel melts into the nav strip */}
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-20"
            style={{
              background: "linear-gradient(180deg, transparent, rgba(4, 8, 7, 0.9))",
            }}
            aria-hidden="true"
          />
        </div>
      </div>
    </section>
  );
}
