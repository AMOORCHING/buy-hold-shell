"use client";

import { useState } from "react";
import { useToast } from "./Toast";

interface User {
  id: string;
  name: string;
  email: string;
  balance: number;
  total_deposited: number;
}

interface LedgerEntry {
  id: number;
  user_name: string;
  admin_name: string;
  amount: number;
  note: string | null;
  created_at: string;
}

export function AdminDeposit({
  users,
  ledger,
  onRefresh,
}: {
  users: User[];
  ledger: LedgerEntry[];
  onRefresh: () => void;
}) {
  const { addToast } = useToast();
  const [selectedUserId, setSelectedUserId] = useState("");
  const [amount, setAmount] = useState(5);
  const [note, setNote] = useState("Venmo deposit");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  const selectedUser = users.find((u) => u.id === selectedUserId);
  const remaining = selectedUser ? 20 - selectedUser.total_deposited : 20;

  const handleDeposit = async () => {
    if (!selectedUserId || amount <= 0) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedUserId, amount, note }),
      });
      const data = await res.json();
      if (!res.ok) {
        addToast(data.error || "Deposit failed", "error");
      } else {
        addToast(`Added $${amount.toFixed(2)} to ${selectedUser?.name}`, "success");
        onRefresh();
      }
    } catch {
      addToast("Network error", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#141414] border border-[#262626] rounded-xl p-5">
        <h3 className="text-base font-semibold text-white mb-4">Add Funds</h3>
        <div className="space-y-3">
          {/* User search */}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Search user</label>
            <input
              type="text"
              placeholder="Name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#404040]"
            />
            {search && filteredUsers.length > 0 && (
              <div className="mt-1 bg-[#0a0a0a] border border-[#262626] rounded-lg overflow-hidden">
                {filteredUsers.slice(0, 5).map((u) => (
                  <button
                    key={u.id}
                    onClick={() => {
                      setSelectedUserId(u.id);
                      setSearch("");
                    }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-[#1a1a1a] flex justify-between items-center"
                  >
                    <span className="text-white">{u.name}</span>
                    <span className="text-gray-500 text-xs">{u.email}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedUser && (
            <div className="bg-[#0a0a0a] rounded-lg p-3 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-400">Selected</span>
                <span className="text-white font-medium">{selectedUser.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Current balance</span>
                <span className="text-white">${selectedUser.balance.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Total deposited</span>
                <span className="text-white">${selectedUser.total_deposited.toFixed(2)} / $20.00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Can deposit up to</span>
                <span className={remaining <= 5 ? "text-yellow-400" : "text-green-400"}>
                  ${remaining.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          <div>
            <label className="text-xs text-gray-400 mb-1 block">Amount</label>
            <div className="flex items-center gap-2 bg-[#0a0a0a] border border-[#262626] rounded-lg px-3 py-2">
              <span className="text-gray-500">$</span>
              <input
                type="number"
                min="0.01"
                max={remaining}
                step="1"
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                className="flex-1 bg-transparent text-white text-sm outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">Note</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#404040]"
            />
          </div>

          <button
            onClick={handleDeposit}
            disabled={!selectedUserId || amount <= 0 || loading}
            className="w-full py-2.5 rounded-lg bg-green-600 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors"
          >
            {loading ? "Adding funds..." : "Add Funds"}
          </button>
        </div>
      </div>

      {/* Recent deposits */}
      <div className="bg-[#141414] border border-[#262626] rounded-xl p-5">
        <h3 className="text-base font-semibold text-white mb-4">Recent Deposits</h3>
        {ledger.length === 0 ? (
          <p className="text-gray-500 text-sm">No deposits yet.</p>
        ) : (
          <div className="space-y-2">
            {ledger.slice(0, 20).map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between py-2 border-b border-[#1a1a1a] last:border-0 text-sm"
              >
                <div>
                  <span className="text-white">{entry.user_name}</span>
                  {entry.note && (
                    <span className="text-gray-500 text-xs ml-2">({entry.note})</span>
                  )}
                  <div className="text-xs text-gray-600">by {entry.admin_name}</div>
                </div>
                <div className="text-right">
                  <div
                    className={`font-medium ${
                      entry.amount > 0 ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {entry.amount > 0 ? "+" : ""}${entry.amount.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-600">
                    {new Date(entry.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
