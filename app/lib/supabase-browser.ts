import { createBrowserClient } from "@supabase/ssr";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

export function getSupabaseBrowser() {
  if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error("supabase_env_not_configured");
  return createBrowserClient(SUPABASE_URL, SUPABASE_KEY);
}
