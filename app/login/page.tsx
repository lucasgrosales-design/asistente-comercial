"use client";

import { useState } from "react";
import { getSupabaseBrowser } from "../lib/supabase-browser";
import { DEMO_EMAIL, DEMO_PASSWORD } from "../lib/demo-config";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    setLoading(true); setError(""); setMessage("");
    const supabase = getSupabaseBrowser();
    if (mode === "login") {
      const result = await supabase.auth.signInWithPassword({ email, password });
      if (result.error) setError("Email o contraseña incorrectos.");
      else window.location.href = "/";
    } else {
      const result = await supabase.auth.signUp({ email, password });
      if (result.error) setError(result.error.message);
      else if (result.data.session) window.location.href = "/configuracion";
      else setMessage("Cuenta creada. Revisá tu email para confirmar la cuenta y luego ingresá.");
    }
    setLoading(false);
  }

  async function demoLogin() {
    setMode("login"); setLoading(true); setError(""); setMessage("");
    const supabase = getSupabaseBrowser();
    let signInError = (await supabase.auth.signInWithPassword({ email: DEMO_EMAIL, password: DEMO_PASSWORD })).error;

    if (signInError) {
      const created = await supabase.auth.signUp({
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
        options: { data: { name: "Usuario Demo" } }
      });
      if (created.error) {
        setError("No se pudo crear el acceso demo.");
        setLoading(false);
        return;
      }
      if (!created.data.session) {
        setError("El proyecto requiere confirmar el email del usuario demo. Desactivá la confirmación de email en Supabase para habilitar la prueba.");
        setLoading(false);
        return;
      }
      await fetch("/api/setup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ company_name: "Empresa Demo", user_name: "Usuario Demo" })
      });
      signInError = null;
    }

    if (signInError) setError("No se pudo iniciar la sesión demo.");
    else window.location.href = "/";
    setLoading(false);
  }

  return <main className="container" style={{ maxWidth: 480 }}>
    <section className="card">
      <h1 style={{ marginTop: 0 }}>{mode === "login" ? "Ingresar" : "Crear cuenta"}</h1>
      <p className="muted">{mode === "login" ? "Accedé a tu memoria comercial." : "Creá el acceso de la empresa."}</p>
      <form onSubmit={submit}>
        <div className="field"><label>Email</label><input type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} /></div>
        <div className="field"><label>Contraseña</label><input type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={e => setPassword(e.target.value)} /></div>
        {error && <p className="error">{error}</p>}
        {message && <p>{message}</p>}
        <button className="button" type="submit" disabled={!email || !password || loading}>{loading ? "Procesando..." : mode === "login" ? "Ingresar" : "Crear cuenta"}</button>
      </form>
      <button className="button secondary" style={{ marginTop: 10 }} onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); setMessage(""); }}>
        {mode === "login" ? "Crear una cuenta" : "Ya tengo una cuenta"}
      </button>
    </section>
    <section className="card" style={{ marginTop: 14 }}>
      <h2 className="section-title">Acceso de prueba</h2>
      <p className="muted">Es la misma aplicación. La empresa demo usa datos de ejemplo y sus cambios se eliminan al cerrar sesión.</p>
      <div className="field"><label>Usuario</label><input value={DEMO_EMAIL} readOnly /></div>
      <div className="field"><label>Contraseña</label><input value={DEMO_PASSWORD} readOnly /></div>
      <button className="button accent" onClick={demoLogin} disabled={loading}>Entrar a la empresa demo</button>
    </section>
  </main>;
}
