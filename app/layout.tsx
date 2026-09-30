import "./globals.css";
import Link from "next/link";
import LogoutButton from "./lib/logout-button";
import { getSupabaseServer } from "./lib/supabase-server";
import { isDemoSession } from "./lib/demo";

export const viewport={themeColor:"#176b63",width:"device-width",initialScale:1};
export const metadata={title:"Asistente Comercial",description:"Seguimiento comercial simple y accionable."};

export default async function RootLayout({children}:{children:React.ReactNode}){
  const demo = await isDemoSession();
  let authenticated = demo;
  if (!demo) {
    try {
      const db = await getSupabaseServer();
      const { data:{user} } = await db.auth.getUser();
      authenticated = !!user;
    } catch {
      authenticated = false;
    }
  }
  return <html lang="es"><body><div className="shell">
    {authenticated && <header className="topbar"><div className="topbar-inner">
      <Link href="/" className="brand"><span className="brand-mark">A</span><span>Asistente Comercial</span></Link>
      <nav className="nav"><Link href="/">Inicio</Link><Link href="/gestion">Seguimiento</Link><Link href="/oportunidades/nueva">Nueva consulta</Link><LogoutButton/></nav>
    </div></header>}
    {children}
    {authenticated && <nav className="mobile-nav"><Link href="/">Inicio</Link><Link href="/gestion">Seguimiento</Link><Link href="/oportunidades/nueva"><span className="plus">+</span><br/>Nueva</Link><LogoutButton/></nav>}
  </div></body></html>}
