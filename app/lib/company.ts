import { getSupabaseServer } from "./supabase-server";

export async function resolveCompanyId(value?: string | null) {
  const explicit = value?.trim();
  const supabase = await getSupabaseServer();

  if (explicit) {
    const { data } = await supabase.from("companies").select("id").eq("id", explicit).maybeSingle();
    return data?.id || null;
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const byId = await supabase.from("users").select("company_id").eq("id", user.id).maybeSingle();
    if (byId.data?.company_id) return byId.data.company_id;

    if (user.email) {
      const byEmail = await supabase.from("users").select("company_id").eq("email", user.email).maybeSingle();
      if (byEmail.data?.company_id) return byEmail.data.company_id;
    }

    // MVP single-company fallback: allows an authenticated test user to enter
    // the existing workspace even if its public.users profile was not created.
    const { data: companies } = await supabase.from("companies").select("id").limit(2);
    if (companies?.length === 1) return companies[0].id;
  } catch {
    return null;
  }

  return null;
}

export const VALID_STATUSES = ["nuevo", "en_conversacion", "seguimiento", "venta", "perdido", "inactivo"] as const;
export type OpportunityStatus = (typeof VALID_STATUSES)[number];

export function normalizeStatus(value?: string | null): OpportunityStatus | null {
  if (!value) return null;
  return (VALID_STATUSES as readonly string[]).includes(value) ? (value as OpportunityStatus) : null;
}
