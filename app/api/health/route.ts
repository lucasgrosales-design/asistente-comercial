import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../lib/supabase";
import { PUBLIC_SUPABASE_KEY, PUBLIC_SUPABASE_URL } from "../../lib/supabase-config";

export const dynamic = "force-dynamic";

// Diagnóstico de configuración. Solo informa NOMBRES y estados (true/false), nunca valores ni claves.
export async function GET() {
  const headers = { "cache-control": "no-store" };
  const present = {
    SUPABASE_SERVICE_ROLE_KEY: Boolean(process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY),
    DEMO_SESSION_SECRET: Boolean(process.env.DEMO_SESSION_SECRET),
    NEXT_PUBLIC_SUPABASE_URL: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
    OPENAI_API_KEY: Boolean(process.env.OPENAI_API_KEY),
    N8N_SHARED_SECRET: Boolean(process.env.N8N_SHARED_SECRET)
  };
  const required = ["SUPABASE_SERVICE_ROLE_KEY", "DEMO_SESSION_SECRET"] as const;
  const missing = required.filter((name) => !present[name]);
  const info = {
    version: (process.env.VERCEL_GIT_COMMIT_SHA || "local").slice(0, 7),
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV || "unknown"
  };
  // No exponer presencia/ausencia de secretos en producción.
  const diagnostics = process.env.VERCEL_ENV === "production" ? undefined : { variables: present, missing };

  const admin = getSupabaseAdmin();
  if (!admin) return NextResponse.json({ status: "degraded", app: "ok", database: "server_not_configured", ...info, ...(diagnostics ? { diagnostics } : {}) }, { status: 503, headers });

  try {
    const { error } = await admin.from("demo_sessions").select("id").limit(1);
    if (error) {
      const hint = /jwt|api key|apikey|invalid/i.test(error.message) ? "invalid_service_key" : "query_failed";
      return NextResponse.json({ status: "degraded", app: "ok", database: "error", database_hint: hint, ...info, ...(diagnostics ? { diagnostics } : {}) }, { status: 503, headers });
    }
    return NextResponse.json(
      { status: missing.length ? "degraded" : "ok", app: "ok", database: "reachable", public_config: { url: PUBLIC_SUPABASE_URL, key_configured: Boolean(PUBLIC_SUPABASE_KEY) }, ...info, ...(diagnostics ? { diagnostics } : {}) },
      { status: missing.length ? 503 : 200, headers }
    );
  } catch {
    return NextResponse.json({ status: "degraded", app: "ok", database: "error", database_hint: "unreachable", ...info, ...(diagnostics ? { diagnostics } : {}) }, { status: 503, headers });
  }
}
