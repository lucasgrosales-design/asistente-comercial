import { createBrowserClient } from "@supabase/ssr";

const SUPABASE_URL = "https://grjboblvtmsvynubexwv.supabase.co";
const SUPABASE_KEY = "sb_publishable_xjjsvNCb9etBFSa0JsntQg_A12Yddcl";

export function getSupabaseBrowser() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_KEY);
}
