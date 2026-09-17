import { getSupabaseAdmin } from "./supabase";

export async function resolveCompanyId(value?: string | null) {
  const id = value?.trim() || process.env.DEFAULT_COMPANY_ID?.trim();
  if (!id) return null;
  const db = getSupabaseAdmin();
  if (!db) return id;
  const { data, error } = await db.from("companies").select("id").eq("id", id).maybeSingle();
  if (error || !data) return null;
  return data.id;
}

export const VALID_STATUSES = ["nuevo", "en_conversacion", "seguimiento", "venta", "perdido", "inactivo"] as const;
export type OpportunityStatus = (typeof VALID_STATUSES)[number];

export function normalizeStatus(value?: string | null): OpportunityStatus | null {
  if (!value) return null;
  return (VALID_STATUSES as readonly string[]).includes(value) ? (value as OpportunityStatus) : null;
}
