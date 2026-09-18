import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "../../lib/supabase-server";
import { resolveCompanyId, normalizeStatus } from "../../lib/company";

export async function GET() {
  const db = await getSupabaseServer();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const companyId = await resolveCompanyId();
  if (!companyId) return NextResponse.json({ error: "company_not_configured" }, { status: 400 });
  const { data, error } = await db.from("opportunities").select("*,contacts(name,phone,email),users(name)").eq("company_id", companyId).order("updated_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.name?.trim()) return NextResponse.json({ error: "name is required" }, { status: 400 });

  const db = await getSupabaseServer();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const companyId = await resolveCompanyId(body.company_id);
  if (!companyId) return NextResponse.json({ error: "company_not_configured" }, { status: 400 });

  let contact: { id: string } | null = null;
  if (body.phone?.trim()) {
    const result = await db.from("contacts").select("id").eq("company_id", companyId).eq("phone", body.phone.trim()).maybeSingle();
    if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 });
    contact = result.data;
  }

  if (!contact) {
    const result = await db.from("contacts").insert({
      company_id: companyId,
      name: body.name.trim(),
      phone: body.phone?.trim() || null,
      email: body.email?.trim() || null,
    }).select("id").single();
    if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 });
    contact = result.data;
  } else {
    const result = await db.from("contacts").update({
      name: body.name.trim(),
      email: body.email?.trim() || undefined,
      updated_at: new Date().toISOString(),
    }).eq("id", contact.id);
    if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 });
  }

  const status = normalizeStatus(body.status) || "nuevo";
  const result = await db.from("opportunities").insert({
    company_id: companyId,
    contact_id: contact.id,
    assigned_user_id: body.assigned_user_id || null,
    need: body.need?.trim() || null,
    product: body.product?.trim() || null,
    intent: body.intent?.trim() || null,
    status,
    current_summary: body.summary?.trim() || null,
    next_action: body.next_action?.trim() || null,
    next_action_at: body.next_action_at || null,
  }).select("*,contacts(name,phone,email),users(name)").single();

  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 });
  return NextResponse.json({ opportunity: result.data }, { status: 201 });
}
