"use client";
import { useState } from "react";

export default function SetupPage() {
  const [companyName, setCompanyName] = useState("");
  const [userName, setUserName] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  async function save() {
    setSaving(true); setError("");
    const response = await fetch("/api/setup", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ company_name: companyName, user_name: userName }) });
    const data = await response.json();
    if (!response.ok) { setError(data.error || "No se pudo configurar la empresa"); setSaving(false); return; }
    window.location.href = "/";
  }
  return <main className="container" style={{ maxWidth: 560 }}><section className="card"><h1 style={{ marginTop: 0 }}>Configurar empresa</h1><p className="muted">Este paso se realiza una sola vez. Después, el asistente trabajará sobre la memoria comercial de tu empresa.</p><div className="field"><label>Nombre de la empresa</label><input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Ej.: Productora de Seguros Pérez" /></div><div className="field"><label>Tu nombre</label><input value={userName} onChange={e => setUserName(e.target.value)} placeholder="Nombre y apellido" /></div>{error && <p className="error">{error}</p>}<button className="button" disabled={!companyName.trim() || !userName.trim() || saving} onClick={save}>{saving ? "Configurando..." : "Comenzar"}</button></section></main>;
}
