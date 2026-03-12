"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";

interface LeaderboardEntry {
  id: string;
  name: string;
  image: string | null;
  balance: number;
  totalDeposited: number;
  positionValue: number;
  portfolioValue: number;
  pnl: number;
  pnlPct: number;
  tradeCount: number;
}

type SortKey = "portfolioValue" | "pnl" | "pnlPct" | "tradeCount";

function Avatar({ name, image, size = 24 }: { name: string; image: string | null; size?: number }) {
  if (image) {
    return (
      <Image
        src={image}
        alt={name}
        width={size}
        height={size}
        className="object-cover"
      />
    );
  }
  return (
    <div
      className="bg-[var(--surface-2)] flex items-center justify-center text-[var(--muted)] font-medium"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {name[0]}
    </div>
  );
}

export default function LeaderboardPage() {
  const { data: session } = useSession();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>("portfolioValue");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/leaderboard")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        setLeaderboard(data.leaderboard ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const sorted = [...leaderboard].sort((a, b) => {
    const mult = sortDir === "desc" ? -1 : 1;
    return mult * (a[sortKey] - b[sortKey]);
  });

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "desc" ? "asc" : "desc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const SortIndicator = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <span className="text-[var(--muted)] ml-1 opacity-40">^</span>;
    return <span className="ml-1">{sortDir === "desc" ? "v" : "^"}</span>;
  };

  return (
    <div className="h-full flex flex-col gap-3 overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5">
        <h1 className="text-sm font-semibold">Leaderboard</h1>
        <span className="text-[10px] font-mono text-[var(--muted)]">
          {leaderboard.length} traders
        </span>
      </div>

      {/* Top 3 strip */}
      {!loading && leaderboard.length > 0 && (
        <div className="flex-shrink-0 grid grid-cols-3 gap-px bg-[var(--border)]">
          {[0, 1, 2].map((pos) => {
            const entry = leaderboard[pos];
            if (!entry) return <div key={pos} className="bg-[var(--background)]" />;
            const rankLabels = ["1st", "2nd", "3rd"];
            const rankColors = ["text-yellow-400", "text-[var(--muted)]", "text-orange-400"];
            return (
              <div key={pos} className="bg-[var(--surface)] p-4 flex items-center gap-3">
                <span className={`text-xs font-bold font-mono ${rankColors[pos]}`}>
                  {rankLabels[pos]}
                </span>
                <Avatar name={entry.name} image={entry.image} size={28} />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium truncate">{entry.name}</div>
                  <div className="text-xs font-mono text-green-400">
                    ${entry.portfolioValue.toFixed(2)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table */}
      <div className="flex-1 border border-[var(--border)] bg-[var(--surface)] overflow-hidden flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto min-h-0">
          <table className="w-full">
            <thead className="sticky top-0 bg-[var(--surface)] z-10">
              <tr className="border-b border-[var(--border)] text-[10px] uppercase tracking-widest text-[var(--muted)]">
                <th className="px-4 py-2.5 text-left w-10 font-medium">#</th>
                <th className="px-4 py-2.5 text-left font-medium">Player</th>
                <th
                  className="px-4 py-2.5 text-right cursor-pointer hover:text-[var(--foreground)] font-medium"
                  onClick={() => handleSort("portfolioValue")}
                >
                  Portfolio <SortIndicator col="portfolioValue" />
                </th>
                <th
                  className="px-4 py-2.5 text-right cursor-pointer hover:text-[var(--foreground)] font-medium hidden md:table-cell"
                  onClick={() => handleSort("pnl")}
                >
                  P&L <SortIndicator col="pnl" />
                </th>
                <th
                  className="px-4 py-2.5 text-right cursor-pointer hover:text-[var(--foreground)] font-medium hidden sm:table-cell"
                  onClick={() => handleSort("pnlPct")}
                >
                  Return <SortIndicator col="pnlPct" />
                </th>
                <th
                  className="px-4 py-2.5 text-right cursor-pointer hover:text-[var(--foreground)] font-medium hidden lg:table-cell"
                  onClick={() => handleSort("tradeCount")}
                >
                  Trades <SortIndicator col="tradeCount" />
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-[var(--border)]">
                    <td colSpan={6} className="px-4 py-3">
                      <div className="h-3 bg-[var(--surface-2)] animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : sorted.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-[var(--muted)] py-8 text-xs">
                    No traders yet.
                  </td>
                </tr>
              ) : (
                sorted.map((entry) => {
                  const rank = leaderboard.findIndex((e) => e.id === entry.id) + 1;
                  const isMe = entry.id === session?.user?.id;
                  return (
                    <tr
                      key={entry.id}
                      className={`border-b border-[var(--border)] text-xs transition-colors ${
                        isMe
                          ? "bg-[var(--surface-2)]"
                          : "hover:bg-[var(--surface-2)]"
                      }`}
                    >
                      <td className="px-4 py-2.5 text-[var(--muted)] font-mono font-medium">
                        {rank}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <Avatar name={entry.name} image={entry.image} size={22} />
                          <div className="min-w-0">
                            <div className="font-medium truncate">
                              {entry.name}
                              {isMe && (
                                <span className="ml-1.5 text-[10px] text-blue-400 font-mono">(you)</span>
                              )}
                            </div>
                            <div className="text-[10px] text-[var(--muted)] font-mono">
                              dep ${entry.totalDeposited.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-right font-semibold font-mono">
                        ${entry.portfolioValue.toFixed(2)}
                      </td>
                      <td className="px-4 py-2.5 text-right hidden md:table-cell font-mono">
                        <span className={entry.pnl >= 0 ? "text-green-400" : "text-red-400"}>
                          {entry.pnl >= 0 ? "+" : ""}${entry.pnl.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right hidden sm:table-cell font-mono">
                        <span className={entry.pnlPct >= 0 ? "text-green-400" : "text-red-400"}>
                          {entry.pnlPct >= 0 ? "+" : ""}
                          {entry.pnlPct.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right text-[var(--muted)] hidden lg:table-cell font-mono">
                        {entry.tradeCount}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
