import { getSupabaseServer } from "./supabase-server";

export async function resolveCompanyId(value?: string | null) {
  const explicit = value?.trim();
  const supabase = await getSupabaseServer();

  if (explicit) {
    const { data } = await supabase.from("companies").select("id").eq("id", explicit).maybeSingle();
    return data?.id || explicit;
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data } = await supabase.from("users").select("company_id").eq("id", user.id).maybeSingle();
    return data?.company_id || null;
  } catch {
    return null;
  }
}

export const VALID_STATUSES = ["nuevo", "en_conversacion", "seguimiento", "venta", "perdido", "inactivo"] as const;
export type OpportunityStatus = (typeof VALID_STATUSES)[number];

export function normalizeStatus(value?: string | null): OpportunityStatus | null {
  if (!value) return null;
  return (VALID_STATUSES as readonly string[]).includes(value) ? (value as OpportunityStatus) : null;
}
