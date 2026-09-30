import { describe, expect, it } from "vitest";
import { addDays, computeQuickUpdate, quickActionSchema } from "../app/lib/quick-actions";
const today = "2026-09-30";
const now = new Date("2026-09-30T15:00:00Z");
describe("addDays", () => {
  it("cruza fin de mes y de año", () => {
    expect(addDays("2026-09-30", 1)).toBe("2026-10-01");
    expect(addDays("2026-12-30", 3)).toBe("2027-01-02");
  });
});
describe("computeQuickUpdate", () => {
  it("pospone y pasa una consulta nueva a seguimiento", () => {
    const r = computeQuickUpdate({ status: "nuevo", next_action: null }, { action: "posponer", days: 3 }, today, now);
    expect(r.ok && r.patch).toMatchObject({ next_action_at: "2026-10-03", status: "seguimiento", next_action: "Retomar contacto" });
  });
  it("pospone sin cambiar el estado ni la acción definida", () => {
    const r = computeQuickUpdate({ status: "en_conversacion", next_action: "Enviar cotización" }, { action: "posponer", days: 1 }, today, now);
    expect(r.ok && r.patch).toMatchObject({ next_action_at: "2026-10-01", status: "en_conversacion", next_action: "Enviar cotización" });
  });
  it("no deja posponer una persona cerrada", () => {
    expect(computeQuickUpdate({ status: "venta" }, { action: "posponer", days: 1 }, today, now)).toEqual({ ok: false, error: "opportunity_closed" });
  });
  it("al cerrar limpia la próxima acción", () => {
    const r = computeQuickUpdate({ status: "seguimiento", next_action: "Llamar" }, { action: "cerrar", status: "venta" }, today, now);
    expect(r.ok && r.patch).toMatchObject({ status: "venta", next_action: null, next_action_at: null });
  });
  it("reabre solo lo cerrado y lo deja para hoy", () => {
    const r = computeQuickUpdate({ status: "perdido" }, { action: "reabrir" }, today, now);
    expect(r.ok && r.patch).toMatchObject({ status: "seguimiento", next_action_at: today });
    expect(computeQuickUpdate({ status: "nuevo" }, { action: "reabrir" }, today, now)).toEqual({ ok: false, error: "opportunity_not_closed" });
  });
});
describe("quickActionSchema", () => {
  it("rechaza entradas inválidas", () => {
    expect(quickActionSchema.safeParse({ action: "posponer", days: 0 }).success).toBe(false);
    expect(quickActionSchema.safeParse({ action: "posponer", days: 99 }).success).toBe(false);
    expect(quickActionSchema.safeParse({ action: "cerrar", status: "inactivo" }).success).toBe(false);
    expect(quickActionSchema.safeParse({ action: "borrar" }).success).toBe(false);
    expect(quickActionSchema.safeParse({ action: "reabrir", extra: 1 }).success).toBe(false);
  });
});
