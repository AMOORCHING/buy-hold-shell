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
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
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
      <div className="text-center text-gray-500 text-sm py-8">
        No trades yet. Be the first!
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {trades.map((trade) => {
        const isBuy = trade.cost > 0;
        const color = OUTCOME_COLORS[trade.outcome_index];
        const label = OUTCOME_LABELS[trade.outcome_index];
        const isCurrentUser = trade.user_id === currentUserId;

        return (
          <div
            key={trade.id}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm ${
              isCurrentUser ? "bg-[#1a1a1a] border border-[#2a2a2a]" : "bg-[#0f0f0f]"
            }`}
          >
            {/* Avatar */}
            <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 bg-[#262626]">
              {trade.user_image ? (
                <Image
                  src={trade.user_image}
                  alt={trade.user_name}
                  width={28}
                  height={28}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                  {trade.user_name[0]}
                </div>
              )}
            </div>
            {/* Content */}
            <div className="flex-1 min-w-0">
              <span className="text-gray-300 font-medium">
                {isCurrentUser ? "You" : trade.user_name}
              </span>{" "}
              <span className="text-gray-500">{isBuy ? "bought" : "sold"}</span>{" "}
              <span className="text-white font-medium">{Math.abs(trade.shares).toFixed(2)} shares</span>{" "}
              <span className="text-gray-500">of</span>{" "}
              <span className="font-semibold" style={{ color }}>
                {label}
              </span>{" "}
              <span className="text-gray-500">{isBuy ? "for" : "receiving"}</span>{" "}
              <span className={isBuy ? "text-red-400" : "text-green-400"}>
                ${Math.abs(trade.cost).toFixed(2)}
              </span>
            </div>
            {/* Time */}
            <div className="text-gray-600 text-xs flex-shrink-0">{timeAgo(trade.created_at)}</div>
          </div>
        );
      })}
    </div>
  );
}
