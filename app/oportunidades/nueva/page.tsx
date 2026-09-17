"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewOpportunity() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [need, setNeed] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function create() {
    if (!name.trim() || saving) return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/opportunities", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name, phone, need }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo crear la oportunidad");
      if (data.opportunity?.id) router.push(`/oportunidades/${data.opportunity.id}`);
      else router.push("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo crear la oportunidad");
    } finally {
      setSaving(false);
    }
  }

  return <main className="container"><section className="card"><h1 style={{ marginTop: 0 }}>Nueva oportunidad</h1><p className="muted">Solo los datos necesarios para empezar. Lo demás puede surgir de la conversación.</p><div className="field"><label>Nombre</label><input value={name} onChange={e => setName(e.target.value)} placeholder="Nombre del contacto" /></div><div className="field"><label>Teléfono</label><input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+54 9 ..." /></div><div className="field"><label>Qué busca</label><input value={need} onChange={e => setNeed(e.target.value)} placeholder="Ej.: seguro para auto" /></div>{error && <p className="error">{error}</p>}<div className="actions"><button className="button" disabled={!name.trim() || saving} onClick={create}>{saving ? "Guardando..." : "Crear oportunidad"}</button><button className="button secondary" onClick={() => router.back()}>Cancelar</button></div></section></main>;
}
