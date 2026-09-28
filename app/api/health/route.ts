import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "../../lib/supabase";

function getPublicConfig() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
    key:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.SUPABASE_PUBLISHABLE_KEY ||
      process.env.SUPABASE_ANON_KEY,
  };
}

export async function GET() {
  const { url, key } = getPublicConfig();
  const missingPublic: string[] = [];
  if (!url) missingPublic.push("SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL");
  if (!key) missingPublic.push("SUPABASE_PUBLISHABLE_KEY/NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  if (missingPublic.length) {
    return NextResponse.json(
      { status:"degraded", app:"ok", database:"not_configured", missing:missingPublic },
      { status:503, headers:{"cache-control":"no-store"} }
    );
  }

  try {
    const publicClient = createClient(url, key, {
      auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}
    });
    const { error: authError } = await publicClient.auth.getSession();
    if (authError && !/session/i.test(authError.message)) {
      return NextResponse.json(
        {status:"degraded",app:"ok",database:"error"},
        {status:503,headers:{"cache-control":"no-store"}}
      );
    }

    const admin = getSupabaseAdmin();
    if (!admin) {
      return NextResponse.json(
        {status:"degraded",app:"ok",database:"public_configured",server:"not_configured",missing:["SUPABASE_SECRET_KEY/SUPABASE_SERVICE_ROLE_KEY","DEMO_SESSION_SECRET"]},
        {status:503,headers:{"cache-control":"no-store"}}
      );
    }

    const {error: dbError}=await admin.from("demo_sessions").select("id").limit(1);
    if(dbError) {
      return NextResponse.json(
        {status:"degraded",app:"ok",database:"error"},
        {status:503,headers:{"cache-control":"no-store"}}
      );
    }

    return NextResponse.json(
      {status:"ok",app:"ok",database:"reachable",demo:"configured"},
      {headers:{"cache-control":"no-store"}}
    );
  } catch {
    return NextResponse.json(
      {status:"degraded",app:"ok",database:"error"},
      {status:503,headers:{"cache-control":"no-store"}}
    );
  }
}
