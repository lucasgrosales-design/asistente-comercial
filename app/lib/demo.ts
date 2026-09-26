import { cookies } from "next/headers";
import type { Interaction, Opportunity } from "./types";

import { DEMO_EMAIL } from "./demo-config";
export { DEMO_EMAIL } from "./demo-config";

const DEMO_COOKIE = "asistente_demo_state";

export const demoOpportunities: Opportunity[] = [
  { id:"demo-1", contact_name:"Juan Pérez", phone:"+54 9 343 555-0123", need:"Cobertura para Amarok 2025", product:"Seguro automotor", intent:"Está comparando alternativas", status:"seguimiento", current_summary:"Busca seguro para una Amarok 2025. Ya recibió una propuesta y está comparando coberturas y precio.", next_action:"Recontactar y consultar decisión", next_action_at:"2026-09-18", assigned_user_name:"Lucas", updated_at:"2026-09-17" },
  { id:"demo-2", contact_name:"María Gómez", phone:"+54 9 343 555-0456", need:"Seguro integral para comercio", product:"Comercio", intent:"Interés alto", status:"en_conversacion", current_summary:"Tiene un local y pidió conocer opciones de cobertura. Falta relevar algunos datos para cotizar.", next_action:"Pedir datos del local", next_action_at:"2026-09-17", assigned_user_name:"Lucas", updated_at:"2026-09-17" },
  { id:"demo-3", contact_name:"Carlos Benítez", phone:"+54 9 343 555-0789", need:"Renovación de póliza", product:"Automotor", intent:"Esperando propuesta", status:"nuevo", current_summary:"Consulta inicial. Todavía no se completó el relevamiento.", next_action:"Contactar", next_action_at:"2026-09-17", assigned_user_name:"Ana", updated_at:"2026-09-16" }
];

export const demoInteractions: Record<string, Interaction[]> = {
  "demo-1":[
    { id:"i1", occurred_at:"2026-09-12", channel:"WhatsApp", summary:"Consultó por cobertura para Amarok 2025.", outcome:"Pidió cotización", user_name:"Lucas" },
    { id:"i2", occurred_at:"2026-09-14", channel:"WhatsApp", summary:"Se envió propuesta. Está comparando alternativas.", outcome:"Seguimiento", user_name:"Lucas" }
  ],
  "demo-2":[
    { id:"i3", occurred_at:"2026-09-17", channel:"WhatsApp", summary:"Explicó que tiene un comercio y quiere cobertura integral.", outcome:"Relevar datos", user_name:"Lucas" }
  ],
  "demo-3":[]
};

export type DemoState = { opportunities: Opportunity[]; interactions: Record<string, Interaction[]> };

export function isDemoUser(email?: string | null) {
  return String(email || "").toLowerCase() === DEMO_EMAIL;
}

export function demoSeedState(): DemoState {
  return { opportunities: structuredClone(demoOpportunities), interactions: structuredClone(demoInteractions) };
}

function encode(state: DemoState) {
  return Buffer.from(JSON.stringify(state), "utf8").toString("base64url");
}

function decode(value?: string): DemoState {
  if (!value) return demoSeedState();
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
    if (Array.isArray(parsed.opportunities) && parsed.interactions && typeof parsed.interactions === "object") return parsed as DemoState;
  } catch {}
  return demoSeedState();
}

export async function getDemoState(): Promise<DemoState> {
  const store = await cookies();
  return decode(store.get(DEMO_COOKIE)?.value);
}

export async function saveDemoState(state: DemoState) {
  const store = await cookies();
  store.set(DEMO_COOKIE, encode(state), { httpOnly:true, sameSite:"lax", secure:process.env.NODE_ENV==="production", path:"/", maxAge:60*60*8 });
}

export async function clearDemoState() {
  const store = await cookies();
  store.delete(DEMO_COOKIE);
}
