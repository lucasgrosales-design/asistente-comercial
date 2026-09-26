import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const DEMO_SESSION_COOKIE = "asistente_demo_session";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const pathname = request.nextUrl.pathname;
  const publicPath = pathname === "/login" || pathname.startsWith("/api/health") || pathname.startsWith("/api/webhooks") || pathname.startsWith("/api/demo/login") || pathname.startsWith("/_next") || pathname.includes(".");
  const demoSession = request.cookies.get(DEMO_SESSION_COOKIE)?.value === "1";

  if (demoSession) {
    if (pathname === "/login") return NextResponse.redirect(new URL("/", request.url));
    return response;
  }

  if (!SUPABASE_URL || !SUPABASE_KEY) return NextResponse.json({ error: "supabase_env_not_configured" }, { status: 503 });
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll() { return request.cookies.getAll(); },
      setAll(cookiesToSet) { cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options)); },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user && !publicPath) return NextResponse.redirect(new URL("/login", request.url));
  if (user && pathname === "/login") return NextResponse.redirect(new URL("/", request.url));
  return response;
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
