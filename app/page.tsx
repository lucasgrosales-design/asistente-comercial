import { redirect } from "next/navigation";
import Link from "next/link";
import { getSupabaseServer } from "./lib/supabase-server";
import { resolveCompanyId } from "./lib/company";
import { getDemoState, isDemoSession } from "./lib/demo";
import { formatDay, isClosed, sortByUrgency, statusLabel, todayAR } from "./lib/followup";

export const dynamic = "force-dynamic";

function HomeView({ opportunities }: { opportunities: any[] }) {
  const today = todayAR();
  const active = opportunities.filter(o => !isClosed(o.status));
  const queue = sortByUrgency(active, today).filter(x => x.attention);
  const overdue = queue.filter(x => x.attention!.reason === "vencida").length;
  const todayCount = queue.filter(x => x.attention!.reason === "hoy").length;
  const sales = opportunities.filter(o => o.status === "venta").length;

  return <main className="container">
    <section className="hero card"><div className="page-head" style={{ marginBottom: 0 }}><div><div className="eyebrow">Tu jornada comercial</div><h1>¿Qué tengo que hacer hoy?</h1><p>Concentrate en las personas que preguntaron y en el próximo paso. Sin planillas, sin un CRM pesado.</p></div><Link className="button accent" href="/oportunidades/nueva">+ Nueva consulta</Link></div></section>
    <section className="grid stats" style={{ marginTop: 16 }}>
      <div className="card stat"><div className="stat-label">Personas activas</div><strong>{active.length}</strong><div className="stat-note">En proceso</div></div>
      <div className="card stat"><div className="stat-label">Para hoy</div><strong>{todayCount}</strong><div className="stat-note">Próximos pasos</div></div>
      <div className="card stat"><div className="stat-label">Vencidas</div><strong>{overdue}</strong><div className="stat-note">Requieren atención</div></div>
      <div className="card stat"><div className="stat-label">Vendidas</div><strong>{sales}</strong><div className="stat-note">Cerradas</div></div>
    </section>
    <section className="card" style={{ marginTop: 16 }}>
      <div className="section-head"><h2 className="section-title">Para atender ahora</h2><Link className="section-link" href="/gestion">Ver seguimiento →</Link></div>
      {!queue.length
        ? <div className="empty">Estás al día: no hay nadie esperando tu respuesta.<br /><Link className="section-link" href="/gestion">Ver todas las personas →</Link></div>
        : <div className="list">{queue.map(({ item: o, attention }) => {
            const contact = Array.isArray(o.contacts) ? o.contacts[0] : o.contacts;
            return <Link className="item" href={`/oportunidades/${o.id}`} key={o.id}>
              <div className="item-main"><div><div className="item-title">{o.contact_name || contact?.name || "Sin nombre"}</div><div className="item-meta">{o.need || "Falta relevar qué busca"}</div></div><span className={`badge ${attention!.reason === "vencida" ? "danger" : attention!.reason === "hoy" ? "warn" : ""}`}>{attention!.label}</span></div>
              <div className="item-summary">{o.current_summary || "Sin resumen todavía."}</div>
              <div className="item-footer"><span>Próximo paso: {o.next_action || "Definir acción"}</span><span>{o.next_action_at ? formatDay(o.next_action_at) : statusLabel(o.status)} →</span></div>
            </Link>;
          })}</div>}
    </section>
  </main>;
}

export default async function Home() {
  if (await isDemoSession()) return <HomeView opportunities={(await getDemoState()).opportunities} />;
  const db = await getSupabaseServer();
  const { data: { user } } = await db.auth.getUser();
  if (!user) redirect("/login");
  const companyId = await resolveCompanyId();
  if (!companyId) redirect("/configuracion");
  const result = await db.from("opportunities").select("id,status,need,product,current_summary,next_action,next_action_at,updated_at,contacts(name,phone)").eq("company_id", companyId).order("updated_at", { ascending: false });
  if (result.error) throw new Error(result.error.message);
  return <HomeView opportunities={result.data || []} />;
}
