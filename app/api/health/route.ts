import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../lib/supabase";
import { PUBLIC_SUPABASE_KEY, PUBLIC_SUPABASE_URL } from "../../lib/supabase-config";

export async function GET() {
  try {
    const admin = getSupabaseAdmin();
    if (!admin) {
      return NextResponse.json(
        { status: "degraded", app: "ok", database: "server_not_configured", missing: ["SUPABASE_SECRET_KEY/SUPABASE_SERVICE_ROLE_KEY", "DEMO_SESSION_SECRET"] },
        { status: 503, headers: { "cache-control": "no-store" } }
      );
    }

    const { error } = await admin.from("demo_sessions").select("id").limit(1);
    if (error) {
      return NextResponse.json(
        { status: "degraded", app: "ok", database: "error" },
        { status: 503, headers: { "cache-control": "no-store" } }
      );
    }

    return NextResponse.json(
      { status: "ok", app: "ok", database: "reachable", public_config: { url: PUBLIC_SUPABASE_URL, key_configured: Boolean(PUBLIC_SUPABASE_KEY) }, demo: "configured" },
      { headers: { "cache-control": "no-store" } }
    );
  } catch {
    return NextResponse.json(
      { status: "degraded", app: "ok", database: "error" },
      { status: 503, headers: { "cache-control": "no-store" } }
    );
  }
}
