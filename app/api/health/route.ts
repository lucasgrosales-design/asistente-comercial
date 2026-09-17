import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../lib/supabase";

export async function GET() {
  const db = getSupabaseAdmin();

  if (!db) {
    return NextResponse.json(
      { status: "degraded", app: "ok", database: "not_configured" },
      { status: 503 },
    );
  }

  const { error } = await db.from("companies").select("id").limit(1);

  if (error) {
    return NextResponse.json(
      { status: "degraded", app: "ok", database: "error" },
      { status: 503 },
    );
  }

  return NextResponse.json({ status: "ok", app: "ok", database: "ok" });
}
