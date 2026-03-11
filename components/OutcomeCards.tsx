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
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {OUTCOME_LABELS.map((label, i) => {
        const prob = probabilities[i] ?? 0.25;
        const price = prob;
        const shares = userShares[i] ?? 0;
        const isSelected = selectedOutcome === i;
        const color = OUTCOME_COLORS[i];

        return (
          <button
            key={i}
            onClick={() => isOpen && onSelect(isSelected ? -1 : i)}
            className={`relative p-4 rounded-xl border text-left transition-all duration-200 ${
              isSelected
                ? "border-2 shadow-lg"
                : "border-[#262626] hover:border-[#404040]"
            } ${!isOpen ? "opacity-70 cursor-not-allowed" : "cursor-pointer"} bg-[#141414]`}
            style={
              isSelected
                ? { borderColor: color, boxShadow: `0 0 20px ${color}30` }
                : {}
            }
          >
            <div
              className="absolute top-0 left-0 w-1 h-full rounded-l-xl"
              style={{ backgroundColor: color }}
            />
            <div className="pl-2">
              <div className="text-xs text-gray-400 mb-1">{label}</div>
              <div className="text-2xl font-bold text-white">{Math.round(prob * 100)}%</div>
              <div className="text-xs text-gray-500 mt-1">
                ${price.toFixed(2)}/share
              </div>
              {shares > 0 && (
                <div
                  className="text-xs font-medium mt-2 px-2 py-0.5 rounded-full inline-block"
                  style={{ backgroundColor: `${color}20`, color }}
                >
                  {shares.toFixed(2)} shares
                </div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
