"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { sharesToBuy, revenueToSell, getProbabilities } from "@/lib/lmsr";
import { Modal } from "./Modal";
import { useToast } from "./Toast";

const OUTCOME_COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e"];
const OUTCOME_LABELS = ["0-25%", "25-50%", "50-75%", "75-100%"];
const QUICK_AMOUNTS = [1, 2, 3, 5];

interface TradingPanelProps {
  outcomeIndex: number;
  quantities: number[];
  b: number;
  marketId: number;
  userBalance: number;
  userShares: number;
  onTradeSuccess: (data: {
    newBalance: number;
    probabilities: number[];
    quantities: number[];
    userPositions: { outcome_index: number; shares: number }[];
  }) => void;
}

export function TradingPanel({
  outcomeIndex,
  quantities,
  b,
  marketId,
  userBalance,
  userShares,
  onTradeSuccess,
}: TradingPanelProps) {
  const { data: session } = useSession();
  const { addToast } = useToast();
  const [tab, setTab] = useState<"buy" | "sell">("buy");
  const [dollarAmount, setDollarAmount] = useState(2);
  const [sellShares, setSellShares] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const color = OUTCOME_COLORS[outcomeIndex];
  const label = OUTCOME_LABELS[outcomeIndex];

  const previewShares = tab === "buy" ? sharesToBuy(quantities, outcomeIndex, dollarAmount, b) : 0;
  const previewRevenue = tab === "sell" && sellShares > 0
    ? revenueToSell(quantities, outcomeIndex, sellShares, b)
    : 0;

  const newQuantitiesBuy = [...quantities];
  newQuantitiesBuy[outcomeIndex] += previewShares;
  const newProbBuy = getProbabilities(newQuantitiesBuy, b)[outcomeIndex];

  const newQuantitiesSell = [...quantities];
  newQuantitiesSell[outcomeIndex] -= sellShares;
  const newProbSell = sellShares > 0 ? getProbabilities(newQuantitiesSell, b)[outcomeIndex] : getProbabilities(quantities, b)[outcomeIndex];

  const canBuy = session && dollarAmount >= 1 && dollarAmount <= 5 && userBalance >= dollarAmount;
  const canSell = session && sellShares > 0 && sellShares <= userShares;

  const executeTrade = async () => {
    setLoading(true);
    try {
      const body =
        tab === "buy"
          ? { outcomeIndex, dollarAmount, action: "buy" }
          : { outcomeIndex, shares: sellShares, action: "sell" };

      const res = await fetch(`/api/markets/${marketId}/trade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        addToast(data.error || "Trade failed", "error");
        return;
      }

      if (tab === "buy") {
        addToast(
          `Bought ${data.shares.toFixed(2)} shares of ${label} for $${data.cost.toFixed(2)}`,
          "success"
        );
      } else {
        addToast(
          `Sold ${sellShares.toFixed(2)} shares of ${label} for $${data.revenue.toFixed(2)}`,
          "success"
        );
      }

      onTradeSuccess(data);
    } catch {
      addToast("Network error. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleTrade = () => {
    if (tab === "buy" && dollarAmount > 3) {
      setShowConfirm(true);
    } else {
      executeTrade();
    }
  };

  useEffect(() => {
    if (tab === "sell" && userShares > 0) {
      setSellShares(Math.min(1, userShares));
    }
  }, [tab, userShares]);

  return (
    <div
      className="border bg-[var(--surface)] p-3"
      style={{ borderColor: `${color}30` }}
    >
      {/* Tabs */}
      <div className="flex gap-1 mb-3">
        <button
          onClick={() => setTab("buy")}
          className={`flex-1 py-1.5 text-xs font-semibold transition-colors ${
            tab === "buy" ? "text-white" : "bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--foreground)]"
          }`}
          style={tab === "buy" ? { backgroundColor: color } : {}}
        >
          Buy
        </button>
        <button
          onClick={() => setTab("sell")}
          disabled={userShares <= 0}
          className={`flex-1 py-1.5 text-xs font-semibold transition-colors ${
            tab === "sell" ? "text-white" : "bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--foreground)]"
          } disabled:opacity-40 disabled:cursor-not-allowed`}
          style={tab === "sell" ? { backgroundColor: color } : {}}
        >
          Sell {userShares > 0 ? `(${userShares.toFixed(2)})` : ""}
        </button>
      </div>

      {tab === "buy" ? (
        <>
          <div className="text-[10px] text-[var(--muted)] mb-2">
            Buy <span className="font-semibold" style={{ color }}>{label}</span>
          </div>
          <div className="flex gap-1 mb-2">
            {QUICK_AMOUNTS.map((amt) => (
              <button
                key={amt}
                onClick={() => setDollarAmount(amt)}
                className={`flex-1 py-1 text-xs font-mono transition-colors border ${
                  dollarAmount === amt
                    ? "border-current"
                    : "border-[var(--border)] text-[var(--muted)] hover:border-[var(--border-hover)]"
                }`}
                style={dollarAmount === amt ? { borderColor: color, color } : {}}
              >
                ${amt}
              </button>
            ))}
          </div>
          <div className="mb-2">
            <div className="flex items-center gap-2 bg-[var(--background)] border border-[var(--border)] px-3 py-1.5">
              <span className="text-[var(--muted)] text-xs">$</span>
              <input
                type="number"
                min="1"
                max="5"
                step="0.25"
                value={dollarAmount}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  if (!isNaN(v)) setDollarAmount(Math.max(1, Math.min(5, v)));
                }}
                className="flex-1 bg-transparent text-sm font-mono outline-none"
              />
            </div>
          </div>
          <div className="bg-[var(--background)] border border-[var(--border)] p-2.5 mb-2 space-y-1 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-[var(--muted)]">You get</span>
              <span>~{previewShares.toFixed(2)} shares</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted)]">New odds</span>
              <span style={{ color }}>{Math.round(newProbBuy * 100)}%</span>
            </div>
            <div className="flex justify-between border-t border-[var(--border)] pt-1">
              <span className="text-[var(--muted)]">Remaining</span>
              <span className={userBalance - dollarAmount < 0 ? "text-red-400" : ""}>
                ${(userBalance - dollarAmount).toFixed(2)}
              </span>
            </div>
          </div>
          <button
            onClick={handleTrade}
            disabled={!canBuy || loading}
            className="w-full py-2 font-bold text-white transition-all text-xs disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: canBuy ? color : "#333" }}
          >
            {loading ? "Placing..." : !session ? "Sign in" : `Bet $${dollarAmount.toFixed(2)}`}
          </button>
        </>
      ) : (
        <>
          <div className="text-[10px] text-[var(--muted)] mb-2">
            Sell <span className="font-semibold" style={{ color }}>{label}</span>
          </div>
          <div className="mb-2">
            <input
              type="range"
              min="0"
              max={userShares}
              step="0.01"
              value={sellShares}
              onChange={(e) => setSellShares(parseFloat(e.target.value))}
              className="w-full mb-1.5"
            />
            <div className="flex items-center gap-2 bg-[var(--background)] border border-[var(--border)] px-3 py-1.5">
              <input
                type="number"
                min="0"
                max={userShares}
                step="0.01"
                value={sellShares}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  if (!isNaN(v)) setSellShares(Math.max(0, Math.min(userShares, v)));
                }}
                className="flex-1 bg-transparent text-sm font-mono outline-none"
              />
              <button
                onClick={() => setSellShares(userShares)}
                className="text-[10px] text-[var(--muted)] hover:text-[var(--foreground)] px-2 py-0.5 bg-[var(--surface-2)]"
              >
                Max
              </button>
            </div>
          </div>
          {sellShares > 0 && (
            <div className="bg-[var(--background)] border border-[var(--border)] p-2.5 mb-2 space-y-1 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">You receive</span>
                <span className="text-green-400">${previewRevenue.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">New odds</span>
                <span style={{ color }}>{Math.round(newProbSell * 100)}%</span>
              </div>
            </div>
          )}
          <button
            onClick={handleTrade}
            disabled={!canSell || loading}
            className="w-full py-2 font-bold text-white transition-all text-xs disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: canSell ? color : "#333" }}
          >
            {loading ? "Selling..." : `Sell ${sellShares.toFixed(2)}`}
          </button>
        </>
      )}

      <Modal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={() => {
          setShowConfirm(false);
          executeTrade();
        }}
        title={`Confirm $${dollarAmount.toFixed(2)} bet`}
        description={`You're about to spend $${dollarAmount.toFixed(2)} on ~${previewShares.toFixed(2)} shares of ${label}. This is more than $3 — are you sure?`}
        confirmText="Place Bet"
        confirmClassName="text-white font-bold"
        confirmStyle={{ backgroundColor: color } as React.CSSProperties}
      />
    </div>
  );
}
