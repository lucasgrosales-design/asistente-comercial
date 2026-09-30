// Reglas de seguimiento compartidas por Inicio, Seguimiento y Ficha de la persona.
export const APP_TIMEZONE = "America/Argentina/Buenos_Aires";
export const STATUS_LABELS = {
  nuevo: "Nuevo",
  en_conversacion: "En conversación",
  seguimiento: "Seguimiento",
  venta: "Vendido",
  perdido: "No vendido",
  inactivo: "Inactivo",
  en_curso: "En curso",
  sin_cambios: "Sin cambios"
} as const;
export const CLOSED_STATUSES = ["venta", "perdido", "inactivo"] as const;
export function statusLabel(status?: string | null) {
  return STATUS_LABELS[status as keyof typeof STATUS_LABELS] || status || "";
}
export function isClosed(status?: string | null) {
  return (CLOSED_STATUSES as readonly string[]).includes(String(status));
}
export function todayAR(now: Date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: APP_TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}
export function daysBetween(a: string, b: string) {
  const ms = Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`);
  return Math.round(ms / 86400000);
}
export function formatDay(date?: string | null) {
  if (!date) return "Sin fecha";
  const parsed = new Date(`${date.slice(0, 10)}T12:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return date;
  return new Intl.DateTimeFormat("es-AR", { timeZone: "UTC", weekday: "short", day: "numeric", month: "short" }).format(parsed).replace(/\./g, "");
}
export function formatDateTime(value?: string | null) {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("es-AR", { timeZone: APP_TIMEZONE, day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(parsed).replace(/\./g, "");
}
export type AttentionReason = "vencida" | "hoy" | "nueva" | "sin_novedades";
export type Attention = { reason: AttentionReason; label: string; rank: number; sortKey: string };
type FollowUpItem = { status?: string | null; next_action_at?: string | null; updated_at?: string | null };
export function attentionFor(item: FollowUpItem, today: string = todayAR()): Attention | null {
  if (isClosed(item.status)) return null;
  const due = item.next_action_at ? item.next_action_at.slice(0, 10) : null;
  if (due && due < today) {
    const days = daysBetween(due, today);
    return { reason: "vencida", label: days === 1 ? "Venció ayer" : `Vencida hace ${days} días`, rank: 0, sortKey: due };
  }
  if (due === today) return { reason: "hoy", label: "Para hoy", rank: 1, sortKey: due };
  if (item.status === "nuevo" && !due) return { reason: "nueva", label: "Consulta nueva", rank: 2, sortKey: (item.updated_at || "").slice(0, 10) };
  if (!due || due <= today) {
    const last = item.updated_at ? todayAR(new Date(item.updated_at)) : null;
    if (last) {
      const idle = daysBetween(last, today);
      if (idle >= 7) return { reason: "sin_novedades", label: `Sin novedades hace ${idle} días`, rank: 3, sortKey: last };
    }
  }
  return null;
}
export function sortByUrgency<T extends FollowUpItem>(items: T[], today: string = todayAR()) {
  return items
    .map((item) => ({ item, attention: attentionFor(item, today) }))
    .sort((a, b) => {
      const ra = a.attention?.rank ?? 9;
      const rb = b.attention?.rank ?? 9;
      if (ra !== rb) return ra - rb;
      const da = a.attention?.sortKey || a.item.next_action_at || "9999";
      const db = b.attention?.sortKey || b.item.next_action_at || "9999";
      return da < db ? -1 : da > db ? 1 : 0;
    });
}
