"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";

export function Nav() {
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-40 bg-[#0a0a0a]/95 backdrop-blur-sm border-b border-[#1a1a1a]">
      <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-14">
        {/* Logo */}
        <Link href="/" className="font-bold text-lg text-white flex items-center gap-2">
          <span className="text-2xl">🐚</span>
          <span>Shell Markets</span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link href="/" className="text-gray-400 hover:text-white transition-colors">
            Market
          </Link>
          <Link href="/leaderboard" className="text-gray-400 hover:text-white transition-colors">
            Leaderboard
          </Link>
          {session?.user?.isAdmin && (
            <Link href="/admin" className="text-yellow-400 hover:text-yellow-300 transition-colors">
              Admin
            </Link>
          )}
        </div>

        {/* Right: user info */}
        <div className="flex items-center gap-3">
          {session?.user ? (
            <>
              {/* Balance pill */}
              <div className="hidden sm:flex items-center gap-1.5 bg-[#141414] border border-[#262626] rounded-full px-3 py-1 text-sm">
                <span className="text-gray-400 text-xs">$</span>
                <span className="font-semibold text-white">
                  {(session.user.balance ?? 0).toFixed(2)}
                </span>
              </div>
              {/* Avatar */}
              <div className="relative group">
                <button className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-[#262626]">
                    {session.user.image ? (
                      <Image
                        src={session.user.image}
                        alt={session.user.name ?? ""}
                        width={32}
                        height={32}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-sm text-gray-400">
                        {session.user.name?.[0]}
                      </div>
                    )}
                  </div>
                  <span className="hidden sm:block text-sm text-gray-300 max-w-24 truncate">
                    {session.user.name}
                  </span>
                </button>
                {/* Dropdown */}
                <div className="absolute right-0 top-10 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-150 bg-[#141414] border border-[#262626] rounded-xl shadow-xl p-2 w-48">
                  <div className="px-3 py-2 border-b border-[#262626] mb-1">
                    <div className="text-sm text-white font-medium truncate">{session.user.name}</div>
                    <div className="text-xs text-gray-500 truncate">{session.user.email}</div>
                  </div>
                  <div className="px-3 py-2 sm:hidden">
                    <span className="text-xs text-gray-400">Balance: </span>
                    <span className="text-sm font-semibold text-white">
                      ${(session.user.balance ?? 0).toFixed(2)}
                    </span>
                  </div>
                  <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="w-full text-left px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-[#1a1a1a] rounded-lg transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-sm text-gray-500">Not signed in</div>
          )}

          {/* Mobile menu button */}
          <button
            className="md:hidden text-gray-400 hover:text-white"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={mobileOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[#1a1a1a] px-4 py-3 space-y-2">
          <Link
            href="/"
            onClick={() => setMobileOpen(false)}
            className="block text-gray-300 hover:text-white text-sm py-1"
          >
            Market
          </Link>
          <Link
            href="/leaderboard"
            onClick={() => setMobileOpen(false)}
            className="block text-gray-300 hover:text-white text-sm py-1"
          >
            Leaderboard
          </Link>
          {session?.user?.isAdmin && (
            <Link
              href="/admin"
              onClick={() => setMobileOpen(false)}
              className="block text-yellow-400 hover:text-yellow-300 text-sm py-1"
            >
              Admin
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
