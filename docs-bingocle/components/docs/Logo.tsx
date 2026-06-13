export function Logo({ size = 34 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden
      className="logo-mark"
    >
      <defs>
        <linearGradient id="bg-grad" x1="0" y1="0" x2="48" y2="48">
          <stop offset="0" stopColor="#b794ff" />
          <stop offset="1" stopColor="#7c3aed" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="44" height="44" rx="12" fill="url(#bg-grad)" />
      <rect
        x="2.75"
        y="2.75"
        width="42.5"
        height="42.5"
        rx="11.25"
        stroke="#fff"
        strokeOpacity="0.25"
        strokeWidth="1.5"
      />
      {/* 3x3 bingo dots */}
      {[12, 24, 36].map((cy) =>
        [12, 24, 36].map((cx) => {
          const free = cx === 24 && cy === 24;
          return (
            <circle
              key={`${cx}-${cy}`}
              cx={cx}
              cy={cy}
              r={free ? 5 : 3}
              fill="#0b0614"
              fillOpacity={free ? 1 : 0.55}
            />
          );
        })
      )}
      {/* oracle eye in the FREE center */}
      <circle cx="24" cy="24" r="2" fill="#c9b4ff" />
    </svg>
  );
}
