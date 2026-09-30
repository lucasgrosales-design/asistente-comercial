import { z } from "zod";
import { isClosed, todayAR } from "./followup";

export const quickActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("posponer"), days: z.number().int().min(1).max(30) }).strict(),
  z.object({ action: z.literal("cerrar"), status: z.enum(["venta", "perdido"]) }).strict(),
  z.object({ action: z.literal("reabrir") }).strict()
]);
export type QuickAction = z.infer<typeof quickActionSchema>;
export function addDays(date: string, days: number) {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
function daysText(days: number) {
  if (days === 1) return "para mañana";
  if (days === 7) return "para dentro de una semana";
  return `para dentro de ${days} días`;
}
export type QuickUpdate =
  | { ok: true; patch: Record<string, unknown>; note: string; outcome: string }
  | { ok: false; error: "opportunity_closed" | "opportunity_not_closed" };
export function computeQuickUpdate(
  opp: { status?: string | null; next_action?: string | null },
  input: QuickAction,
  today: string = todayAR(),
  now: Date = new Date()
): QuickUpdate {
  const updated_at = now.toISOString();
  const closed = isClosed(opp.status);
  if (input.action === "posponer") {
    if (closed) return { ok: false, error: "opportunity_closed" };
    return { ok: true, patch: { next_action_at: addDays(today, input.days), next_action: opp.next_action || "Retomar contacto", status: opp.status === "nuevo" ? "seguimiento" : opp.status, updated_at }, note: `Seguimiento pospuesto ${daysText(input.days)}.`, outcome: "Pospuesto" };
  }
  if (input.action === "cerrar") {
    return { ok: true, patch: { status: input.status, next_action: null, next_action_at: null, updated_at }, note: input.status === "venta" ? "Marcada como vendida." : "Marcada como no vendida.", outcome: input.status };
  }
  if (!closed) return { ok: false, error: "opportunity_not_closed" };
  return { ok: true, patch: { status: "seguimiento", next_action: "Retomar contacto", next_action_at: today, updated_at }, note: "Persona reabierta para retomar el seguimiento.", outcome: "seguimiento" };
}
