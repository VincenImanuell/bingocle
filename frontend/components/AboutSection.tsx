import Reveal from "./Reveal";
import { ArrowOrb, Sparks, type SparkSpec } from "./ornaments";

const ABOUT_SPARKS: SparkSpec[] = [
  { left: "6%", top: "20%", size: 3, delay: "0.6s" },
  { left: "48%", top: "10%", size: 3, delay: "2.2s", teal: true },
  { left: "92%", top: "32%", size: 3, delay: "1.2s" },
  { left: "84%", top: "78%", size: 3, delay: "3.6s", teal: true },
];

/* fanned arc of word cards, front card fully detailed — like the
   "Kobold Architect" fan in the reference */
const FAN_CARDS = [
  { rot: -34, art: "art-ember" },
  { rot: -25, art: "art-teal" },
  { rot: -16, art: "art-gold" },
  { rot: -8, art: "art-ember" },
  { rot: 0, art: "art-teal" },
  { rot: 8, art: "art-gold" },
];

export default function AboutSection() {
  return (
    <section id="about" className="relative scroll-mt-16">
      <Sparks items={ABOUT_SPARKS} />

      {/* faint terrain silhouette on the right edge, like the map art */}
      <div
        className="ridge right-0 top-10 h-64 w-72"
        style={{
          background:
            "linear-gradient(165deg, transparent 40%, rgba(58,23,18,0.5) 41%, transparent 58%), linear-gradient(195deg, transparent 52%, rgba(26,13,9,0.8) 53%, transparent 72%)",
          maskImage: "linear-gradient(270deg, black, transparent 85%)",
          WebkitMaskImage: "linear-gradient(270deg, black, transparent 85%)",
        }}
        aria-hidden="true"
      />

      <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-6 py-24 sm:px-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8 lg:py-32">
        {/* ── left: card fan ── */}
        <Reveal className="order-2 lg:order-1" delay={150}>
        <div className="relative mx-auto h-[320px] w-[300px] origin-bottom max-[380px]:scale-90 max-[340px]:scale-[0.8] sm:h-[360px] sm:w-[360px]">
          {FAN_CARDS.map((c, i) => (
            <div
              key={i}
              className="gcard fan-sway absolute left-1/2 bottom-6 h-[210px] w-[145px] origin-bottom sm:h-[240px] sm:w-[165px]"
              style={{
                transform: `translateX(-50%) rotate(${c.rot}deg)`,
                zIndex: i + 1,
                animationDelay: `${i * 0.55}s`,
              }}
              aria-hidden="true"
            >
              <div className={`gcard-art ${c.art}`} />
            </div>
          ))}

          {/* front detailed card */}
          <div
            className="gcard fan-sway absolute left-1/2 bottom-0 z-10 h-[250px] w-[170px] origin-bottom sm:h-[285px] sm:w-[195px]"
            style={{
              transform: "translateX(-32%) rotate(16deg)",
              animationDelay: "1.2s",
            }}
          >
            <div className="gcard-art art-ember">
              <div className="word-orb ember" aria-hidden="true" />
            </div>
            <span className="gcard-nameplate">Airdrop</span>
            <span className="gcard-stat" style={{ left: "6px", bottom: "6px" }}>
              2.5×
            </span>
            <span className="gcard-stat" style={{ right: "6px", bottom: "6px" }}>
              0.25
            </span>
            <p
              className="absolute inset-x-3 bottom-11 z-[3] text-center font-body text-[0.66rem] italic leading-snug"
              style={{ color: "#cdbb96" }}
            >
              If the crowd hears it spoken, every believer is rewarded.
            </p>
          </div>
        </div>
        </Reveal>

        {/* ── right: copy ── */}
        <Reveal className="order-1 lg:order-2" delay={0}>
        <div className="text-center lg:text-left">
          <h2 className="h-display text-4xl sm:text-5xl">
            What is <span className="gold">Bingocle?</span>
          </h2>
          <p className="body-copy mt-6">
            Bingocle is a prediction market bingo game on Mantle Network.
            The crowd submits words they believe a speaker will say. An AI oracle
            curates the pool, prices each word by probability, and arranges them
            into a bingo card. Players buy and sell positions like a prediction
            market — price rises with demand on a bonding curve.
          </p>
          <p className="body-copy mt-4 text-base italic">
            When the event goes live, trading closes and the AI oracle listens
            in real time — validating every word on-chain via an ERC-8004 agent
            identity. No admin marks words. Settlement is trustless on Mantle.
          </p>
          <a href="#how-to-play" className="link-arrow mt-8">
            <ArrowOrb />
            Learn more about Bingocle
          </a>
        </div>
        </Reveal>
      </div>
    </section>
  );
}
