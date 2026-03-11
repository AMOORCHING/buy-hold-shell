"use client";

import { useState } from "react";
import { Modal } from "./Modal";
import { useToast } from "./Toast";

const OUTCOME_LABELS = ["0-25%", "25-50%", "50-75%", "75-100%"];
const OUTCOME_COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e"];

interface Market {
  id: number;
  status: string;
  resolved_outcome: number | null;
  probabilities: number[];
}

interface AdminResolveProps {
  market: Market;
  onRefresh: () => void;
}

export function AdminResolve({ market, onRefresh }: AdminResolveProps) {
  const { addToast } = useToast();
  const [selectedOutcome, setSelectedOutcome] = useState<number | null>(null);
  const [previewData, setPreviewData] = useState<{
    payouts: { userName: string; shares: number; payout: number }[];
    totalPayout: number;
  } | null>(null);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resolveResult, setResolveResult] = useState<{
    payouts: { userId: string; userName: string; shares: number; payout: number }[];
    totalPayout: number;
  } | null>(null);

  const handleClose = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/close", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ marketId: market.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        addToast(data.error || "Failed to close market", "error");
      } else {
        addToast("Market closed. Trading is stopped.", "info");
        onRefresh();
      }
    } catch {
      addToast("Network error", "error");
    } finally {
      setLoading(false);
      setShowCloseModal(false);
    }
  };

  const handleResolve = async () => {
    if (selectedOutcome === null) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ marketId: market.id, outcomeIndex: selectedOutcome }),
      });
      const data = await res.json();
      if (!res.ok) {
        addToast(data.error || "Failed to resolve market", "error");
      } else {
        addToast(`Market resolved! Total payout: $${data.totalPayout.toFixed(2)}`, "success");
        setResolveResult(data);
        onRefresh();
      }
    } catch {
      addToast("Network error", "error");
    } finally {
      setLoading(false);
      setShowResolveModal(false);
    }
  };

  if (market.status === "resolved") {
    return (
      <div className="bg-[#141414] border border-[#262626] rounded-xl p-5">
        <h3 className="text-base font-semibold text-white mb-2">Market Resolved</h3>
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-sm">Winning outcome:</span>
          <span
            className="font-bold"
            style={{ color: OUTCOME_COLORS[market.resolved_outcome ?? 0] }}
          >
            {market.resolved_outcome !== null ? OUTCOME_LABELS[market.resolved_outcome] : "—"}
          </span>
        </div>
        {resolveResult && (
          <div className="mt-4 space-y-2">
            <div className="text-sm text-gray-400">
              Total paid out:{" "}
              <span className="text-green-400 font-medium">
                ${resolveResult.totalPayout.toFixed(2)}
              </span>
            </div>
            {resolveResult.payouts.map((p, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-gray-300">{p.userName}</span>
                <span className="text-green-400">
                  +${p.payout.toFixed(2)} ({p.shares.toFixed(2)} shares)
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Close market */}
      {market.status === "open" && (
        <div className="bg-[#141414] border border-[#262626] rounded-xl p-5">
          <h3 className="text-base font-semibold text-white mb-2">Close Trading</h3>
          <p className="text-gray-400 text-sm mb-4">
            Stop trading but keep the market open for resolution. This is reversible via direct DB
            edit if needed.
          </p>
          <button
            onClick={() => setShowCloseModal(true)}
            className="px-4 py-2 rounded-lg bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium transition-colors"
          >
            Close Market
          </button>
        </div>
      )}

      {/* Resolve market */}
      <div className="bg-[#141414] border border-[#262626] rounded-xl p-5">
        <h3 className="text-base font-semibold text-white mb-2">Resolve Market</h3>
        <p className="text-gray-400 text-sm mb-4">
          Select the winning outcome. This is <span className="text-red-400 font-medium">irreversible</span>.
          Winners receive $1.00 per share.
        </p>

        <div className="grid grid-cols-2 gap-2 mb-4">
          {OUTCOME_LABELS.map((label, i) => (
            <button
              key={i}
              onClick={() => setSelectedOutcome(i === selectedOutcome ? null : i)}
              className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                selectedOutcome === i
                  ? "border-2 text-white"
                  : "border-[#262626] text-gray-400 hover:border-[#404040]"
              }`}
              style={
                selectedOutcome === i
                  ? { borderColor: OUTCOME_COLORS[i], backgroundColor: `${OUTCOME_COLORS[i]}15` }
                  : {}
              }
            >
              <div style={selectedOutcome === i ? { color: OUTCOME_COLORS[i] } : {}}>{label}</div>
              <div className="text-xs text-gray-500 mt-0.5">
                {Math.round(market.probabilities[i] * 100)}% probability
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowResolveModal(true)}
          disabled={selectedOutcome === null || loading}
          className="w-full py-2.5 rounded-lg bg-red-700 hover:bg-red-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors"
        >
          Resolve Market
        </button>
      </div>

      {/* Close modal */}
      <Modal
        isOpen={showCloseModal}
        onClose={() => setShowCloseModal(false)}
        onConfirm={handleClose}
        title="Close Market?"
        description="This will stop all trading. The market will move to 'closed' status. Are you sure?"
        confirmText="Close Market"
        confirmClassName="bg-yellow-600 hover:bg-yellow-700 text-white"
      />

      {/* Resolve modal */}
      <Modal
        isOpen={showResolveModal}
        onClose={() => setShowResolveModal(false)}
        onConfirm={handleResolve}
        title="Resolve Market — Irreversible"
        description={
          selectedOutcome !== null
            ? `The winning outcome is "${OUTCOME_LABELS[selectedOutcome]}". All holders of this outcome will receive $1.00 per share. This cannot be undone.`
            : ""
        }
        confirmText="Confirm Resolution"
        confirmClassName="bg-red-700 hover:bg-red-800 text-white"
      />
    </div>
  );
}
