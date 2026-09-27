import { cookies } from "next/headers";
import crypto from "node:crypto";
import type { Interaction, Opportunity } from "./types";
import { DEMO_EMAIL } from "./demo-config";
import { getSupabaseAdmin } from "./supabase";

export { DEMO_EMAIL } from "./demo-config";

const DEMO_SESSION_COOKIE = "asistente_demo_session";
const DEMO_SESSION_TTL_SECONDS = 60 * 60 * 8;
const MAX_DEMO_OPPORTUNITIES = 12;
const MAX_DEMO_INTERACTIONS = 5;

export type DemoState = { opportunities: Opportunity[]; interactions: Record<string, Interaction[]> };

function demoSecret() {
  return process.env.DEMO_SESSION_SECRET || null;
}

function signPayload(payload: string) {
  const secret = demoSecret();
  if (!secret) throw new Error("demo_session_secret_not_configured");
  return crypto.createHmac("sha256", secret).update(payload).digest("base64url");
}

export function createDemoCookieValue(sessionId: string, expiresAt: number) {
  const payload = `${sessionId}.${expiresAt}`;
  return `${payload}.${signPayload(payload)}`;
}

export function verifyDemoCookieValue(value?: string | null) {
  if (!value) return null;
  const parts = value.split(".");
  if (parts.length !== 3) return null;
  const [sessionId, expiresRaw, signature] = parts;
  if (!/^[0-9a-f-]{36}$/i.test(sessionId)) return null;
  const expiresAt = Number(expiresRaw);
  if (!Number.isSafeInteger(expiresAt) || expiresAt <= Math.floor(Date.now() / 1000)) return null;
  const payload = `${sessionId}.${expiresAt}`;
  const expected = signPayload(payload);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  return { sessionId, expiresAt };
}

function dateOffset(days: number) { const d = new Date(); d.setDate(d.getDate() + days); return d.toISOString().slice(0, 10); }
function dateTimeOffset(days: number) { const d = new Date(); d.setDate(d.getDate() + days); return d.toISOString(); }

export function isDemoUser(email?: string | null) { return String(email || "").toLowerCase() === DEMO_EMAIL; }

async function getSession() {
  const store = await cookies();
  const verified = verifyDemoCookieValue(store.get(DEMO_SESSION_COOKIE)?.value);
  if (!verified) return null;
  const db = getSupabaseAdmin();
  if (!db) return null;
  const { data, error } = await db.from("demo_sessions").select("id,expires_at").eq("id", verified.sessionId).maybeSingle();
  if (error || !data) return null;
  if (new Date(data.expires_at).getTime() <= Date.now()) {
    await db.from("demo_sessions").delete().eq("id", verified.sessionId);
    return null;
  }
  return verified;
}

export async function isDemoSession() { return Boolean(await getSession()); }

export function demoSeedState(): DemoState {
  const today = dateOffset(0);
  const opportunities: Opportunity[] = [
    { id:"demo-1",contact_name:"Juan Pérez",phone:"+54 9 343 555-0123",need:"Cobertura para Amarok 2025",product:"Seguro automotor",intent:"Está comparando alternativas",status:"seguimiento",current_summary:"Ya recibió una propuesta y está comparando coberturas y precio.",next_action:"Recontactar y consultar decisión",next_action_at:dateOffset(-2),assigned_user_name:"Lucas",updated_at:dateTimeOffset(-1) },
    { id:"demo-2",contact_name:"María Gómez",phone:"+54 9 343 555-0456",need:"Seguro integral para comercio",product:"Comercio",intent:"Interés alto",status:"en_conversacion",current_summary:"Pidió opciones de cobertura. Falta relevar algunos datos para cotizar.",next_action:"Pedir datos del local",next_action_at:today,assigned_user_name:"Lucas",updated_at:dateTimeOffset(0) },
    { id:"demo-3",contact_name:"Carlos Benítez",phone:"+54 9 343 555-0789",need:"Renovación de póliza",product:"Automotor",intent:"Esperando propuesta",status:"nuevo",current_summary:"Consulta inicial. Todavía no se completó el relevamiento.",next_action:"Contactar",next_action_at:dateOffset(1),assigned_user_name:"Ana",updated_at:dateTimeOffset(-1) }
  ];
  const interactions: Record<string,Interaction[]> = {
    "demo-1":[{id:"i1",occurred_at:dateOffset(-5),channel:"WhatsApp",summary:"Consultó por cobertura para Amarok 2025.",outcome:"Pidió cotización",user_name:"Lucas"},{id:"i2",occurred_at:dateOffset(-3),channel:"WhatsApp",summary:"Se envió propuesta. Está comparando alternativas.",outcome:"Seguimiento",user_name:"Lucas"}],
    "demo-2":[{id:"i3",occurred_at:dateOffset(-1),channel:"WhatsApp",summary:"Explicó que tiene un comercio y quiere cobertura integral.",outcome:"Relevar datos",user_name:"Lucas"}],
    "demo-3":[]
  };
  return { opportunities, interactions };
}

function compactState(state: DemoState): DemoState {
  return {
    opportunities: state.opportunities.slice(0, MAX_DEMO_OPPORTUNITIES),
    interactions: Object.fromEntries(
      Object.entries(state.interactions).map(([id, list]) => [id, list.slice(0, MAX_DEMO_INTERACTIONS)])
    )
  };
}

export async function startDemoSession() {
  const db = getSupabaseAdmin();
  if (!db) throw new Error("supabase_not_configured");
  if (!demoSecret()) throw new Error("demo_session_secret_not_configured");

  const sessionId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + DEMO_SESSION_TTL_SECONDS * 1000);
  const { error } = await db.from("demo_sessions").insert({
    id: sessionId,
    state: compactState(demoSeedState()),
    expires_at: expiresAt.toISOString()
  });
  if (error) throw new Error("demo_session_create_failed");

  const store = await cookies();
  store.set(DEMO_SESSION_COOKIE, createDemoCookieValue(sessionId, Math.floor(expiresAt.getTime() / 1000)), {
    httpOnly:true, sameSite:"lax", secure:process.env.NODE_ENV==="production", path:"/", maxAge:DEMO_SESSION_TTL_SECONDS
  });
}

export async function getDemoState() {
  const session = await getSession();
  if (!session) return demoSeedState();
  const db = getSupabaseAdmin();
  if (!db) return demoSeedState();
  const { data, error } = await db.from("demo_sessions").select("state").eq("id", session.sessionId).maybeSingle();
  if (error || !data?.state) return demoSeedState();
  const state = data.state as DemoState;
  if (!Array.isArray(state.opportunities) || !state.interactions || typeof state.interactions !== "object") return demoSeedState();
  return compactState(state);
}

export async function saveDemoState(state: DemoState) {
  const session = await getSession();
  if (!session) throw new Error("demo_session_invalid");
  const db = getSupabaseAdmin();
  if (!db) throw new Error("supabase_not_configured");
  const { error } = await db.from("demo_sessions").update({ state: compactState(state) }).eq("id", session.sessionId);
  if (error) throw new Error("demo_state_save_failed");
}

export async function clearDemoState() {
  const store = await cookies();
  const session = verifyDemoCookieValue(store.get(DEMO_SESSION_COOKIE)?.value);
  if (session) {
    const db = getSupabaseAdmin();
    if (db) await db.from("demo_sessions").delete().eq("id", session.sessionId);
  }
  store.delete(DEMO_SESSION_COOKIE);
}
