/* Shared decorative pieces — every visual here is hand-built
   (SVG / CSS only), no image assets. */

export function ArrowOrb() {
  return (
    <span className="orb" aria-hidden="true">
      <svg viewBox="0 0 10 10">
        <path d="M1 0 L9 5 L1 10 Z" />
      </svg>
    </span>
  );
}

export function FrameCorners() {
  return (
    <>
      <i className="frame-corner tl" aria-hidden="true" />
      <i className="frame-corner tr" aria-hidden="true" />
      <i className="frame-corner bl" aria-hidden="true" />
      <i className="frame-corner br" aria-hidden="true" />
    </>
  );
}

export function OrnateDivider({ className = "" }: { className?: string }) {
  return <div className={`divider-ornate ${className}`} aria-hidden="true" />;
}

export type SparkSpec = {
  left: string;
  top: string;
  size: number;
  delay: string;
  teal?: boolean;
};

export function Sparks({ items }: { items: SparkSpec[] }) {
  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
      {items.map((s, i) => (
        <span
          key={i}
          className={`spark ${s.teal ? "teal" : ""}`}
          style={{
            left: s.left,
            top: s.top,
            width: s.size,
            height: s.size,
            animationDelay: s.delay,
          }}
        />
      ))}
    </div>
  );
}

/* Hanging foliage silhouette along the hero's top edge,
   with tiny golden lantern lights — like the reference. */
export function Canopy() {
  return (
    <svg
      className="hero-canopy"
      viewBox="0 0 1440 150"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {/* back layer — slightly green-lit, a continuous band */}
      <g fill="#0d1f18" opacity="0.85">
        <rect x="-20" y="-90" width="1480" height="118" />
        <ellipse cx="40" cy="22" rx="240" ry="62" />
        <ellipse cx="300" cy="8" rx="200" ry="50" />
        <ellipse cx="540" cy="-2" rx="190" ry="44" />
        <ellipse cx="780" cy="4" rx="200" ry="40" />
        <ellipse cx="1020" cy="6" rx="200" ry="48" />
        <ellipse cx="1260" cy="16" rx="210" ry="56" />
        <ellipse cx="1450" cy="26" rx="220" ry="68" />
      </g>
      {/* front layer — near-black, scalloped edge */}
      <g fill="#050d0a">
        <rect x="-20" y="-100" width="1480" height="110" />
        <ellipse cx="-10" cy="14" rx="250" ry="64" />
        <ellipse cx="220" cy="-4" rx="180" ry="48" />
        <ellipse cx="430" cy="-14" rx="160" ry="40" />
        <ellipse cx="650" cy="-20" rx="170" ry="36" />
        <ellipse cx="870" cy="-16" rx="170" ry="38" />
        <ellipse cx="1080" cy="-8" rx="180" ry="44" />
        <ellipse cx="1290" cy="4" rx="190" ry="52" />
        <ellipse cx="1460" cy="18" rx="220" ry="70" />
        {/* hanging vine clusters */}
        <path d="M150 52 q10 36 2 78 q12 -10 16 -28 q4 24 -2 42 q16 -14 20 -48 q-8 -32 -36 -44z" />
        <path d="M225 40 q8 30 0 62 q10 -8 14 -22 q2 18 -2 32 q14 -12 16 -40 q-6 -26 -28 -32z" />
        <path d="M1250 44 q10 34 2 72 q12 -10 16 -26 q4 22 -2 38 q16 -14 18 -44 q-6 -30 -34 -40z" />
        <path d="M1330 36 q8 28 0 56 q10 -8 12 -20 q2 16 -2 30 q12 -12 16 -36 q-6 -24 -26 -30z" />
        <path d="M70 56 q12 40 4 86 q14 -12 18 -32 q4 26 -2 46 q18 -16 22 -54 q-10 -36 -42 -46z" />
      </g>
      {/* lantern lights */}
      <g fill="#f2c66d">
        <circle className="lantern" cx="160" cy="116" r="2.6" />
        <circle className="lantern" cx="92" cy="128" r="2" style={{ animationDelay: "1.1s" }} />
        <circle className="lantern" cx="238" cy="92" r="1.8" style={{ animationDelay: "2.3s" }} />
        <circle className="lantern" cx="1268" cy="104" r="2.6" style={{ animationDelay: "0.6s" }} />
        <circle className="lantern" cx="1340" cy="82" r="1.8" style={{ animationDelay: "1.7s" }} />
      </g>
      <g fill="#2be3d4">
        <circle className="lantern" cx="690" cy="36" r="1.6" style={{ animationDelay: "2.9s" }} />
        <circle className="lantern" cx="1130" cy="52" r="1.6" style={{ animationDelay: "0.9s" }} />
      </g>
    </svg>
  );
}

/* Small cog ornament behind the "How to play?" heading */
export function Gear({ className = "" }: { className?: string }) {
  const teeth = Array.from({ length: 8 }, (_, i) => i * 45);
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <g fill="#d9a441">
        {teeth.map((deg) => (
          <rect
            key={deg}
            x="46"
            y="6"
            width="8"
            height="14"
            rx="2"
            transform={`rotate(${deg} 50 50)`}
          />
        ))}
        <circle cx="50" cy="50" r="32" />
      </g>
      <circle cx="50" cy="50" r="13" fill="#11100c" />
    </svg>
  );
}

/* Seaweed strands for the beta band edges */
export function Kelp({ flip = false }: { flip?: boolean }) {
  return (
    <svg
      viewBox="0 0 140 260"
      className={`kelp-sway absolute bottom-0 w-24 md:w-36 opacity-80 pointer-events-none ${
        flip ? "right-0 -scale-x-100" : "left-0"
      }`}
      style={flip ? { animationDelay: "-4.5s" } : undefined}
      aria-hidden="true"
    >
      <g stroke="#04302a" fill="none" strokeLinecap="round">
        <path d="M30 260 C 22 200, 46 175, 36 120 C 30 88, 44 70, 40 28" strokeWidth="13" />
        <path d="M68 260 C 60 215, 82 190, 72 140 C 66 110, 78 95, 74 60" strokeWidth="10" />
        <path d="M105 260 C 99 225, 116 205, 108 168 C 103 145, 112 132, 109 105" strokeWidth="8" />
      </g>
      <g fill="#04302a">
        <ellipse cx="44" cy="60" rx="7" ry="20" transform="rotate(24 44 60)" />
        <ellipse cx="30" cy="110" rx="6" ry="17" transform="rotate(-20 30 110)" />
        <ellipse cx="78" cy="100" rx="6" ry="16" transform="rotate(22 78 100)" />
        <ellipse cx="64" cy="160" rx="5" ry="14" transform="rotate(-18 64 160)" />
        <ellipse cx="112" cy="140" rx="5" ry="13" transform="rotate(20 112 140)" />
      </g>
    </svg>
  );
}
