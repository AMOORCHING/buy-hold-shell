"use client";

import { revenueToSell } from "@/lib/lmsr";

const OUTCOME_COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e"];
const OUTCOME_LABELS = ["0-25%", "25-50%", "50-75%", "75-100%"];

interface Position {
  outcome_index: number;
  shares: number;
}

interface PositionsPanelProps {
  positions: Position[];
  quantities: number[];
  b: number;
  balance: number;
}

export function PositionsPanel({
  positions,
  quantities,
  b,
  balance,
}: PositionsPanelProps) {
  const activePositions = positions.filter((p) => p.shares > 0.001);

  if (activePositions.length === 0) {
    return (
      <div className="border border-[var(--border)] bg-[var(--surface)] p-3">
        <h3 className="text-[10px] uppercase tracking-widest text-[var(--muted)] mb-2">Your Bets</h3>
        <p className="text-[var(--muted)] text-xs">No bets yet. Pick an outcome to start.</p>
      </div>
    );
  }

  let totalPositionValue = 0;
  const enriched = activePositions.map((pos) => {
    const sellValue = revenueToSell(quantities, pos.outcome_index, pos.shares, b);
    totalPositionValue += sellValue;
    return { ...pos, sellValue };
  });

  return (
    <div className="border border-[var(--border)] bg-[var(--surface)] p-3">
      <h3 className="text-[10px] uppercase tracking-widest text-[var(--muted)] mb-2">Your Bets</h3>
      <div className="space-y-1">
        {enriched.map((pos) => {
          const color = OUTCOME_COLORS[pos.outcome_index];
          const label = OUTCOME_LABELS[pos.outcome_index];
          return (
            <div
              key={pos.outcome_index}
              className="flex items-center justify-between py-1.5 border-b border-[var(--border)] last:border-0"
            >
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5" style={{ backgroundColor: color }} />
                <span className="text-xs font-medium font-mono" style={{ color }}>{label}</span>
                <span className="text-[10px] text-[var(--muted)] font-mono">
                  {pos.shares.toFixed(1)} shares
                </span>
              </div>
              <span className="text-xs font-mono">${pos.sellValue.toFixed(2)}</span>
            </div>
          );
        })}
      </div>
      <div className="mt-2 pt-2 border-t border-[var(--border)] flex justify-between text-xs font-mono">
        <span className="text-[var(--muted)]">Balance</span>
        <span>${balance.toFixed(2)}</span>
      </div>
      <div className="flex justify-between text-xs font-mono mt-0.5">
        <span className="text-[var(--muted)]">Bet value</span>
        <span>${totalPositionValue.toFixed(2)}</span>
      </div>
    </div>
  );
}
