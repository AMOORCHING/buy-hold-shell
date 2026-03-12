"use client";

import Image from "next/image";

const OUTCOME_COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e"];
const OUTCOME_LABELS = ["0-25%", "25-50%", "50-75%", "75-100%"];

interface Trade {
  id: number;
  user_id: string;
  outcome_index: number;
  shares: number;
  cost: number;
  created_at: string;
  user_name: string;
  user_image: string | null;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

export function TradesFeed({
  trades,
  currentUserId,
}: {
  trades: Trade[];
  currentUserId?: string;
}) {
  if (trades.length === 0) {
    return (
      <div className="text-center text-[var(--muted)] text-xs py-4">
        No trades yet.
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {trades.map((trade) => {
        const isBuy = trade.cost > 0;
        const color = OUTCOME_COLORS[trade.outcome_index];
        const label = OUTCOME_LABELS[trade.outcome_index];
        const isCurrentUser = trade.user_id === currentUserId;

        return (
          <div
            key={trade.id}
            className={`flex items-center gap-2 px-2 py-1.5 text-[11px] border-b border-[var(--border)] last:border-0 ${
              isCurrentUser ? "bg-[var(--surface-2)]" : ""
            }`}
          >
            <div className="w-5 h-5 overflow-hidden flex-shrink-0 bg-[var(--surface-2)]">
              {trade.user_image ? (
                <Image
                  src={trade.user_image}
                  alt={trade.user_name}
                  width={20}
                  height={20}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[9px] text-[var(--muted)]">
                  {trade.user_name[0]}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0 font-mono truncate">
              <span className="font-medium">
                {isCurrentUser ? "You" : trade.user_name.split(" ")[0]}
              </span>{" "}
              <span className="text-[var(--muted)]">{isBuy ? "bought" : "sold"}</span>{" "}
              <span className="font-medium">{Math.abs(trade.shares).toFixed(2)}</span>{" "}
              <span className="font-semibold" style={{ color }}>{label}</span>{" "}
              <span className={isBuy ? "text-red-400" : "text-green-400"}>
                ${Math.abs(trade.cost).toFixed(2)}
              </span>
            </div>
            <div className="text-[var(--muted)] text-[10px] flex-shrink-0 font-mono">{timeAgo(trade.created_at)}</div>
          </div>
        );
      })}
    </div>
  );
}
