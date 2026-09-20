import { getSupabaseServer } from "./supabase-server";
import { getSupabaseAdmin } from "./supabase";

export async function resolveCompanyId(value?: string | null, options?: { allowUnauthenticated?: boolean }) {
  const explicit = value?.trim();
  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const { data, error } = await supabase.from("users").select("company_id").eq("id", user.id).maybeSingle();
    if (error || !data?.company_id) return null;
    if (explicit && data.company_id !== explicit) return null;
    return data.company_id;
  }

  if (explicit && options?.allowUnauthenticated) {
    const admin = getSupabaseAdmin();
    if (!admin) return null;
    const { data } = await admin.from("companies").select("id").eq("id", explicit).maybeSingle();
    return data?.id || null;
  }

  return null;
}

export const VALID_STATUSES = ["nuevo", "en_conversacion", "seguimiento", "venta", "perdido", "inactivo"] as const;
export type OpportunityStatus = (typeof VALID_STATUSES)[number];

export function normalizeStatus(value?: string | null): OpportunityStatus | null {
  if (!value) return null;
  return (VALID_STATUSES as readonly string[]).includes(value) ? (value as OpportunityStatus) : null;
}
