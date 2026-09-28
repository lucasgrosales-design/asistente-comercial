import { createBrowserClient } from "@supabase/ssr";
import { PUBLIC_SUPABASE_KEY, PUBLIC_SUPABASE_URL } from "./supabase-config";

export function getSupabaseBrowser() {
  return createBrowserClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_KEY);
}
