import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { verifyDemoCookieValue } from "./app/lib/demo-session";

const DEMO_SESSION_COOKIE = "asistente_demo_session";

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY;
  return { url, key };
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const pathname = request.nextUrl.pathname;
  const publicPath =
    pathname === "/login" ||
    pathname.startsWith("/api/health") ||
    pathname.startsWith("/api/webhooks") ||
    pathname.startsWith("/api/demo/login") ||
    pathname.startsWith("/api/demo/reset") ||
    pathname.startsWith("/_next");

  const demoCookie = request.cookies.get(DEMO_SESSION_COOKIE)?.value;
  const demoSession = await verifyDemoCookieValue(demoCookie);

  if (demoSession) {
    if (pathname === "/login") return NextResponse.redirect(new URL("/", request.url));
    return response;
  }

  if (demoCookie) response.cookies.delete(DEMO_SESSION_COOKIE);

  if (publicPath) return response;

  const { url: supabaseUrl, key: supabaseKey } = getSupabaseConfig();
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error:"supabase_env_not_configured" }, { status:503 });
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() { return request.cookies.getAll(); },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data:{ user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", request.url));
  return response;
}

export const config = { matcher:["/((?!_next/static|_next/image|favicon.ico).*)"] };
