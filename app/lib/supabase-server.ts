import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

function requiredEnv(...names: string[]) {
  for (const name of names) {
    const value = process.env[name];
    if (value) return value;
  }
  throw new Error(`missing_env:${names.join("/")}`);
}

export async function getSupabaseServer() {
  const cookieStore = await cookies();
  const url = requiredEnv("NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_URL");
  const key = requiredEnv(
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_PUBLISHABLE_KEY",
    "SUPABASE_ANON_KEY"
  );
  return createServerClient(url, key, {
    cookies: {
      getAll() { return cookieStore.getAll(); },
      setAll(cookiesToSet) {
        try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch {}
      },
    },
  });
}
