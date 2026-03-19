# buy-hold-shell

A prediction market platform for [Startup Shell](https://startupshell.org). Members sign in with Google, receive a starting balance, and trade on outcomes of internal markets. Admins can create markets, manage user balances, and resolve outcomes.

## Stack

- **Next.js 16** — App Router, API routes, SSE for live market updates
- **NextAuth v4** — Google OAuth
- **better-sqlite3** — embedded SQLite database (stored in `/data/market.db`)
- **Tailwind CSS v4**

## Setup

```bash
npm install
```

Create a `.env.local`:

```env
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
ADMIN_EMAIL=you@example.com   # grants admin privileges on sign-in
```

```bash
npm run dev
```

The database and schema are initialized automatically on first run. A seed market is inserted if the `markets` table is empty.

## Features

- LMSR (logarithmic market scoring rule) automated market maker
- Real-time probability updates via server-sent events
- Probability history chart per market
- Leaderboard ranked by portfolio value
- Admin panel: open/close/resolve markets, deposit funds, view ledger
