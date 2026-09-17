import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "../../lib/supabase-server";
import { getSupabaseAdmin } from "../../lib/supabase";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.company_name?.trim() || !body?.user_name?.trim()) return NextResponse.json({ error: "company_name and user_name are required" }, { status: 400 });
  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ error: "supabase_not_configured" }, { status: 500 });
  const existing = await db.from("users").select("company_id").eq("id", user.id).maybeSingle();
  if (existing.data?.company_id) return NextResponse.json({ company_id: existing.data.company_id, existing: true });
  const company = await db.from("companies").insert({ name: body.company_name.trim() }).select("id").single();
  if (company.error) return NextResponse.json({ error: company.error.message }, { status: 500 });
  const profile = await db.from("users").insert({ id: user.id, company_id: company.data.id, name: body.user_name.trim(), email: user.email || null, role: "owner" }).select("company_id").single();
  if (profile.error) { await db.from("companies").delete().eq("id", company.data.id); return NextResponse.json({ error: profile.error.message }, { status: 500 }); }
  return NextResponse.json({ company_id: profile.data.company_id, created: true });
}
