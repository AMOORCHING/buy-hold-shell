"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { OutcomeCards } from "@/components/OutcomeCards";
import { TradingPanel } from "@/components/TradingPanel";
import { PositionsPanel } from "@/components/PositionsPanel";
import { TradesFeed } from "@/components/TradesFeed";
import { Countdown } from "@/components/Countdown";
import { useMarketStream } from "@/lib/useMarketStream";
import { ProbabilityChart, type HistoryPoint } from "@/components/ProbabilityChart";
import { LandingPage } from "@/components/LandingPage";

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  open: { label: "OPEN", className: "bg-green-500/20 text-green-400" },
  closed: { label: "CLOSED", className: "bg-yellow-500/20 text-yellow-400" },
  resolved: { label: "RESOLVED", className: "bg-blue-500/20 text-blue-400" },
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
  return <LandingPage />;
}

export default function HomePage() {
  const { data: session, update: updateSession } = useSession();
  const [market, setMarket] = useState<Market | null>(null);
  const [selectedOutcome, setSelectedOutcome] = useState<number | null>(null);
  const [userBalance, setUserBalance] = useState(0);
  const [userPositions, setUserPositions] = useState<{ outcome_index: number; shares: number }[]>([]);
  const [history, setHistory] = useState<HistoryPoint[]>([]);

  useEffect(() => {
    fetch("/api/markets/1")
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) {
          setMarket(data);
          setUserPositions(data.userPositions ?? []);
        }
      });
    fetch("/api/markets/1/history")
      .then((r) => r.json())
      .then((data) => {
        if (data.history) setHistory(data.history);
      });
  }, [session?.user?.id]);

  useEffect(() => {
    setUserBalance(session?.user?.balance ?? 0);
  }, [session?.user?.balance]);

  const { probabilities, quantities, recentTrades, totalVolume, isConnected } =
    useMarketStream("1");

  useEffect(() => {
    if (probabilities.some((p) => p !== 0.25)) {
      setMarket((prev) =>
        prev ? { ...prev, probabilities, quantities, totalVolume } : prev
      );
      setHistory((prev) => {
        if (prev.length === 0) return prev;
        const last = prev[prev.length - 1];
        if (last.probabilities.every((p, i) => p === probabilities[i])) return prev;
        return [...prev, { probabilities, created_at: new Date().toISOString() }];
      });
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
    setHistory((prev) => [
      ...prev,
      { probabilities: data.probabilities, created_at: new Date().toISOString() },
    ]);
    await updateSession();
  };

  if (!session) return <SignInPage />;

  if (!market) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-xs text-[var(--muted)] font-mono">Loading market...</div>
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
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 flex flex-wrap items-center justify-between gap-3 border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5">
        <div className="flex items-center gap-3">
          <span className={`text-[10px] font-bold font-mono px-2 py-0.5 ${badge.className}`}>
            {badge.label}
          </span>
          <div
            className={`w-1.5 h-1.5 ${isConnected ? "bg-green-400" : "bg-[var(--muted)]"}`}
            title={isConnected ? "Live" : "Connecting..."}
          />
          <h1 className="text-sm font-semibold">{market.title}</h1>
        </div>
        <Countdown targetDate={market.resolves_at} />
      </div>

      {/* Resolved banner */}
      {market.status === "resolved" && resolvedLabel && (
        <div className="shrink-0 px-3 py-2 mt-3 bg-blue-900/20 border border-blue-500/30 text-xs text-blue-300 font-mono">
          Resolved: winner = <span className="font-bold">{resolvedLabel}</span>
        </div>
      )}

      {/* Scrollable area — scrollbar hugs the right page edge */}
      <div className="flex-1 overflow-y-auto min-h-0 -mr-4 pr-4 mt-3">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 lg:items-start">
          {/* Left: scrollable content */}
          <div className="lg:col-span-8 flex flex-col gap-3 pb-3">
            <OutcomeCards
              probabilities={market.probabilities}
              userShares={userSharesPerOutcome}
              selectedOutcome={selectedOutcome}
              onSelect={(i) => setSelectedOutcome(selectedOutcome === i ? null : i)}
              marketStatus={market.status}
            />

            <div className="border border-[var(--border)] bg-[var(--surface)] p-4">
              <ProbabilityChart history={history} outcomes={market.outcomes} />
            </div>

            <div className="border border-[var(--border)] bg-[var(--surface)] flex flex-col max-h-56">
              <h3 className="text-[10px] uppercase tracking-widest text-[var(--muted)] px-3 pt-3 pb-2 shrink-0">
                Recent Activity
              </h3>
              <div className="flex-1 overflow-y-auto min-h-0">
                <TradesFeed trades={recentTrades} currentUserId={session?.user?.id} />
              </div>
            </div>
          </div>

          {/* Right: sticky sidebar fills viewport height */}
          <div className="lg:col-span-4 lg:sticky lg:top-0 flex flex-col gap-3 pb-3 lg:h-[calc(100vh-8.5rem)]">
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
              <div className="text-center text-[var(--muted)] text-xs py-3 bg-[var(--surface)] border border-[var(--border)]">
                Trading {market.status}.
              </div>
            )}

            <div className="flex-1 min-h-0">
              <PositionsPanel
                positions={userPositions}
                quantities={market.quantities}
                b={market.b}
                balance={userBalance}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
