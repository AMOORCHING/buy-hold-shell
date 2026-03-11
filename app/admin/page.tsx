"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { AdminDeposit } from "@/components/AdminDeposit";
import { AdminResolve } from "@/components/AdminResolve";
import { useToast } from "@/components/Toast";

interface User {
  id: string;
  name: string;
  email: string;
  balance: number;
  total_deposited: number;
  is_admin: number;
  image: string | null;
}

interface Market {
  id: number;
  title: string;
  status: string;
  resolved_outcome: number | null;
  probabilities: number[];
  quantities: number[];
}

interface LedgerEntry {
  id: number;
  user_name: string;
  admin_name: string;
  amount: number;
  note: string | null;
  created_at: string;
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const { addToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [market, setMarket] = useState<Market | null>(null);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"deposits" | "market" | "users">("deposits");

  const fetchData = useCallback(async () => {
    const [usersRes, marketRes] = await Promise.all([
      fetch("/api/admin/users"),
      fetch("/api/markets/1"),
    ]);

    if (usersRes.ok) {
      const usersData = await usersRes.json();
      setUsers(usersData);
    }

    if (marketRes.ok) {
      const marketData = await marketRes.json();
      setMarket(marketData);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    if (session?.user?.isAdmin) {
      fetchData();
    }
  }, [session, fetchData]);

  const handleToggleAdmin = async (userId: string, currentIsAdmin: boolean) => {
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, isAdmin: !currentIsAdmin }),
    });
    const data = await res.json();
    if (!res.ok) {
      addToast(data.error || "Failed to update admin status", "error");
    } else {
      addToast("Admin status updated", "info");
      fetchData();
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-[#141414] rounded-lg w-48" />
        <div className="h-64 bg-[#141414] rounded-xl" />
      </div>
    );
  }

  if (!session?.user?.isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="text-4xl">🚫</div>
        <h1 className="text-xl font-bold text-white">Access Denied</h1>
        <p className="text-gray-400 text-sm">
          This page is only accessible to Shell exec board members.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
        <span className="text-xs text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded-full border border-yellow-400/30">
          Exec Board Access
        </span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#141414] border border-[#262626] rounded-xl p-1">
        {(["deposits", "market", "users"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium capitalize transition-colors ${
              tab === t ? "bg-[#262626] text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            {t === "deposits" ? "Deposits" : t === "market" ? "Market" : "Users"}
          </button>
        ))}
      </div>

      {tab === "deposits" && (
        <AdminDeposit
          users={users.map((u) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            balance: u.balance,
            total_deposited: u.total_deposited,
          }))}
          ledger={ledger}
          onRefresh={fetchData}
        />
      )}

      {tab === "market" && market && (
        <AdminResolve
          market={market}
          onRefresh={fetchData}
        />
      )}

      {tab === "users" && (
        <div className="bg-[#141414] border border-[#262626] rounded-xl overflow-hidden">
          <div className="p-4 border-b border-[#262626]">
            <h3 className="font-semibold text-white">All Users ({users.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#262626] text-xs text-gray-400">
                  <th className="px-4 py-3 text-left">User</th>
                  <th className="px-4 py-3 text-right">Balance</th>
                  <th className="px-4 py-3 text-right hidden sm:table-cell">Deposited</th>
                  <th className="px-4 py-3 text-center">Admin</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-[#1a1a1a] text-sm hover:bg-[#0f0f0f]"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-white">{user.name}</div>
                      <div className="text-xs text-gray-500">{user.email}</div>
                    </td>
                    <td className="px-4 py-3 text-right text-white">
                      ${user.balance.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-400 hidden sm:table-cell">
                      ${user.total_deposited.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleToggleAdmin(user.id, user.is_admin === 1)}
                        disabled={user.id === session.user.id}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          user.is_admin
                            ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/40 hover:bg-yellow-500/30"
                            : "bg-[#262626] text-gray-400 hover:bg-[#333]"
                        } disabled:opacity-40 disabled:cursor-not-allowed`}
                      >
                        {user.is_admin ? "Admin" : "User"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
