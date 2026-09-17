import "./globals.css";
import Link from "next/link";
export const metadata={title:"Asistente Comercial",description:"Memoria comercial simple para equipos que venden."};
export default function RootLayout({children}:{children:React.ReactNode}){return <div className="shell"><header className="topbar"><div className="topbar-inner"><Link href="/" className="brand">Asistente Comercial</Link><nav className="row"><Link href="/">Inicio</Link><span className="muted">·</span><Link href="/oportunidades/nueva">Nueva oportunidad</Link><span className="muted">·</span><Link href="/gestion">Gestión</Link></nav></div></header>{children}</div>}
