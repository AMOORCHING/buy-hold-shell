import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, isAdmin } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !isAdmin(session.user.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId, amount, note } = await req.json();
  if (!userId || typeof amount !== "number" || amount <= 0) {
    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
  }

  const roundedAmount = Math.round(amount * 100) / 100;

  const db = getDb();
  const depositTx = db.transaction(() => {
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId) as
      | { id: string; balance: number; total_deposited: number }
      | undefined;
    if (!user) throw new Error("User not found");

    if (user.total_deposited + roundedAmount > 20.0) {
      throw new Error(
        `This would exceed the $20 deposit cap. User has deposited $${user.total_deposited.toFixed(2)}`
      );
    }

    const newBalance = Math.round((user.balance + roundedAmount) * 100) / 100;
    const newDeposited = Math.round((user.total_deposited + roundedAmount) * 100) / 100;

    db.prepare("UPDATE users SET balance = ?, total_deposited = ? WHERE id = ?").run(
      newBalance,
      newDeposited,
      userId
    );

    db.prepare(
      "INSERT INTO ledger (user_id, amount, note, admin_id) VALUES (?, ?, ?, ?)"
    ).run(userId, roundedAmount, note || "Deposit", session.user.id);

    return { newBalance, newDeposited };
  });

  try {
    const result = depositTx();
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Deposit failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
