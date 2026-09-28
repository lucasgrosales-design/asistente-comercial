import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    {
      node_env: process.env.NODE_ENV || null,
      env_presence: {
        SUPABASE_URL: Boolean(process.env.SUPABASE_URL),
        SUPABASE_SERVICE_ROLE_KEY: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
        SUPABASE_SECRET_KEY: Boolean(process.env.SUPABASE_SECRET_KEY),
        DEMO_SESSION_SECRET: Boolean(process.env.DEMO_SESSION_SECRET),
      },
    },
    { headers: { "cache-control": "no-store" } }
  );
}
