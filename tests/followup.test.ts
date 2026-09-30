import { describe, expect, it } from "vitest";
import { attentionFor, daysBetween, isClosed, sortByUrgency, todayAR } from "../app/lib/followup";
const today = "2026-09-28";
describe("todayAR", () => {
  it("usa la fecha de Argentina, no la de UTC", () => {
    expect(todayAR(new Date("2026-09-29T02:30:00Z"))).toBe("2026-09-28");
    expect(todayAR(new Date("2026-09-28T15:00:00Z"))).toBe("2026-09-28");
  });
  it("calcula diferencia de días", () => expect(daysBetween("2026-09-26", "2026-09-28")).toBe(2));
});
describe("attentionFor", () => {
  it("marca como vencida una próxima acción pasada", () => {
    expect(attentionFor({ status: "seguimiento", next_action_at: "2026-09-26", updated_at: "2026-09-25T12:00:00Z" }, today)?.label).toBe("Vencida hace 2 días");
    expect(attentionFor({ status: "seguimiento", next_action_at: "2026-09-27", updated_at: "2026-09-25T12:00:00Z" }, today)?.label).toBe("Venció ayer");
  });
  it("detecta lo de hoy", () => expect(attentionFor({ status: "en_conversacion", next_action_at: "2026-09-28", updated_at: "2026-09-28T12:00:00Z" }, today)?.reason).toBe("hoy"));
  it("una consulta nueva sin fecha no queda invisible", () => expect(attentionFor({ status: "nuevo", next_action_at: null, updated_at: "2026-09-28T12:00:00Z" }, today)?.reason).toBe("nueva"));
  it("no pide atención si la fecha es futura y reciente", () => expect(attentionFor({ status: "seguimiento", next_action_at: "2026-10-05", updated_at: "2026-09-28T12:00:00Z" }, today)).toBeNull());
  it("avisa cuando hay 7+ días sin novedades y sin fecha", () => expect(attentionFor({ status: "en_conversacion", next_action_at: null, updated_at: "2026-09-19T12:00:00Z" }, today)?.reason).toBe("sin_novedades"));
  it("las personas cerradas nunca aparecen", () => {
    expect(attentionFor({ status: "venta", next_action_at: "2026-09-01", updated_at: "2026-09-01T12:00:00Z" }, today)).toBeNull();
    expect(isClosed("perdido") && isClosed("inactivo") && !isClosed("nuevo")).toBe(true);
  });
});
describe("sortByUrgency", () => {
  it("ordena: vencida más antigua, hoy, nueva, sin novedades", () => {
    const order = sortByUrgency([
      { id: "d", status: "en_conversacion", next_action_at: null, updated_at: "2026-09-19T12:00:00Z" },
      { id: "c", status: "nuevo", next_action_at: null, updated_at: "2026-09-28T12:00:00Z" },
      { id: "b", status: "seguimiento", next_action_at: "2026-09-28", updated_at: "2026-09-28T12:00:00Z" },
      { id: "a2", status: "seguimiento", next_action_at: "2026-09-27", updated_at: "2026-09-20T12:00:00Z" },
      { id: "a1", status: "seguimiento", next_action_at: "2026-09-24", updated_at: "2026-09-20T12:00:00Z" }
    ], today).map((x) => (x.item as { id: string }).id);
    expect(order).toEqual(["a1", "a2", "b", "c", "d"]);
  });
});
