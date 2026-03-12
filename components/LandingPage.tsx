"use client";

import { signIn } from "next-auth/react";

export function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">
      {/* Nav */}
      <header className="flex items-center justify-between px-8 h-14 border-b border-[var(--border)]">
        <span className="text-sm font-semibold tracking-tight">Startup Shell @ UMD</span>
        <button
          onClick={() => signIn("google")}
          className="text-xs font-medium px-4 py-1.5 border border-[var(--border)] hover:border-[var(--foreground)] transition-colors"
        >
          Sign In
        </button>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-8">
        <div className="w-full max-w-3xl">
          {/* Hero text */}
          <div className="mb-16">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.1] mb-6">
              Buy-n-s
              <span className="text-[var(--muted)]">h</span>
              ell
            </h1>
            <p className="text-base text-[var(--muted)] max-w-md leading-relaxed mb-10">
              A prediction market for the Startup Shell community.
              Trade shares on real-world outcomes. $1 to $5 per bet.
            </p>
            <button
              onClick={() => signIn("google")}
              className="px-6 py-3 bg-[var(--foreground)] text-[var(--background)] text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Log in w/ Shell Email
            </button>
          </div>

          {/* Grid of info cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[var(--border)]">
            {[
              { label: "Bet range", value: "$1 – $5" },
              { label: "Payout", value: "$1 / share" },
              { label: "Updates", value: "Real-time" },
              { label: "Access", value: "Shell only" },
            ].map((item) => (
              <div key={item.label} className="bg-[var(--background)] p-5">
                <div className="text-[10px] uppercase tracking-[0.15em] text-[var(--muted)] mb-2">
                  {item.label}
                </div>
                <div className="text-lg font-semibold tracking-tight">{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      {/* <footer className="px-8 py-6 border-t border-[var(--border)]">
        <div className="flex items-center justify-between text-xs text-[var(--muted)]">
          <span>A Startup Shell Project</span>
          <span>Members Only</span>
        </div>
      </footer> */}
    </div>
  );
}
