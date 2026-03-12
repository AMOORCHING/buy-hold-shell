"use client";

export interface HistoryPoint {
  probabilities: number[];
  created_at: string;
}

const COLORS = ["#ef4444", "#f97316", "#3b82f6", "#22c55e"];

const W = 600;
const H = 220;
const ML = 8;
const MR = 46;
const MT = 12;
const MB = 24;
const CW = W - ML - MR;
const CH = H - MT - MB;

function yOf(p: number) {
  return MT + (1 - p) * CH;
}

function buildPath(points: [number, number][]): string {
  if (!points.length) return "";
  return points
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(" ");
}

function formatLabel(date: Date, spanMs: number): string {
  if (spanMs < 86400000 * 2) {
    const h = date.getHours();
    const m = date.getMinutes().toString().padStart(2, "0");
    const suffix = h >= 12 ? "p" : "a";
    const h12 = h % 12 || 12;
    return `${h12}:${m}${suffix}`;
  }
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const GRID_PS = [0, 0.25, 0.5, 0.75, 1.0];

export function ProbabilityChart({
  history,
  outcomes,
}: {
  history: HistoryPoint[];
  outcomes: string[];
}) {
  const n = outcomes.length;
  const current =
    history.length > 0
      ? history[history.length - 1].probabilities
      : Array(n).fill(1 / n);

  // Need ≥2 points to draw lines
  const hasData = history.length >= 2;

  const times = hasData ? history.map((h) => new Date(h.created_at).getTime()) : [];
  const tMin = times[0] ?? 0;
  const tMax = times[times.length - 1] ?? 1;
  const tSpan = Math.max(tMax - tMin, 1);

  const xOf = (t: number) => ML + ((t - tMin) / tSpan) * CW;

  // Paths per outcome
  const paths = hasData
    ? Array.from({ length: n }, (_, oi) =>
        buildPath(times.map((t, ti) => [xOf(t), yOf(history[ti].probabilities[oi])]))
      )
    : [];

  const xTicks: { x: number; label: string }[] = [];
  if (hasData) {
    const tickCount = Math.min(5, Math.max(2, Math.floor(CW / 90)));
    const seen = new Set<string>();
    for (let i = 0; i < tickCount; i++) {
      const tickTime = tMin + (i / (tickCount - 1)) * tSpan;
      const label = formatLabel(new Date(tickTime), tSpan);
      if (!seen.has(label)) {
        seen.add(label);
        xTicks.push({ x: xOf(tickTime), label });
      }
    }
  }

  const lastX = hasData ? xOf(times[times.length - 1]) : 0;

  return (
    <div>
      <div className="flex flex-wrap gap-x-5 gap-y-1 mb-3 px-1">
        {outcomes.map((label, i) => (
          <span key={i} className="flex items-center gap-1.5 text-[11px] text-[var(--muted)]">
            <span
              className="inline-block w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: COLORS[i % COLORS.length] }}
            />
            {label}
          </span>
        ))}
      </div>

      {/* Chart */}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
        className="w-full max-h-[280px]"
        style={{ display: "block" }}
      >
        {/* Grid lines */}
        {GRID_PS.map((g) => {
          const y = yOf(g);
          return (
            <g key={g}>
              <line
                x1={ML}
                x2={W - MR}
                y1={y}
                y2={y}
                stroke="#262626"
                strokeDasharray="3 3"
                strokeWidth={1}
              />
              <text
                x={W - MR + 6}
                y={y + 4}
                style={{ fontSize: 10, fill: "#4b5563", fontFamily: "sans-serif" }}
              >
                {(g * 100).toFixed(0)}%
              </text>
            </g>
          );
        })}

        {hasData ? (
          <>
            {/* Outcome lines */}
            {paths.map((d, i) => (
              <path
                key={i}
                d={d}
                stroke={COLORS[i % COLORS.length]}
                strokeWidth={1.5}
                fill="none"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            ))}

            {/* End-of-line dots */}
            {Array.from({ length: n }, (_, i) => (
              <circle
                key={i}
                cx={lastX}
                cy={yOf(current[i])}
                r={4}
                fill={COLORS[i % COLORS.length]}
              />
            ))}

            {/* X axis labels */}
            {xTicks.map(({ x, label }, i) => (
              <text
                key={i}
                x={x}
                y={H - 6}
                textAnchor="middle"
                style={{ fontSize: 10, fill: "#6b7280", fontFamily: "sans-serif" }}
              >
                {label}
              </text>
            ))}
          </>
        ) : (
          /* No-data: flat 25% lines */
          <>
            {Array.from({ length: n }, (_, i) => {
              const y = yOf(0.25);
              return (
                <line
                  key={i}
                  x1={ML}
                  x2={W - MR}
                  y1={y}
                  y2={y}
                  stroke={COLORS[i % COLORS.length]}
                  strokeWidth={1}
                  strokeDasharray="4 4"
                  opacity={0.4}
                />
              );
            })}
            <text
              x={ML + CW / 2}
              y={MT + CH / 2 + 4}
              textAnchor="middle"
              style={{ fontSize: 11, fill: "#4b5563", fontFamily: "sans-serif" }}
            >
              No trades yet
            </text>
          </>
        )}
      </svg>
    </div>
  );
}
