import Link from "next/link";
import { redirect } from "next/navigation";
import { getSupabaseAdmin } from "./lib/supabase";
import { resolveCompanyId } from "./lib/company";
import { demoOpportunities } from "./lib/demo";

const labels = { nuevo: "Nuevo", en_conversacion: "En conversación", seguimiento: "Seguimiento", venta: "Venta", perdido: "Perdido", inactivo: "Inactivo" } as const;

export default async function Home() {
  const today = new Date().toISOString().slice(0, 10);
  const db = getSupabaseAdmin();
  let opportunities: any[] = [];
  if (db) {
    const companyId = await resolveCompanyId();
    if (!companyId) redirect("/configuracion");
    const result = await db.from("opportunities").select("id,status,need,product,current_summary,next_action,next_action_at,updated_at,contacts(name,phone)").eq("company_id", companyId).order("updated_at", { ascending: false });
    opportunities = result.data || [];
  } else {
    opportunities = demoOpportunities;
  }
  const active = opportunities.filter(o => !["venta", "perdido", "inactivo"].includes(o.status));
  const overdue = active.filter(o => o.next_action_at && o.next_action_at < today).length;
  const todayCount = active.filter(o => o.next_action_at === today).length;
  const sales = opportunities.filter(o => o.status === "venta").length;
  return <main className="container"><section className="card" style={{ marginBottom: 14 }}><div className="row between"><div><h1 style={{ margin: "0 0 6px" }}>¿Qué tengo que hacer hoy?</h1><p className="muted" style={{ margin: 0 }}>La información comercial importante, sin obligarte a llenar un CRM.</p></div><Link className="button" href="/oportunidades/nueva">+ Nueva</Link></div></section><section className="grid stats"><div className="card stat"><span className="muted">Activas</span><strong>{active.length}</strong></div><div className="card stat"><span className="muted">Para hoy</span><strong>{todayCount}</strong></div><div className="card stat"><span className="muted">Vencidas</span><strong>{overdue}</strong></div><div className="card stat"><span className="muted">Ventas</span><strong>{sales}</strong></div></section><section className="card" style={{ marginTop: 14 }}><h2 className="section-title">Oportunidades activas</h2>{!active.length ? <p className="muted">Todavía no hay oportunidades. Creá la primera con + Nueva.</p> : <div className="list">{active.map(o => { const name = o.contacts?.name || o.contact_name || "Sin nombre"; return <Link className="item" href={`/oportunidades/${o.id}`} key={o.id}><div className="row between"><div><strong>{name}</strong><div className="muted" style={{ marginTop: 4 }}>{o.need || "Sin necesidad registrada"}</div></div><span className={`badge ${o.status === "seguimiento" ? "warn" : ""}`}>{labels[o.status as keyof typeof labels] || o.status}</span></div><div className="row between" style={{ marginTop: 9 }}><span className="muted">{o.current_summary || "Sin resumen todavía."}</span><span className="muted">→</span></div></Link>; })}</div>}</section></main>;
}
