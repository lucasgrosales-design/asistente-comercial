import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://grjboblvtmsvynubexwv.supabase.co";

const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  "sb_publishable_xjjsvNCb9etBFSa0JsntQg_A12Yddcl";

export async function GET() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return NextResponse.json({ status: "degraded", app: "ok", database: "not_configured" }, { status: 503 });
  }
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
    const { error } = await supabase.auth.getSession();
    if (error && !/session/i.test(error.message)) {
      return NextResponse.json({ status: "degraded", app: "ok", database: "error" }, { status: 503 });
    }
    return NextResponse.json({ status: "ok", app: "ok", database: "configured" });
  } catch {
    return NextResponse.json({ status: "degraded", app: "ok", database: "error" }, { status: 503 });
  }
}
