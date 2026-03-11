"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { sharesToBuy, revenueToSell, getProbabilities, costToBuy } from "@/lib/lmsr";
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

  // Preview calculations
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

  const avgPrice = previewShares > 0 ? dollarAmount / previewShares : 0;

  const canBuy =
    session &&
    dollarAmount >= 1 &&
    dollarAmount <= 5 &&
    userBalance >= dollarAmount;

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
      className="rounded-xl border bg-[#141414] p-4 mt-3"
      style={{ borderColor: `${color}40` }}
    >
      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setTab("buy")}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
            tab === "buy"
              ? "text-white"
              : "bg-[#1a1a1a] text-gray-400 hover:text-white"
          }`}
          style={tab === "buy" ? { backgroundColor: color } : {}}
        >
          Buy
        </button>
        <button
          onClick={() => setTab("sell")}
          disabled={userShares <= 0}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
            tab === "sell"
              ? "text-white"
              : "bg-[#1a1a1a] text-gray-400 hover:text-white"
          } disabled:opacity-40 disabled:cursor-not-allowed`}
          style={tab === "sell" ? { backgroundColor: color } : {}}
        >
          Sell {userShares > 0 ? `(${userShares.toFixed(2)})` : ""}
        </button>
      </div>

      {tab === "buy" ? (
        <>
          <div className="text-xs text-gray-400 mb-2">
            Buy <span className="font-semibold" style={{ color }}>{label}</span> shares
          </div>
          {/* Quick amounts */}
          <div className="flex gap-2 mb-3">
            {QUICK_AMOUNTS.map((amt) => (
              <button
                key={amt}
                onClick={() => setDollarAmount(amt)}
                className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                  dollarAmount === amt
                    ? "border-white text-white"
                    : "border-[#262626] text-gray-400 hover:border-[#404040]"
                }`}
                style={dollarAmount === amt ? { borderColor: color, color } : {}}
              >
                ${amt}
              </button>
            ))}
          </div>
          {/* Custom input */}
          <div className="mb-3">
            <div className="flex items-center gap-2 bg-[#0a0a0a] border border-[#262626] rounded-lg px-3 py-2">
              <span className="text-gray-500">$</span>
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
                className="flex-1 bg-transparent text-white text-sm outline-none"
              />
            </div>
            {dollarAmount < 1 && (
              <p className="text-red-400 text-xs mt-1">Minimum bet is $1.00</p>
            )}
            {dollarAmount > 5 && (
              <p className="text-red-400 text-xs mt-1">Maximum bet is $5.00</p>
            )}
          </div>
          {/* Preview */}
          <div className="bg-[#0a0a0a] rounded-lg p-3 mb-3 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Shares received</span>
              <span className="text-white font-medium">~{previewShares.toFixed(3)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Avg price/share</span>
              <span className="text-white">${avgPrice.toFixed(4)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">New probability</span>
              <span className="font-medium" style={{ color }}>{Math.round(newProbBuy * 100)}%</span>
            </div>
            <div className="flex justify-between border-t border-[#262626] pt-1.5">
              <span className="text-gray-400">Your balance after</span>
              <span className={userBalance - dollarAmount < 0 ? "text-red-400" : "text-white"}>
                ${(userBalance - dollarAmount).toFixed(2)}
              </span>
            </div>
          </div>
          <button
            onClick={handleTrade}
            disabled={!canBuy || loading}
            className="w-full py-3 rounded-xl font-bold text-white transition-all text-sm disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: canBuy ? color : "#333" }}
          >
            {loading ? "Placing bet..." : !session ? "Sign in to trade" : `Place Bet — $${dollarAmount.toFixed(2)}`}
          </button>
        </>
      ) : (
        <>
          <div className="text-xs text-gray-400 mb-2">
            Sell <span className="font-semibold" style={{ color }}>{label}</span> shares
          </div>
          <div className="mb-3">
            <label className="text-xs text-gray-400 mb-1 block">
              Shares to sell (max: {userShares.toFixed(3)})
            </label>
            <input
              type="range"
              min="0"
              max={userShares}
              step="0.01"
              value={sellShares}
              onChange={(e) => setSellShares(parseFloat(e.target.value))}
              className="w-full mb-2"
            />
            <div className="flex items-center gap-2 bg-[#0a0a0a] border border-[#262626] rounded-lg px-3 py-2">
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
                className="flex-1 bg-transparent text-white text-sm outline-none"
              />
              <button
                onClick={() => setSellShares(userShares)}
                className="text-xs text-gray-400 hover:text-white px-2 py-0.5 rounded bg-[#262626]"
              >
                Max
              </button>
            </div>
          </div>
          {sellShares > 0 && (
            <div className="bg-[#0a0a0a] rounded-lg p-3 mb-3 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">You receive</span>
                <span className="text-green-400 font-medium">${previewRevenue.toFixed(4)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">New probability</span>
                <span className="font-medium" style={{ color }}>{Math.round(newProbSell * 100)}%</span>
              </div>
            </div>
          )}
          <button
            onClick={handleTrade}
            disabled={!canSell || loading}
            className="w-full py-3 rounded-xl font-bold text-white transition-all text-sm disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: canSell ? color : "#333" }}
          >
            {loading ? "Selling..." : `Sell ${sellShares.toFixed(2)} Shares`}
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
