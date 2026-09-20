import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseServer } from "../../lib/supabase-server";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.company_name?.trim() || !body?.user_name?.trim()) return NextResponse.json({ error: "company_name and user_name are required" }, { status: 400 });

  const sessionClient = await getSupabaseServer();
  const { data: { user } } = await sessionClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return NextResponse.json({ error: "supabase_service_key_not_configured" }, { status: 503 });
  const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

  const { data: existing, error: existingError } = await admin.from("users").select("company_id").eq("id", user.id).maybeSingle();
  if (existingError) return NextResponse.json({ error: existingError.message }, { status: 500 });

  if (existing?.company_id) {
    const { error: companyError } = await admin.from("companies").update({ name: body.company_name.trim() }).eq("id", existing.company_id);
    if (companyError) return NextResponse.json({ error: companyError.message }, { status: 500 });
    const { error: userError } = await admin.from("users").update({ name: body.user_name.trim(), email: user.email ?? null }).eq("id", user.id);
    if (userError) return NextResponse.json({ error: userError.message }, { status: 500 });
    return NextResponse.json({ company_id: existing.company_id, created: false });
  }

  const { data: company, error: companyError } = await admin.from("companies").insert({ name: body.company_name.trim() }).select("id").single();
  if (companyError) return NextResponse.json({ error: companyError.message }, { status: 500 });

  const { error: userError } = await admin.from("users").insert({ id: user.id, company_id: company.id, name: body.user_name.trim(), email: user.email ?? null, role: "owner" });
  if (userError) {
    await admin.from("companies").delete().eq("id", company.id);
    return NextResponse.json({ error: userError.message }, { status: 500 });
  }

  return NextResponse.json({ company_id: company.id, created: true });
}
