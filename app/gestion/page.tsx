import Link from "next/link";
import { redirect } from "next/navigation";
import { getSupabaseServer } from "../lib/supabase-server";
import { resolveCompanyId } from "../lib/company";
import { getDemoState, isDemoSession } from "../lib/demo";
import { formatDay, isClosed, sortByUrgency, statusLabel, todayAR } from "../lib/followup";

export const dynamic = "force-dynamic";

export default async function ManagementPage() {
  let opportunities: any[] = [];
  if (await isDemoSession()) {
    opportunities = (await getDemoState()).opportunities;
  } else {
    const db = await getSupabaseServer();
    const { data: { user } } = await db.auth.getUser();
    if (!user) redirect("/login");
    const companyId = await resolveCompanyId();
    if (!companyId) redirect("/configuracion");
    const result = await db.from("opportunities").select("id,status,need,current_summary,next_action,next_action_at,updated_at,contacts(name,phone),users(name)").eq("company_id", companyId).order("updated_at", { ascending: false });
    if (result.error) throw new Error(result.error.message);
    opportunities = result.data || [];
  }
  const today = todayAR();
  const active = opportunities.filter(o => !isClosed(o.status));
  const ordered = sortByUrgency(active, today);
  const overdue = ordered.filter(x => x.attention?.reason === "vencida").length;
  const idle = ordered.filter(x => x.attention?.reason === "sin_novedades").length;
  const sales = opportunities.filter(o => o.status === "venta").length;

  return <main className="container">
    <div className="row between" style={{ marginBottom: 14 }}><div><h1 style={{ margin: 0 }}>Seguimiento</h1><p className="muted">Todo lo que requiere atención, sin cargar un CRM.</p></div><Link className="button secondary" href="/">← Inicio</Link></div>
    <section className="grid stats">
      <div className="card stat"><span className="muted">Activas</span><strong>{active.length}</strong></div>
      <div className="card stat"><span className="muted">Seguimientos vencidos</span><strong>{overdue}</strong></div>
      <div className="card stat"><span className="muted">Sin novedades hace 7+ días</span><strong>{idle}</strong></div>
      <div className="card stat"><span className="muted">Vendidas</span><strong>{sales}</strong></div>
    </section>
    <section className="card" style={{ marginTop: 14 }}>
      <h2 className="section-title">Personas que requieren atención</h2>
      {ordered.length ? <div className="list">{ordered.map(({ item: o, attention }) => {
        const contact = Array.isArray(o.contacts) ? o.contacts[0] : o.contacts;
        const user = Array.isArray(o.users) ? o.users[0] : o.users;
        return <Link className="item" href={`/oportunidades/${o.id}`} key={o.id}>
          <div className="row between"><div><strong>{o.contact_name || contact?.name || "Sin nombre"}</strong><div className="muted">{o.need || "Sin necesidad registrada"} · {o.assigned_user_name || user?.name || "Sin asignar"}</div></div>
            <span className={`badge ${attention?.reason === "vencida" ? "danger" : attention?.reason === "hoy" ? "warn" : ""}`}>{attention?.label || (o.next_action_at ? formatDay(o.next_action_at) : statusLabel(o.status))}</span></div>
          <p className="muted" style={{ marginBottom: 0 }}>{o.current_summary || "Sin resumen todavía."}</p>
        </Link>;
      })}</div> : <p className="muted">No hay seguimientos todavía. Creá el primero desde + Nueva consulta.</p>}
    </section>
  </main>;
}
