import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, isAdmin } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !isAdmin(session.user.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { marketId } = await req.json();
  if (typeof marketId !== "number") {
    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
  }

  const db = getDb();
  const market = db.prepare("SELECT * FROM markets WHERE id = ?").get(marketId) as
    | { status: string }
    | undefined;
  if (!market) return NextResponse.json({ error: "Market not found" }, { status: 404 });
  if (market.status !== "open") {
    return NextResponse.json({ error: "Market is not open" }, { status: 400 });
  }

  db.prepare("UPDATE markets SET status = 'closed' WHERE id = ?").run(marketId);
  return NextResponse.json({ success: true });
}
