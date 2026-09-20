import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSupabaseAdmin } from "../../lib/supabase";
import { resolveCompanyId } from "../../lib/company";

const labels = { nuevo: "Nuevo", en_conversacion: "En conversación", seguimiento: "Seguimiento", venta: "Venta", perdido: "Perdido", inactivo: "Inactivo" } as const;

export default async function OpportunityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getSupabaseAdmin();
  if (!db) throw new Error("supabase_not_configured");
  const companyId = await resolveCompanyId();
  if (!companyId) redirect("/configuracion");
  const result = await db.from("opportunities").select("*,contacts(name,phone,email),users(name)").eq("id", id).eq("company_id", companyId).maybeSingle();
  if (result.error) throw new Error(result.error.message);
  const o = result.data;
  if (!o) notFound();
  const history = await db.from("interactions").select("id,channel,occurred_at,summary,outcome").eq("opportunity_id", id).order("occurred_at", { ascending: false });
  if (history.error) throw new Error(history.error.message);
  const interactions = history.data || [];
  const contactName = o.contacts?.[0]?.name || "Sin nombre";
  const phone = o.contacts?.[0]?.phone || null;
  const status = labels[o.status as keyof typeof labels] || o.status;
  return <main className="container"><div className="row" style={{ marginBottom: 12 }}><Link className="button ghost" href="/">← Volver</Link><span className={`badge ${o.status === "seguimiento" ? "warn" : ""}`}>{status}</span></div><div className="grid two"><section className="card"><div className="row between"><div><h1 style={{ margin: "0 0 5px" }}>{contactName}</h1><div className="muted">{phone || "Sin teléfono"}</div></div><div className="actions"><a className="button" href={phone ? `https://wa.me/${String(phone).replace(/\D/g, "")}` : "#"}>WhatsApp</a><a className="button secondary" href={phone ? `tel:${phone}` : "#"}>Llamar</a></div></div><hr style={{ border: 0, borderTop: "1px solid var(--line)", margin: "16px 0" }} /><p><strong>Qué busca</strong><br />{o.need || "Sin registrar"}</p><p><strong>Producto</strong><br />{o.product || "Sin registrar"}</p><p><strong>Intención</strong><br />{o.intent || "Sin registrar"}</p><div className="card" style={{ background: "var(--bg)" }}><strong>Resumen comercial</strong><p style={{ marginBottom: 0 }}>{o.current_summary || "Sin resumen todavía."}</p></div><div style={{ marginTop: 18 }}><div className="row between"><h2 className="section-title" style={{ margin: 0 }}>Próximo paso</h2><span className="badge warn">{o.next_action_at || "Sin fecha"}</span></div><p>{o.next_action || "Definir próxima acción"}</p></div></section><aside className="card"><h2 className="section-title">Historial breve</h2><div className="timeline">{interactions.length ? interactions.map(i => <div className="timeline-item" key={i.id}><div className="row between"><strong>{i.channel}</strong><span className="muted">{i.occurred_at}</span></div><p style={{ margin: "6px 0" }}>{i.summary}</p><small className="muted">{i.outcome || "Sin resultado registrado"}</small></div>) : <p className="muted">Todavía no hay interacciones registradas.</p>}</div><Link className="button" style={{ display: "block", textAlign: "center", marginTop: 12 }} href={`/oportunidades/${o.id}/interaccion`}>Registrar interacción</Link></aside></div></main>;
}
