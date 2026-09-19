import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "../../lib/supabase-server";
import { resolveCompanyId } from "../../lib/company";

export async function GET() {
  const db = await getSupabaseServer();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const companyId = await resolveCompanyId();
  if (!companyId) return NextResponse.json({ error: "company_not_configured" }, { status: 400 });

  const { data, error } = await db
    .from("opportunities")
    .select("*,contacts(name,phone,email),users(name)")
    .eq("company_id", companyId)
    .order("updated_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.name?.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const db = await getSupabaseServer();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // Creation is handled atomically inside Supabase so company resolution,
  // contact creation and opportunity creation cannot get out of sync with RLS.
  const { data: opportunityId, error } = await db.rpc("create_opportunity", {
    p_name: body.name.trim(),
    p_phone: body.phone?.trim() || null,
    p_need: body.need?.trim() || null,
    p_email: body.email?.trim() || null,
  });

  if (error) {
    console.error("create_opportunity failed", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const result = await db
    .from("opportunities")
    .select("*,contacts(name,phone,email),users(name)")
    .eq("id", opportunityId)
    .maybeSingle();

  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 });
  if (!result.data) return NextResponse.json({ error: "opportunity_not_found" }, { status: 404 });

  return NextResponse.json({ opportunity: result.data }, { status: 201 });
}
