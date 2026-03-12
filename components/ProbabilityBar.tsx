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
      <div className="flex w-full h-7 overflow-hidden gap-px">
        {pcts.map((pct, i) => (
          <div
            key={i}
            className="flex items-center justify-center text-white text-[10px] font-bold transition-all duration-500 cursor-pointer"
            style={{
              width: `${pct}%`,
              backgroundColor: OUTCOME_COLORS[i],
              minWidth: pct > 0 ? "2px" : "0",
              opacity: selectedOutcome !== null && selectedOutcome !== undefined && selectedOutcome !== i ? 0.5 : 1,
            }}
            onClick={() => onSelectOutcome?.(i)}
          >
            {pct >= 10 ? `${pct}%` : ""}
          </div>
        ))}
      </div>
      <div className="flex w-full mt-1.5">
        {pcts.map((pct, i) => (
          <div
            key={i}
            className="transition-all duration-500 text-center"
            style={{ width: `${pct}%`, minWidth: "0" }}
          >
            {pct >= 12 && (
              <div className="text-[10px] font-mono" style={{ color: OUTCOME_COLORS[i] }}>
                {OUTCOME_LABELS[i]}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
