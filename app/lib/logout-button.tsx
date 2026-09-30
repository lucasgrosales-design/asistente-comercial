"use client";

import { getSupabaseBrowser } from "./supabase-browser";

export default function LogoutButton() {
  async function logout() {
    await fetch("/api/demo/reset", { method: "POST" });
    try { await getSupabaseBrowser().auth.signOut(); } catch {}
    window.location.href = "/login";
  }
  return <button className="button secondary" onClick={logout}>Salir</button>;
}
