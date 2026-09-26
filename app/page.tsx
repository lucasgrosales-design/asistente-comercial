import Link from "next/link";
import { redirect } from "next/navigation";
import { getSupabaseServer } from "./lib/supabase-server";
import { resolveCompanyId } from "./lib/company";
import { getDemoState,isDemoSession,isDemoUser } from "./lib/demo";
export const dynamic="force-dynamic";
const labels={nuevo:"Nuevo",en_conversacion:"En conversación",seguimiento:"Seguimiento",venta:"Venta",perdido:"No vendido",inactivo:"Inactivo"} as const;
function HomeView({opportunities}:{opportunities:any[]}){
const today=new Date().toISOString().slice(0,10);
const active=opportunities.filter(o=>!["venta","perdido","inactivo"].includes(o.status));
const overdue=active.filter(o=>o.next_action_at&&o.next_action_at<today).length;
const todayCount=active.filter(o=>o.next_action_at===today).length;
const sales=opportunities.filter(o=>o.status==="venta").length;
return <main className="container">
<section className="hero card"><div className="page-head" style={{marginBottom:0}}><div><div className="eyebrow">Tu jornada comercial</div><h1>¿Qué tengo que hacer hoy?</h1><p>Concentrate en las personas que preguntaron y en el próximo paso. Sin planillas, sin un CRM pesado.</p></div><Link className="button accent" href="/oportunidades/nueva">+ Nueva oportunidad</Link></div></section>
<section className="grid stats" style={{marginTop:16}}><div className="card stat"><div className="stat-label">Oportunidades activas</div><strong>{active.length}</strong><div className="stat-note">En proceso</div></div><div className="card stat"><div className="stat-label">Para hoy</div><strong>{todayCount}</strong><div className="stat-note">Próximas acciones</div></div><div className="card stat"><div className="stat-label">Vencidas</div><strong>{overdue}</strong><div className="stat-note">Requieren atención</div></div><div className="card stat"><div className="stat-label">Ventas</div><strong>{sales}</strong><div className="stat-note">Cerradas</div></div></section>
<section className="card" style={{marginTop:16}}><div className="section-head"><h2 className="section-title">Oportunidades activas</h2><Link className="section-link" href="/gestion">Ver gestión →</Link></div>
{!active.length?<div className="empty">Todavía no hay oportunidades.<br/><Link className="section-link" href="/oportunidades/nueva">Crear la primera →</Link></div>:<div className="list">{active.map(o=><Link className="item" href={`/oportunidades/${o.id}`} key={o.id}><div className="item-main"><div><div className="item-title">{o.contact_name||o.contacts?.[0]?.name||"Sin nombre"}</div><div className="item-meta">{o.need||"Necesidad pendiente de relevar"}</div></div><span className={`badge ${o.status==="seguimiento"?"warn":""}`}>{labels[o.status as keyof typeof labels]||o.status}</span></div><div className="item-summary">{o.current_summary||"Sin resumen todavía."}</div><div className="item-footer"><span>Próximo paso: {o.next_action||"Definir acción"}</span><span>{o.next_action_at||"Sin fecha"} →</span></div></Link>)}</div>}</section>
</main>}
export default async function Home(){const db=await getSupabaseServer();const {data:{user}}=await db.auth.getUser();if(await isDemoSession()||isDemoUser(user?.email))return <HomeView opportunities={(await getDemoState()).opportunities}/>;const companyId=await resolveCompanyId();if(!companyId)redirect("/configuracion");const result=await db.from("opportunities").select("id,status,need,product,current_summary,next_action,next_action_at,updated_at,contacts(name,phone)").eq("company_id",companyId).order("updated_at",{ascending:false});if(result.error)throw new Error(result.error.message);return <HomeView opportunities={result.data||[]}/>;}
