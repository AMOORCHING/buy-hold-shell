"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";

export function Nav() {
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!session) return null;

  return (
    <nav className="sticky top-0 z-40 bg-[var(--background)]/95 backdrop-blur-sm border-b border-[var(--border)] h-14">
      <div className="h-full px-4 flex items-center justify-between">
        {/* Logo */}
        {/* <Link href="/" className="font-semibold text-sm tracking-tight flex items-center gap-2">
          Shell Markets
        </Link> */}

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1 text-xs">
          <Link href="/" className="px-3 py-1.5 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
            Market
          </Link>
          <Link href="/leaderboard" className="px-3 py-1.5 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
            Leaderboard
          </Link>
          {session?.user?.isAdmin && (
            <Link href="/admin" className="px-3 py-1.5 text-yellow-500 hover:text-yellow-400 transition-colors">
              Admin
            </Link>
          )}
        </div>

        {/* Right: user info */}
        <div className="flex items-center gap-3">
          {session?.user ? (
            <>
              <div className="hidden sm:flex items-center gap-1.5 border border-[var(--border)] px-3 py-1 text-xs font-mono">
                <span className="text-[var(--muted)]">$</span>
                <span className="font-semibold">
                  {(session.user.balance ?? 0).toFixed(2)}
                </span>
              </div>
              <div className="relative group">
                <button className="flex items-center gap-2">
                  <div className="w-7 h-7 overflow-hidden bg-[var(--surface)]">
                    {session.user.image ? (
                      <Image
                        src={session.user.image}
                        alt={session.user.name ?? ""}
                        width={28}
                        height={28}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-[var(--muted)]">
                        {session.user.name?.[0]}
                      </div>
                    )}
                  </div>
                  <span className="hidden sm:block text-xs text-[var(--muted)] max-w-24 truncate">
                    {session.user.name}
                  </span>
                </button>
                <div className="absolute right-0 top-9 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-150 bg-[var(--surface)] border border-[var(--border)] shadow-xl p-1.5 w-48">
                  <div className="px-3 py-2 border-b border-[var(--border)] mb-1">
                    <div className="text-xs font-medium truncate">{session.user.name}</div>
                    <div className="text-[10px] text-[var(--muted)] truncate">{session.user.email}</div>
                  </div>
                  <div className="px-3 py-1.5 sm:hidden">
                    <span className="text-[10px] text-[var(--muted)]">Balance: </span>
                    <span className="text-xs font-semibold">
                      ${(session.user.balance ?? 0).toFixed(2)}
                    </span>
                  </div>
                  <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="w-full text-left px-3 py-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-[var(--surface-2)] transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-xs text-[var(--muted)]">Not signed in</div>
          )}

          <button
            className="md:hidden text-[var(--muted)] hover:text-[var(--foreground)]"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <span className="text-sm">{mobileOpen ? "X" : "="}</span>
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-[var(--border)] px-4 py-2 space-y-1 bg-[var(--background)]">
          <Link href="/" onClick={() => setMobileOpen(false)} className="block text-xs text-[var(--muted)] hover:text-[var(--foreground)] py-1.5">
            Market
          </Link>
          <Link href="/leaderboard" onClick={() => setMobileOpen(false)} className="block text-xs text-[var(--muted)] hover:text-[var(--foreground)] py-1.5">
            Leaderboard
          </Link>
          {session?.user?.isAdmin && (
            <Link href="/admin" onClick={() => setMobileOpen(false)} className="block text-xs text-yellow-500 hover:text-yellow-400 py-1.5">
              Admin
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
