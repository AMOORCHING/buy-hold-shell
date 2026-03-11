"use client";

import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import { ProbabilityBar } from "@/components/ProbabilityBar";
import { OutcomeCards } from "@/components/OutcomeCards";
import { TradingPanel } from "@/components/TradingPanel";
import { PositionsPanel } from "@/components/PositionsPanel";
import { TradesFeed } from "@/components/TradesFeed";
import { Countdown } from "@/components/Countdown";
import { useMarketStream } from "@/lib/useMarketStream";

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  open: { label: "OPEN", className: "bg-green-500/20 text-green-400 border-green-500/40" },
  closed: { label: "CLOSED", className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/40" },
  resolved: { label: "RESOLVED", className: "bg-blue-500/20 text-blue-400 border-blue-500/40" },
};

const OUTCOME_LABELS = ["0-25%", "25-50%", "50-75%", "75-100%"];

interface Market {
  id: number;
  title: string;
  description: string;
  outcomes: string[];
  b: number;
  quantities: number[];
  probabilities: number[];
  status: string;
  resolved_outcome: number | null;
  closes_at: string;
  resolves_at: string;
  userPositions: { outcome_index: number; shares: number }[];
  totalVolume: number;
}

function SignInPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="bg-[#141414] border border-[#262626] rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
        <div className="text-5xl mb-4">🐚</div>
        <h1 className="text-2xl font-bold text-white mb-2">Shell Markets</h1>
        <p className="text-gray-400 mb-6">Predict. Bet. Bragging rights.</p>
        <div className="bg-[#0a0a0a] rounded-xl p-4 mb-6 text-left space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <span className="text-green-400">✓</span> Only for Startup Shell members
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <span className="text-green-400">✓</span> $1–$5 bets, real money via Venmo/cash
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <span className="text-green-400">✓</span> Resolves May 2nd, 2026
          </div>
        </div>
        <button
          onClick={() => signIn("google")}
          className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-900 font-semibold py-3 px-6 rounded-xl transition-colors text-sm"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Sign in with Google
        </button>
        <p className="text-gray-600 text-xs mt-4">
          Only for Startup Shell members. Contact an exec board member to get your account set up.
        </p>
      </div>
    </div>
  );
}

export default function HomePage() {
  const { data: session, update: updateSession } = useSession();
  const [market, setMarket] = useState<Market | null>(null);
  const [selectedOutcome, setSelectedOutcome] = useState<number | null>(null);
  const [userBalance, setUserBalance] = useState(0);
  const [userPositions, setUserPositions] = useState<{ outcome_index: number; shares: number }[]>([]);

  // Fetch initial market data
  useEffect(() => {
    fetch("/api/markets/1")
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) {
          setMarket(data);
          setUserPositions(data.userPositions ?? []);
        }
      });
  }, [session?.user?.id]);

  // Keep balance in sync from session
  useEffect(() => {
    setUserBalance(session?.user?.balance ?? 0);
  }, [session?.user?.balance]);

  // Live SSE updates
  const { probabilities, quantities, recentTrades, totalVolume, isConnected } =
    useMarketStream("1");

  // Merge SSE data into market state
  useEffect(() => {
    if (probabilities.some((p) => p !== 0.25)) {
      setMarket((prev) =>
        prev ? { ...prev, probabilities, quantities, totalVolume } : prev
      );
    }
  }, [probabilities, quantities, totalVolume]);

  const handleTradeSuccess = async (data: {
    newBalance: number;
    probabilities: number[];
    quantities: number[];
    userPositions: { outcome_index: number; shares: number }[];
  }) => {
    setUserBalance(data.newBalance);
    setUserPositions(data.userPositions);
    setMarket((prev) =>
      prev
        ? { ...prev, probabilities: data.probabilities, quantities: data.quantities }
        : prev
    );
    // Refresh session to update nav balance
    await updateSession();
  };

  if (!session) return <SignInPage />;

  if (!market) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-[#141414] rounded-lg w-2/3" />
        <div className="h-12 bg-[#141414] rounded-xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-[#141414] rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const badge = STATUS_BADGE[market.status] ?? STATUS_BADGE.open;
  const userSharesPerOutcome = Array.from({ length: 4 }, (_, i) => {
    const pos = userPositions.find((p) => p.outcome_index === i);
    return pos?.shares ?? 0;
  });

  const resolvedLabel =
    market.resolved_outcome !== null ? OUTCOME_LABELS[market.resolved_outcome] : null;

  return (
    <div className="space-y-5">
      {/* Market header */}
      <div className="bg-[#141414] border border-[#262626] rounded-2xl p-5">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full border ${badge.className}`}
              >
                {badge.label}
              </span>
              <div
                className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-green-400" : "bg-gray-600"}`}
                title={isConnected ? "Live" : "Connecting..."}
              />
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-white">{market.title}</h1>
            <p className="text-gray-400 text-sm mt-1 max-w-xl">{market.description}</p>
          </div>
          <div className="text-right space-y-1">
            <Countdown targetDate={market.resolves_at} />
            <div className="text-xs text-gray-500">
              Volume:{" "}
              <span className="text-gray-300 font-medium">${totalVolume.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Resolved banner */}
        {market.status === "resolved" && resolvedLabel && (
          <div className="mb-4 p-3 bg-blue-900/30 border border-blue-500/40 rounded-xl text-sm text-blue-300">
            Market resolved — winning outcome: <span className="font-bold">{resolvedLabel}</span>
          </div>
        )}

        {/* Probability bar */}
        <ProbabilityBar
          probabilities={market.probabilities}
          selectedOutcome={selectedOutcome}
          onSelectOutcome={(i) => {
            if (market.status === "open") {
              setSelectedOutcome(selectedOutcome === i ? null : i);
            }
          }}
        />
      </div>

      {/* Layout: main + sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4">
          {/* Outcome cards */}
          <OutcomeCards
            probabilities={market.probabilities}
            userShares={userSharesPerOutcome}
            selectedOutcome={selectedOutcome}
            onSelect={(i) => setSelectedOutcome(selectedOutcome === i ? null : i)}
            marketStatus={market.status}
          />

          {/* Trading panel */}
          {selectedOutcome !== null && market.status === "open" && (
            <TradingPanel
              outcomeIndex={selectedOutcome}
              quantities={market.quantities}
              b={market.b}
              marketId={market.id}
              userBalance={userBalance}
              userShares={userSharesPerOutcome[selectedOutcome]}
              onTradeSuccess={handleTradeSuccess}
            />
          )}

          {market.status !== "open" && selectedOutcome !== null && (
            <div className="text-center text-gray-500 text-sm py-4 bg-[#141414] rounded-xl border border-[#262626]">
              Trading is {market.status}. No new trades can be placed.
            </div>
          )}

          {/* Activity feed */}
          <div className="bg-[#141414] border border-[#262626] rounded-2xl p-4">
            <h3 className="text-sm font-semibold text-gray-300 mb-3">Recent Activity</h3>
            <TradesFeed trades={recentTrades} currentUserId={session?.user?.id} />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <PositionsPanel
            positions={userPositions}
            quantities={market.quantities}
            b={market.b}
            totalDeposited={0}
            balance={userBalance}
          />

          {/* Market info */}
          <div className="bg-[#141414] border border-[#262626] rounded-xl p-4 text-sm space-y-2">
            <h3 className="font-semibold text-gray-300 mb-2">Market Info</h3>
            <div className="flex justify-between">
              <span className="text-gray-500">Closes</span>
              <span className="text-gray-300">
                {new Date(market.closes_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Resolves</span>
              <span className="text-gray-300">May 2, 2026</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Bet range</span>
              <span className="text-gray-300">$1 – $5</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Payout</span>
              <span className="text-gray-300">$1.00 / share</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Your balance</span>
              <span className="text-white font-semibold">${userBalance.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
