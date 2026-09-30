import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "../../../lib/supabase-server";
import { resolveCompanyId } from "../../../lib/company";
import { getDemoState, isDemoSession, saveDemoState } from "../../../lib/demo";
import { requestTooLarge } from "../../../lib/validation";
import { computeQuickUpdate, quickActionSchema } from "../../../lib/quick-actions";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (requestTooLarge(req)) return NextResponse.json({ error: "request_too_large" }, { status: 413 });
  const { id } = await params;
  if (!/^[A-Za-z0-9_-]{1,100}$/.test(id)) return NextResponse.json({ error: "invalid_opportunity_id" }, { status: 400 });
  const parsed = quickActionSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  try {
    if (await isDemoSession()) {
      const state = await getDemoState();
      const opp = state.opportunities.find((o) => o.id === id);
      if (!opp) return NextResponse.json({ error: "opportunity_not_found" }, { status: 404 });
      const result = computeQuickUpdate(opp, parsed.data);
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 409 });
      Object.assign(opp, result.patch);
      const item = { id: `demo-i-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, occurred_at: new Date().toISOString(), channel: "manual", summary: result.note, outcome: result.outcome, user_name: "Lucas" };
      state.interactions[id] = [item, ...(state.interactions[id] || [])].slice(0, 5);
      await saveDemoState(state);
      return NextResponse.json({ ok: true, demo: true });
    }
    const db = await getSupabaseServer();
    const { data: { user } } = await db.auth.getUser();
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    const companyId = await resolveCompanyId();
    if (!companyId) return NextResponse.json({ error: "company_not_configured" }, { status: 400 });
    const current = await db.from("opportunities").select("id,status,next_action").eq("id", id).eq("company_id", companyId).maybeSingle();
    if (current.error) return NextResponse.json({ error: "query_failed" }, { status: 500 });
    if (!current.data) return NextResponse.json({ error: "opportunity_not_found" }, { status: 404 });
    const result = computeQuickUpdate(current.data, parsed.data);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 409 });
    const update = await db.from("opportunities").update(result.patch).eq("id", id).eq("company_id", companyId);
    if (update.error) return NextResponse.json({ error: "update_failed" }, { status: 500 });
    await db.from("interactions").insert({ opportunity_id: id, user_id: user.id, channel: "manual", occurred_at: new Date().toISOString(), source_text: result.note, summary: result.note, outcome: result.outcome });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("opportunity PATCH failed", error);
    return NextResponse.json({ error: "server_configuration_error" }, { status: 500 });
  }
}
