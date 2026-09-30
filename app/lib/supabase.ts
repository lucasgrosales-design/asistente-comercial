import { createClient } from "@supabase/supabase-js";
import { PUBLIC_SUPABASE_URL } from "./supabase-config";

export function getSupabaseAdmin() {
  // La URL es pública: si no está cargada se usa la del proyecto. Solo la clave secreta es imprescindible.
  const url = process.env.SUPABASE_URL || PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession:false, autoRefreshToken:false, detectSessionInUrl:false } });
}
