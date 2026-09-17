"use client";
import { useState } from "react";
import { getSupabaseBrowser } from "../lib/supabase-browser";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function login() {
    setLoading(true); setError("");
    const supabase = getSupabaseBrowser();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message); else window.location.href = "/";
    setLoading(false);
  }
  return <main className="container" style={{ maxWidth: 480 }}><section className="card"><h1 style={{ marginTop: 0 }}>Ingresar</h1><p className="muted">Accedé a tu memoria comercial.</p><div className="field"><label>Email</label><input type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} /></div><div className="field"><label>Contraseña</label><input type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} /></div>{error && <p className="error">{error}</p>}<button className="button" disabled={!email || !password || loading} onClick={login}>{loading ? "Ingresando..." : "Ingresar"}</button></section></main>;
}
