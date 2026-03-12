"use client";

const OUTCOME_COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e"];
const OUTCOME_LABELS = ["0-25%", "25-50%", "50-75%", "75-100%"];

interface OutcomeCardsProps {
  probabilities: number[];
  userShares: number[];
  selectedOutcome: number | null;
  onSelect: (index: number) => void;
  marketStatus: string;
}

export function OutcomeCards({
  probabilities,
  userShares,
  selectedOutcome,
  onSelect,
  marketStatus,
}: OutcomeCardsProps) {
  const isOpen = marketStatus === "open";

  return (
    <div className="border border-[var(--border)] bg-[var(--surface)]">
      <div className="px-3 py-2">
        <span className="text-[10px] uppercase tracking-widest text-[var(--muted)]">
          {isOpen ? "Pick a range to bet on" : "Outcomes"}
        </span>
      </div>
      <div className="divide-y divide-[var(--border)] border-t border-[var(--border)]">
        {OUTCOME_LABELS.map((label, i) => {
          const prob = probabilities[i] ?? 0.25;
          const pct = Math.round(prob * 100);
          const shares = userShares[i] ?? 0;
          const isSelected = selectedOutcome === i;
          const color = OUTCOME_COLORS[i];

          return (
            <button
              key={i}
              onClick={() => isOpen && onSelect(isSelected ? -1 : i)}
              className={`relative w-full flex items-center justify-between px-3 py-2.5 transition-all duration-150 overflow-hidden ${
                !isOpen ? "opacity-70 cursor-not-allowed" : "cursor-pointer hover:bg-[var(--surface-2)]"
              }`}
              style={isSelected ? { boxShadow: `inset 0 0 0 1px ${color}` } : {}}
            >
              {/* Fill bar background */}
              <div
                className="absolute inset-y-0 left-0 transition-all duration-500 opacity-[0.08]"
                style={{ width: `${pct}%`, backgroundColor: color }}
              />

              <div className="relative flex items-center gap-2.5">
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span className="text-sm font-medium font-mono">{label}</span>
                {shares > 0 && (
                  <span
                    className="text-[10px] font-mono px-1.5 py-0.5 rounded-sm"
                    style={{ color, backgroundColor: `${color}15` }}
                  >
                    {shares.toFixed(1)} shares
                  </span>
                )}
              </div>

              <span className="relative text-base font-bold font-mono" style={{ color }}>
                {pct}%
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
