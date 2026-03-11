"use client";

const OUTCOME_COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e"];
const OUTCOME_LABELS = ["0-25%", "25-50%", "50-75%", "75-100%"];

interface ProbabilityBarProps {
  probabilities: number[];
  selectedOutcome?: number | null;
  onSelectOutcome?: (index: number) => void;
}

export function ProbabilityBar({
  probabilities,
  selectedOutcome,
  onSelectOutcome,
}: ProbabilityBarProps) {
  const pcts = probabilities.map((p) => Math.round(p * 100));

  return (
    <div className="w-full">
      {/* Stacked bar */}
      <div className="flex w-full h-10 rounded-xl overflow-hidden gap-0.5">
        {pcts.map((pct, i) => (
          <div
            key={i}
            className="flex items-center justify-center text-white text-xs font-bold transition-all duration-500 cursor-pointer"
            style={{
              width: `${pct}%`,
              backgroundColor: OUTCOME_COLORS[i],
              minWidth: pct > 0 ? "2px" : "0",
              opacity: selectedOutcome !== null && selectedOutcome !== undefined && selectedOutcome !== i ? 0.6 : 1,
            }}
            onClick={() => onSelectOutcome?.(i)}
          >
            {pct >= 8 ? `${pct}%` : ""}
          </div>
        ))}
      </div>
      {/* Labels */}
      <div className="flex w-full mt-2">
        {pcts.map((pct, i) => (
          <div
            key={i}
            className="transition-all duration-500 text-center"
            style={{ width: `${pct}%`, minWidth: "0" }}
          >
            {pct >= 10 && (
              <div className="text-gray-400 text-xs truncate" style={{ color: OUTCOME_COLORS[i] }}>
                {OUTCOME_LABELS[i]}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
