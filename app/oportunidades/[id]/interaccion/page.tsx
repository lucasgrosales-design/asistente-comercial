"use client";
import { use, useState } from "react";
import Link from "next/link";

export default function InteractionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    if (!text.trim() || saving) return;
    setSaving(true); setError("");
    try {
      const response = await fetch(`/api/opportunities/${id}/interactions`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo guardar la interacción");
      window.location.href = `/oportunidades/${id}`;
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar la interacción");
      setSaving(false);
    }
  }

  return <main className="container"><div className="row" style={{ marginBottom: 12 }}><Link className="button ghost" href={`/oportunidades/${id}`}>← Volver</Link></div><section className="card"><h1 style={{ marginTop: 0 }}>Registrar interacción</h1><p className="muted">Escribí lo mínimo. El asistente transforma el relato en memoria comercial.</p><div className="field"><label>¿Qué pasó?</label><textarea rows={8} placeholder="Ej.: Hablé con Juan. Le pasé la propuesta y dijo que la está comparando con otra compañía. Me pidió que lo llame el viernes." value={text} onChange={e => setText(e.target.value)} /></div>{error && <p className="error">{error}</p>}<div className="actions"><button className="button" disabled={!text.trim() || saving} onClick={save}>{saving ? "Procesando..." : "Guardar y actualizar resumen"}</button><Link className="button secondary" href={`/oportunidades/${id}`}>Cancelar</Link></div></section></main>;
}
