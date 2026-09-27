import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return NextResponse.json({ status:"degraded", app:"ok", database:"not_configured" }, { status:503 });
  try {
    const supabase = createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
    const { error } = await supabase.auth.getSession();
    if (error && !/session/i.test(error.message)) return NextResponse.json({ status:"degraded", app:"ok", database:"error" }, { status:503 });
    return NextResponse.json({ status:"ok", app:"ok", database:"configured" });
  } catch {
    return NextResponse.json({ status:"degraded", app:"ok", database:"error" }, { status:503 });
  }
}
