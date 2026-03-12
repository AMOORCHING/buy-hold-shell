import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, "market.db");

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;
  _db = new Database(DB_PATH);
  _db.pragma("journal_mode = WAL");
  _db.pragma("foreign_keys = ON");
  initSchema(_db);
  seedMarket(_db);
  return _db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      image TEXT,
      balance REAL NOT NULL DEFAULT 0.0,
      total_deposited REAL NOT NULL DEFAULT 0.0,
      is_admin INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS markets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      outcomes TEXT NOT NULL,
      b REAL NOT NULL DEFAULT 50.0,
      quantities TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open',
      resolved_outcome INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      closes_at DATETIME,
      resolves_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS positions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL REFERENCES users(id),
      market_id INTEGER NOT NULL REFERENCES markets(id),
      outcome_index INTEGER NOT NULL,
      shares REAL NOT NULL DEFAULT 0,
      UNIQUE(user_id, market_id, outcome_index)
    );

    CREATE TABLE IF NOT EXISTS trades (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL REFERENCES users(id),
      market_id INTEGER NOT NULL REFERENCES markets(id),
      outcome_index INTEGER NOT NULL,
      shares REAL NOT NULL,
      cost REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS ledger (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL REFERENCES users(id),
      amount REAL NOT NULL,
      note TEXT,
      admin_id TEXT NOT NULL REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

function seedMarket(db: Database.Database) {
  const existing = db.prepare("SELECT id FROM markets LIMIT 1").get();
  if (existing) return;

  db.prepare(`
    INSERT INTO markets (title, description, outcomes, b, quantities, status, closes_at, resolves_at)
    VALUES (?, ?, ?, ?, ?, 'open', ?, ?)
  `).run(
    "New Batch Retention — May 2nd",
    "What percentage of the newest Startup Shell batch will still be actively participating by May 2nd, 2026? A member is 'active' if 10 or more people in the space know them by name. Resolution is determined by the Shell executive board.",
    JSON.stringify(["0-25%", "25-50%", "50-75%", "75-100%"]),
    50,
    JSON.stringify([0, 0, 0, 0]),
    "2026-04-29T23:59:59Z",
    "2026-05-02T23:59:59Z"
  );
}

export function upsertUser(user: {
  id: string;
  name: string;
  email: string;
  image?: string;
}): void {
  const db = getDb();
  const adminEmail = process.env.ADMIN_EMAIL;

  const existing = db.prepare("SELECT id, is_admin FROM users WHERE id = ?").get(user.id) as
    | { id: string; is_admin: number }
    | undefined;

  if (existing) {
    // Update name/image but preserve balance and admin status
    // Auto-grant admin if email matches ADMIN_EMAIL
    const shouldBeAdmin = adminEmail && user.email === adminEmail ? 1 : existing.is_admin;
    db.prepare("UPDATE users SET name = ?, image = ?, is_admin = ? WHERE id = ?").run(
      user.name,
      user.image ?? null,
      shouldBeAdmin,
      user.id
    );
  } else {
    const isAdmin = adminEmail && user.email === adminEmail ? 1 : 0;
    db.prepare(
      "INSERT INTO users (id, name, email, image, balance, is_admin) VALUES (?, ?, ?, ?, 10.0, ?)"
    ).run(user.id, user.name, user.email, user.image ?? null, isAdmin);
  }
}

export function getUser(id: string) {
  return getDb().prepare("SELECT * FROM users WHERE id = ?").get(id) as
    | {
        id: string;
        name: string;
        email: string;
        image: string | null;
        balance: number;
        total_deposited: number;
        is_admin: number;
        created_at: string;
      }
    | undefined;
}

export function getMarket(id: number) {
  return getDb().prepare("SELECT * FROM markets WHERE id = ?").get(id) as
    | {
        id: number;
        title: string;
        description: string;
        outcomes: string;
        b: number;
        quantities: string;
        status: string;
        resolved_outcome: number | null;
        created_at: string;
        closes_at: string;
        resolves_at: string;
      }
    | undefined;
}

export function getAllMarkets() {
  return getDb().prepare("SELECT * FROM markets ORDER BY created_at DESC").all() as {
    id: number;
    title: string;
    description: string;
    outcomes: string;
    b: number;
    quantities: string;
    status: string;
    resolved_outcome: number | null;
    created_at: string;
    closes_at: string;
    resolves_at: string;
  }[];
}

export function getUserPositions(userId: string, marketId: number) {
  return getDb()
    .prepare("SELECT * FROM positions WHERE user_id = ? AND market_id = ?")
    .all(userId, marketId) as {
    id: number;
    user_id: string;
    market_id: number;
    outcome_index: number;
    shares: number;
  }[];
}

export function getRecentTrades(marketId: number, limit = 20) {
  return getDb()
    .prepare(
      `SELECT t.*, u.name as user_name, u.image as user_image
       FROM trades t
       JOIN users u ON t.user_id = u.id
       WHERE t.market_id = ?
       ORDER BY t.created_at DESC
       LIMIT ?`
    )
    .all(marketId, limit) as {
    id: number;
    user_id: string;
    market_id: number;
    outcome_index: number;
    shares: number;
    cost: number;
    created_at: string;
    user_name: string;
    user_image: string | null;
  }[];
}

export function getAllUsers() {
  return getDb().prepare("SELECT * FROM users ORDER BY created_at ASC").all() as {
    id: string;
    name: string;
    email: string;
    image: string | null;
    balance: number;
    total_deposited: number;
    is_admin: number;
    created_at: string;
  }[];
}

export function getRecentLedger(limit = 50) {
  return getDb()
    .prepare(
      `SELECT l.*, u.name as user_name, a.name as admin_name
       FROM ledger l
       JOIN users u ON l.user_id = u.id
       JOIN users a ON l.admin_id = a.id
       ORDER BY l.created_at DESC
       LIMIT ?`
    )
    .all(limit) as {
    id: number;
    user_id: string;
    amount: number;
    note: string | null;
    admin_id: string;
    created_at: string;
    user_name: string;
    admin_name: string;
  }[];
}
