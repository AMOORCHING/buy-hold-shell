import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, isAdmin } from "@/lib/auth";
import { getAllUsers, getDb } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !isAdmin(session.user.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json(getAllUsers());
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !isAdmin(session.user.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId, isAdmin: newIsAdmin } = await req.json();
  if (!userId || typeof newIsAdmin !== "boolean") {
    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
  }

  // Prevent removing own admin
  if (userId === session.user.id && !newIsAdmin) {
    return NextResponse.json({ error: "Cannot remove your own admin status" }, { status: 400 });
  }

  getDb()
    .prepare("UPDATE users SET is_admin = ? WHERE id = ?")
    .run(newIsAdmin ? 1 : 0, userId);

  return NextResponse.json({ success: true });
}
