import { getSupabaseServer } from "./supabase-server";

export async function resolveCompanyId(value?: string | null) {
  const explicit = value?.trim();
  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase.rpc("get_current_company_id");
  if (error || !data) return null;
  if (explicit && data !== explicit) return null;
  return data;
}

export const VALID_STATUSES = ["nuevo", "en_conversacion", "seguimiento", "venta", "perdido", "inactivo"] as const;
export type OpportunityStatus = (typeof VALID_STATUSES)[number];

export function normalizeStatus(value?: string | null): OpportunityStatus | null {
  if (!value) return null;
  return (VALID_STATUSES as readonly string[]).includes(value) ? (value as OpportunityStatus) : null;
}
