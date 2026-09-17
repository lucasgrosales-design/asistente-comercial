"use client";
import { useState } from "react";
import { getSupabaseBrowser } from "../lib/supabase-browser";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit() {
    setLoading(true); setError(""); setMessage("");
    const supabase = getSupabaseBrowser();
    if (mode === "login") {
      const result = await supabase.auth.signInWithPassword({ email, password });
      if (result.error) setError(result.error.message); else window.location.href = "/";
    } else {
      const result = await supabase.auth.signUp({ email, password });
      if (result.error) setError(result.error.message);
      else if (result.data.session) window.location.href = "/configuracion";
      else setMessage("Cuenta creada. Revisá tu email para confirmar la cuenta y luego ingresá.");
    }
    setLoading(false);
  }
  return <main className="container" style={{ maxWidth: 480 }}><section className="card"><h1 style={{ marginTop: 0 }}>{mode === "login" ? "Ingresar" : "Crear cuenta"}</h1><p className="muted">{mode === "login" ? "Accedé a tu memoria comercial." : "Creá el acceso de la empresa."}</p><div className="field"><label>Email</label><input type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} /></div><div className="field"><label>Contraseña</label><input type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={e => setPassword(e.target.value)} /></div>{error && <p className="error">{error}</p>}{message && <p>{message}</p>}<button className="button" disabled={!email || !password || loading} onClick={submit}>{loading ? "Procesando..." : mode === "login" ? "Ingresar" : "Crear cuenta"}</button><button className="button secondary" style={{ marginTop: 10 }} onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); setMessage(""); }}>{mode === "login" ? "Crear una cuenta" : "Ya tengo una cuenta"}</button></section></main>;
}
