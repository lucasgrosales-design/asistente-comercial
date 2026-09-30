"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = { id: string; closed: boolean };
export default function QuickActions({ id, closed }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function send(body: Record<string, unknown>) {
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/opportunities/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      if (!response.ok) throw new Error();
      router.refresh();
    } catch {
      setError("No pudimos guardar el cambio. Probá de nuevo.");
    }
    setBusy(false);
  }
  if (closed) {
    return <div><div className="muted" style={{ marginBottom: 8 }}>Esta persona está cerrada.</div><button className="button secondary" disabled={busy} onClick={() => send({ action: "reabrir" })}>Retomar seguimiento</button>{error && <div className="error">{error}</div>}</div>;
  }
  return <div>
    <div className="muted" style={{ marginBottom: 8 }}>Posponer el seguimiento</div>
    <div className="actions">
      <button className="button ghost" disabled={busy} onClick={() => send({ action: "posponer", days: 1 })}>Mañana</button>
      <button className="button ghost" disabled={busy} onClick={() => send({ action: "posponer", days: 3 })}>En 3 días</button>
      <button className="button ghost" disabled={busy} onClick={() => send({ action: "posponer", days: 7 })}>En 1 semana</button>
    </div>
    <div className="muted" style={{ margin: "14px 0 8px" }}>Cerrar</div>
    <div className="actions">
      <button className="button accent" disabled={busy} onClick={() => send({ action: "cerrar", status: "venta" })}>Vendido</button>
      <button className="button secondary" disabled={busy} onClick={() => send({ action: "cerrar", status: "perdido" })}>No vendido</button>
    </div>
    {error && <div className="error" style={{ marginTop: 8 }}>{error}</div>}
  </div>;
}
