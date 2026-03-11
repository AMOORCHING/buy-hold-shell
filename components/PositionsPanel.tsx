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
  totalDeposited: number;
  balance: number;
}

export function PositionsPanel({
  positions,
  quantities,
  b,
  totalDeposited,
  balance,
}: PositionsPanelProps) {
  const activePositions = positions.filter((p) => p.shares > 0.001);

  if (activePositions.length === 0) {
    return (
      <div className="rounded-xl border border-[#262626] bg-[#141414] p-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">Your Positions</h3>
        <p className="text-gray-500 text-sm">No positions yet. Place a bet to get started!</p>
      </div>
    );
  }

  let totalPositionValue = 0;
  const enriched = activePositions.map((pos) => {
    const sellValue = revenueToSell(quantities, pos.outcome_index, pos.shares, b);
    totalPositionValue += sellValue;
    return { ...pos, sellValue };
  });

  const totalPortfolio = balance + totalPositionValue;
  const pnl = totalPortfolio - totalDeposited;

  return (
    <div className="rounded-xl border border-[#262626] bg-[#141414] p-4">
      <h3 className="text-sm font-semibold text-gray-300 mb-3">Your Positions</h3>
      <div className="space-y-2">
        {enriched.map((pos) => {
          const color = OUTCOME_COLORS[pos.outcome_index];
          const label = OUTCOME_LABELS[pos.outcome_index];
          return (
            <div
              key={pos.outcome_index}
              className="flex items-center justify-between py-2 border-b border-[#1a1a1a] last:border-0"
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                <div>
                  <div className="text-sm font-medium" style={{ color }}>{label}</div>
                  <div className="text-xs text-gray-500">{pos.shares.toFixed(3)} shares</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-white">${pos.sellValue.toFixed(2)}</div>
                <div className="text-xs text-gray-500">sell value</div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-3 pt-3 border-t border-[#262626] space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Balance</span>
          <span className="text-white">${balance.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Position value</span>
          <span className="text-white">${totalPositionValue.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm font-semibold border-t border-[#262626] pt-1">
          <span className="text-gray-300">Portfolio</span>
          <span className="text-white">${totalPortfolio.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">P&L</span>
          <span className={pnl >= 0 ? "text-green-400" : "text-red-400"}>
            {pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}
