"use client";
import { use, useState } from "react";
import Link from "next/link";

const outcomes=[["sin_cambios","Sin cambios"],["en_conversacion","En conversación"],["seguimiento","Recontactar"],["venta","Venta"],["perdido","No vendido"],["inactivo","Inactivo"]];

export default function InteractionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [text,setText]=useState("");
  const [channel,setChannel]=useState("whatsapp");
  const [outcome,setOutcome]=useState("en_conversacion");
  const [nextAction,setNextAction]=useState("");
  const [nextDate,setNextDate]=useState("");
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState("");

  async function save(){
    if(!text.trim()||saving)return;
    setSaving(true);setError("");
    try{
      const response=await fetch(`/api/opportunities/${id}/interactions`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({text,channel,outcome,next_action:nextAction,next_action_at:nextDate||null})});
      const data=await response.json();
      if(!response.ok)throw new Error(data.error||"No se pudo guardar la interacción");
      window.location.href=`/oportunidades/${id}`;
    }catch(e){setError(e instanceof Error?e.message:"No se pudo guardar la interacción");setSaving(false);}
  }

  return <main className="container"><div className="row" style={{marginBottom:12}}><Link className="button ghost" href={`/oportunidades/${id}`}>← Volver</Link></div><section className="card"><h1 style={{marginTop:0}}>Registrar interacción</h1><p className="muted">Registrá qué pasó. El asistente guarda el informe, actualiza el resumen y deja definida la próxima acción.</p>
  <div className="field"><label>Canal</label><select value={channel} onChange={e=>setChannel(e.target.value)}><option value="whatsapp">WhatsApp</option><option value="llamada">Llamada</option><option value="email">Email</option><option value="manual">Otro</option></select></div>
  <div className="field"><label>¿Qué pasó?</label><textarea rows={8} placeholder="Ej.: Hablé con Juan por WhatsApp. Le pasé la propuesta y dijo que la está comparando con otra compañía. Me pidió que lo llame el viernes." value={text} onChange={e=>setText(e.target.value)}/></div>
  <div className="grid two"><div className="field"><label>Resultado</label><select value={outcome} onChange={e=>setOutcome(e.target.value)}>{outcomes.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></div><div className="field"><label>Próxima fecha</label><input type="date" value={nextDate} onChange={e=>setNextDate(e.target.value)}/></div></div>
  <div className="field"><label>Próxima acción</label><input value={nextAction} onChange={e=>setNextAction(e.target.value)} placeholder="Ej.: Llamar para confirmar si acepta la propuesta"/></div>
  {error&&<p className="error">{error}</p>}<div className="actions"><button className="button" disabled={!text.trim()||saving} onClick={save}>{saving?"Procesando...":"Guardar interacción"}</button><Link className="button secondary" href={`/oportunidades/${id}`}>Cancelar</Link></div>
  </section></main>;
}