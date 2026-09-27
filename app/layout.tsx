import "./globals.css";
import Link from "next/link";
import LogoutButton from "./lib/logout-button";
import { getSupabaseServer } from "./lib/supabase-server";
import { isDemoSession } from "./lib/demo";

export const metadata={title:"Asistente Comercial",description:"Seguimiento comercial simple y accionable."};

export default async function RootLayout({children}:{children:React.ReactNode}){
  const demo = await isDemoSession();
  let authenticated = demo;
  if (!demo) {
    const db = await getSupabaseServer();
    const { data:{user} } = await db.auth.getUser();
    authenticated = !!user;
  }
  return <div className="shell">
    {authenticated && <header className="topbar"><div className="topbar-inner">
      <Link href="/" className="brand"><span className="brand-mark">A</span><span>Asistente Comercial</span></Link>
      <nav className="nav"><Link href="/">Inicio</Link><Link href="/gestion">Gestión</Link><Link href="/oportunidades/nueva">Nueva oportunidad</Link><LogoutButton/></nav>
    </div></header>}
    {children}
    {authenticated && <nav className="mobile-nav"><Link href="/">Inicio</Link><Link href="/gestion">Gestión</Link><Link href="/oportunidades/nueva"><span className="plus">+</span><br/>Nueva</Link><LogoutButton/></nav>}
  </div>}
