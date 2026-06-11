import Reveal from "./Reveal";
import { FrameCorners, OrnateDivider } from "./ornaments";

/* 5×5 board — community keywords; centre tile is the free star */
const BOARD: { word: string; state?: "hit" | "free" }[] = [
  { word: "AI", state: "hit" },
  { word: "Web3" },
  { word: "Funding" },
  { word: "Community", state: "hit" },
  { word: "Launch" },

  { word: "Airdrop" },
  { word: "Token", state: "hit" },
  { word: "Hackathon" },
  { word: "Pitch" },
  { word: "Demo", state: "hit" },

  { word: "Builder" },
  { word: "Chain" },
  { word: "★ Free", state: "free" },
  { word: "Sponsor" },
  { word: "Grant" },

  { word: "DAO" },
  { word: "Wallet", state: "hit" },
  { word: "Mainnet" },
  { word: "Testnet", state: "hit" },
  { word: "Reward" },

  { word: "Quest" },
  { word: "Oracle" },
  { word: "Mantle" },
  { word: "Gas Fee" },
  { word: "Mint" },
];

const HAND_CARDS = [
  { word: "Airdrop", mult: "2.5×", ember: true },
  { word: "AI", mult: "1.2×" },
  { word: "Mainnet", mult: "1.4×" },
  { word: "Funding", mult: "1.7×", ember: true },
  { word: "DAO", mult: "2.1×" },
];

export default function GamePreview() {
  return (
    <section id="game-preview" className="relative scroll-mt-16">
      <div className="relative mx-auto max-w-5xl px-4 pb-28 pt-10 sm:px-8">
        {/* ── header copy ── */}
        <Reveal>
        <div className="mx-auto mb-10 max-w-xl text-center">
          <p className="kicker">Every session, a new card</p>
          <h2 className="h-display mt-3 text-3xl sm:text-4xl">
            Live <span className="gold">Bingo Board</span>
          </h2>
          <p className="body-copy mt-4 text-base">
            A dynamic card filled with community-submitted words. Every session
            is different because the crowd shapes the game.
          </p>
        </div>
        </Reveal>

        <Reveal delay={150}>
        {/* ── round badge + prev/next ribbons ── */}
        <div className="relative z-10 mb-[-44px] flex items-center justify-center">
          <button type="button" className="ribbon-btn prev">
            ◂ Prev
          </button>
          <div className="turn-badge text-xl sm:text-2xl">5×5</div>
          <button type="button" className="ribbon-btn next">
            Next ▸
          </button>
        </div>

        {/* ── the big framed board ── */}
        <div className="ornate-frame">
          <FrameCorners />
          <div className="frame-screen board-scene px-2 pb-5 pt-14 sm:px-6 sm:pb-7 sm:pt-16">
            {/* HUD row */}
            <div className="mb-4 flex flex-wrap items-center justify-center gap-2 sm:justify-between">
              <span className="hud-plate">
                <span className="dot gold" aria-hidden="true" />
                You · 1 from bingo
              </span>
              <span className="hud-plate hidden sm:inline-flex">
                Live Event — Demo Day
              </span>
              <span className="hud-plate">
                <span className="dot live" aria-hidden="true" />
                Oracle · Listening
              </span>
            </div>

            {/* board */}
            <div className="bingo-board">
              {BOARD.map((t, i) => (
                <div
                  key={t.word}
                  className={`bingo-tile ${t.state ?? ""}`}
                  style={
                    t.state ? { animationDelay: `${(i % 8) * 0.4}s` } : undefined
                  }
                >
                  {t.word}
                </div>
              ))}
            </div>

            {/* hand of word cards */}
            <div className="mt-5 flex flex-wrap items-end justify-center gap-1.5 sm:gap-3">
              {HAND_CARDS.map((c, i) => (
                <div
                  key={c.word}
                  className="mini-card mini-bob"
                  style={{ animationDelay: `${i * 0.45}s` }}
                >
                  <span className="mc-word block">{c.word}</span>
                  <span
                    className={`mc-orb ${c.ember ? "ember" : ""}`}
                    style={{ animationDelay: `${i * 0.6}s` }}
                    aria-hidden="true"
                  />
                  <span className="mc-mult block">{c.mult}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        </Reveal>

        <OrnateDivider className="mt-24" />
      </div>
    </section>
  );
}
