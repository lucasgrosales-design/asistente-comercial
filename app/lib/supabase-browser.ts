import { createBrowserClient } from "@supabase/ssr";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://grjboblvtmsvynubexwv.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzIiwicmVmIjoiZ3JqYm9ibHZ0bXN2eW51YmV4d3YiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTc4OTY0MzYwOCwiZXhwIjoyMTA1MjE5NjA4fQ.prXVRQbOj31btuhKzCgBltKH4n9ffuDXztcYLhRhLJY";

export function getSupabaseBrowser() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
