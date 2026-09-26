import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "../../lib/supabase-server";
import { resolveCompanyId } from "../../lib/company";
import { getDemoState, isDemoSession, isDemoUser, saveDemoState } from "../../lib/demo";
import type { Opportunity } from "../../lib/types";

export async function GET() {
  const db = await getSupabaseServer();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (isDemoUser(user.email)) return NextResponse.json({ data: (await getDemoState()).opportunities, demo: true });

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

  if (await isDemoSession() || isDemoUser(user.email)) {
    const state = await getDemoState();
    const id = `demo-new-${Date.now()}`;
    const opportunity: Opportunity = {
      id, contact_name: body.name.trim(), phone: body.phone?.trim() || null,
      need: body.need?.trim() || null, product: null, intent: "Consulta inicial",
      status: "nuevo", current_summary: "Nueva oportunidad creada durante la sesión demo.",
      next_action: "Contactar", next_action_at: null, assigned_user_name: "Lucas",
      updated_at: new Date().toISOString()
    };
    state.opportunities = [opportunity, ...state.opportunities];
    state.interactions[id] = [];
    await saveDemoState(state);
    return NextResponse.json({ opportunity, demo: true }, { status: 201 });
  }

  const { data: opportunityId, error } = await db.rpc("create_opportunity", {
    p_name: body.name.trim(), p_phone: body.phone?.trim() || null, p_need: body.need?.trim() || null, p_email: body.email?.trim() || null
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const result = await db.from("opportunities").select("*,contacts(name,phone,email),users(name)").eq("id", opportunityId).maybeSingle();
  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 });
  if (!result.data) return NextResponse.json({ error: "opportunity_not_found" }, { status: 404 });
  return NextResponse.json({ opportunity: result.data }, { status: 201 });
}
