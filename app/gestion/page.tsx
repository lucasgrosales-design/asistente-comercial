import Link from "next/link";
import { redirect } from "next/navigation";
import { getSupabaseServer } from "../lib/supabase-server";
import { resolveCompanyId } from "../lib/company";
import { getDemoState, isDemoUser } from "../lib/demo";

export default async function ManagementPage() {
  const db = await getSupabaseServer();
  const { data: { user } } = await db.auth.getUser();
  let opportunities:any[] = [];
  if (isDemoUser(user?.email)) opportunities = (await getDemoState()).opportunities;
  else {
    const companyId = await resolveCompanyId();
    if (!companyId) redirect("/configuracion");
    const result = await db.from("opportunities").select("id,status,need,current_summary,next_action,next_action_at,updated_at,contacts(name,phone),users(name)").eq("company_id", companyId).order("updated_at", { ascending: false });
    if (result.error) throw new Error(result.error.message);
    opportunities = result.data || [];
  }
  const active = opportunities.filter(o => !["venta", "perdido", "inactivo"].includes(o.status));
  const today = new Date().toISOString().slice(0, 10);
  const overdue = active.filter(o => o.next_action_at && o.next_action_at < today);
  const noActivity = active.filter(o => !o.updated_at || new Date(o.updated_at).getTime() < Date.now() - 7 * 86400000);
  return <main className="container"><div className="row between" style={{ marginBottom: 14 }}><div><h1 style={{ margin: 0 }}>Gestión comercial</h1><p className="muted">Visibilidad operativa sin convertir esto en un tablero complejo.</p></div><Link className="button secondary" href="/">← Vendedor</Link></div><section className="grid stats"><div className="card stat"><span className="muted">Activas</span><strong>{active.length}</strong></div><div className="card stat"><span className="muted">Seguimientos vencidos</span><strong>{overdue.length}</strong></div><div className="card stat"><span className="muted">Sin actividad +7 días</span><strong>{noActivity.length}</strong></div><div className="card stat"><span className="muted">Ventas</span><strong>{opportunities.filter(o => o.status === "venta").length}</strong></div></section><section className="card" style={{ marginTop: 14 }}><h2 className="section-title">Oportunidades que requieren atención</h2>{active.length ? <div className="list">{active.map(o => { const contact = Array.isArray(o.contacts) ? o.contacts[0] : o.contacts; const user = Array.isArray(o.users) ? o.users[0] : o.users; return <Link className="item" href={`/oportunidades/${o.id}`} key={o.id}><div className="row between"><div><strong>{o.contact_name || contact?.name || "Sin nombre"}</strong><div className="muted">{o.need || "Sin necesidad registrada"} · {o.assigned_user_name || user?.name || "Sin asignar"}</div></div><span className={`badge ${o.next_action_at && o.next_action_at < today ? "warn" : ""}`}>{o.next_action_at || "Sin próxima fecha"}</span></div><p className="muted" style={{ marginBottom: 0 }}>{o.current_summary || "Sin resumen todavía."}</p></Link>})}</div> : <p className="muted">No hay oportunidades todavía. Creá la primera desde + Nueva.</p>}</section></main>;
}
