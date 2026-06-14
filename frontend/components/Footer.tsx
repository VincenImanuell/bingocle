/* footer hex cluster — isometric board tiles spelling the game */
const HEX_TILES: {
  letter?: string;
  face: string;
  left: number;
  top: number;
  w: number;
}[] = [
  { letter: "B", face: "face-gold", left: 0, top: 38, w: 62 },
  { letter: "I", face: "face-teal", left: 50, top: 8, w: 62 },
  { letter: "N", face: "face-brown", left: 100, top: 42, w: 62 },
  { letter: "G", face: "face-teal", left: 150, top: 10, w: 62 },
  { letter: "O", face: "face-gold", left: 200, top: 44, w: 62 },
  { face: "face-brown", left: 78, top: 78, w: 50 },
  { face: "face-teal", left: 168, top: 76, w: 50 },
];

export default function Footer() {
  return (
    <footer id="footer" className="footer-band">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-12 px-6 pb-10 pt-16 sm:px-10 md:flex-row">
        {/* ── left: wordmark ── */}
        <div className="text-center md:text-left">
          <p className="wordmark text-3xl sm:text-4xl">Bingocle</p>
          <p className="tagline-caps mt-3 text-[0.55rem]">
            Community-Driven Bingo Card Game
          </p>
        </div>

        {/* ── right: isometric tile cluster ── */}
        <div
          className="relative h-[150px] w-[280px] flex-none"
          aria-hidden="true"
        >
          {HEX_TILES.map((t, i) => (
            <div
              key={i}
              className="hex-tile hex-bob"
              style={{
                left: t.left,
                top: t.top,
                ["--hex-w" as string]: `${t.w}px`,
                width: t.w,
                animationDelay: `${i * 0.55}s`,
              }}
            >
              <div className="hex-side" />
              <div className={`hex-face ${t.face}`}>{t.letter ?? ""}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── bottom strip ── */}
      <div className="border-t border-gold/10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-5 sm:px-10 md:flex-row">
          <p className="footer-link cursor-default">
            © 2026 Bingocle · All rights reserved
          </p>
          <p className="footer-link cursor-default">⚔ Built for Hackathon</p>
        </div>
      </div>
    </footer>
  );
}
