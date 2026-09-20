import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "../../lib/supabase-server";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.company_name?.trim() || !body?.user_name?.trim()) {
    return NextResponse.json({ error: "company_name and user_name are required" }, { status: 400 });
  }

  const db = await getSupabaseServer();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data, error } = await db.rpc("setup_company", {
    p_company_name: body.company_name.trim(),
    p_user_name: body.user_name.trim(),
  });

  if (error) {
    console.error("setup_company failed", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ company_id: data, created: true });
}
