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

const MEDALS = ["🥇", "🥈", "🥉"];

function Avatar({ name, image, size = 32 }: { name: string; image: string | null; size?: number }) {
  if (image) {
    return (
      <Image
        src={image}
        alt={name}
        width={size}
        height={size}
        className="rounded-full object-cover"
      />
    );
  }
  return (
    <div
      className="rounded-full bg-[#262626] flex items-center justify-center text-gray-400 font-medium"
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
      .then((r) => r.json())
      .then((data) => {
        setLeaderboard(data.leaderboard ?? []);
        setLoading(false);
      });
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

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <span className="text-gray-600 ml-1">↕</span>;
    return <span className="text-white ml-1">{sortDir === "desc" ? "↓" : "↑"}</span>;
  };

  const top3 = leaderboard.slice(0, 3);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Leaderboard</h1>

      {/* Podium */}
      {!loading && top3.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[1, 0, 2].map((pos) => {
            const entry = top3[pos];
            if (!entry) return <div key={pos} />;
            const heights = ["h-28", "h-36", "h-24"];
            return (
              <div key={pos} className="flex flex-col items-center gap-2">
                <div className="text-2xl">{MEDALS[pos]}</div>
                <Avatar name={entry.name} image={entry.image} size={pos === 0 ? 56 : 44} />
                <div className="text-center">
                  <div className="text-sm font-semibold text-white truncate max-w-24">
                    {entry.name.split(" ")[0]}
                  </div>
                  <div className="text-xs font-bold text-green-400">
                    ${entry.portfolioValue.toFixed(2)}
                  </div>
                </div>
                <div
                  className={`w-full ${heights[pos]} rounded-t-xl flex items-end justify-center pb-2 ${
                    pos === 0
                      ? "bg-yellow-500/20 border border-yellow-500/40"
                      : pos === 1
                      ? "bg-gray-500/20 border border-gray-500/40"
                      : "bg-orange-500/20 border border-orange-500/40"
                  }`}
                >
                  <span className="text-2xl font-black text-gray-500">{pos + 1}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full table */}
      <div className="bg-[#141414] border border-[#262626] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#262626] text-xs text-gray-400">
                <th className="px-4 py-3 text-left w-10">#</th>
                <th className="px-4 py-3 text-left">Player</th>
                <th
                  className="px-4 py-3 text-right cursor-pointer hover:text-white"
                  onClick={() => handleSort("portfolioValue")}
                >
                  Portfolio <SortIcon col="portfolioValue" />
                </th>
                <th
                  className="px-4 py-3 text-right cursor-pointer hover:text-white hidden md:table-cell"
                  onClick={() => handleSort("pnl")}
                >
                  P&L <SortIcon col="pnl" />
                </th>
                <th
                  className="px-4 py-3 text-right cursor-pointer hover:text-white hidden sm:table-cell"
                  onClick={() => handleSort("pnlPct")}
                >
                  P&L % <SortIcon col="pnlPct" />
                </th>
                <th
                  className="px-4 py-3 text-right cursor-pointer hover:text-white hidden lg:table-cell"
                  onClick={() => handleSort("tradeCount")}
                >
                  Trades <SortIcon col="tradeCount" />
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-[#1a1a1a]">
                    <td colSpan={6} className="px-4 py-4">
                      <div className="h-4 bg-[#1a1a1a] rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : sorted.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-gray-500 py-8 text-sm">
                    No traders yet. Be the first!
                  </td>
                </tr>
              ) : (
                sorted.map((entry, idx) => {
                  const rank = leaderboard.findIndex((e) => e.id === entry.id) + 1;
                  const isMe = entry.id === session?.user?.id;
                  return (
                    <tr
                      key={entry.id}
                      className={`border-b border-[#1a1a1a] text-sm transition-colors ${
                        isMe
                          ? "bg-[#1a1a1a] border-l-2 border-l-blue-500"
                          : "hover:bg-[#0f0f0f]"
                      }`}
                    >
                      <td className="px-4 py-3 text-gray-500 font-medium">
                        {rank <= 3 ? MEDALS[rank - 1] : rank}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar name={entry.name} image={entry.image} size={28} />
                          <div>
                            <div className="font-medium text-white">
                              {entry.name}
                              {isMe && (
                                <span className="ml-1.5 text-xs text-blue-400">(you)</span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500">
                              Deposited ${entry.totalDeposited.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-white">
                        ${entry.portfolioValue.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right hidden md:table-cell">
                        <span className={entry.pnl >= 0 ? "text-green-400" : "text-red-400"}>
                          {entry.pnl >= 0 ? "+" : ""}${entry.pnl.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right hidden sm:table-cell">
                        <span className={entry.pnlPct >= 0 ? "text-green-400" : "text-red-400"}>
                          {entry.pnlPct >= 0 ? "+" : ""}
                          {entry.pnlPct.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-400 hidden lg:table-cell">
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
