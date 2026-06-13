"use client";

export type PricePoint = { time: number; price: number };

export function PriceChart({
  history,
  height = 80,
  compact = false,
}: {
  history: PricePoint[];
  height?: number;
  compact?: boolean;
}) {
  if (history.length < 2) {
    return (
      <div style={{ height }} className="flex items-center justify-center">
        <span className="text-[9px] text-cream/20">collecting…</span>
      </div>
    );
  }
  const W = 300;
  const H = height;
  const vals = history.map((p) => p.price);
  const minP = Math.min(...vals);
  const maxP = Math.max(...vals);
  const range = maxP - minP || 0.001;
  const pad = compact ? 2 : 14;
  const toX = (i: number) => ((i / (history.length - 1)) * W).toFixed(1);
  const toY = (p: number) =>
    (H - pad - ((p - minP) / range) * (H - pad * 2)).toFixed(1);
  const linePath = history
    .map((pt, i) => `${i === 0 ? "M" : "L"} ${toX(i)} ${toY(pt.price)}`)
    .join(" ");
  const areaPath = `${linePath} L ${toX(history.length - 1)} ${H} L 0 ${H} Z`;
  const current = history[history.length - 1].price;
  const isUp = current >= history[0].price;
  const color = isUp ? "#2be3d4" : "#e07a4a";
  const fmtTime = (ts: number) => {
    const d = new Date(ts);
    return `${d.getHours().toString().padStart(2, "0")}:${d
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;
  };
  const gradId = `pcg-${compact ? "c" : "d"}-${isUp ? "u" : "d"}-${Math.abs(history[0].time) % 9999}`;
  return (
    <div style={{ width: "100%" }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        style={{ width: "100%", height, display: "block" }}
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.18" />
            <stop offset="100%" stopColor={color} stopOpacity="0.01" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#${gradId})`} />
        <path
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth="1.6"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <circle cx={toX(history.length - 1)} cy={toY(current)} r="2.5" fill={color} />
        {!compact && (
          <>
            <text x="2" y="10" fontSize="7" fill="rgba(205,187,150,0.45)" textAnchor="start">
              {maxP.toFixed(4)}
            </text>
            <text x="2" y={H - 2} fontSize="7" fill="rgba(205,187,150,0.45)" textAnchor="start">
              {minP.toFixed(4)}
            </text>
          </>
        )}
      </svg>
      {!compact && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "9px",
            color: "rgba(205,187,150,0.35)",
            marginTop: 2,
          }}
        >
          <span>{fmtTime(history[0].time)}</span>
          <span>{fmtTime(history[Math.floor(history.length / 2)].time)}</span>
          <span>{fmtTime(history[history.length - 1].time)}</span>
        </div>
      )}
    </div>
  );
}
