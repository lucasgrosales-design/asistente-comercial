import { NextResponse } from "next/server";
import { startDemoSession } from "../../../lib/demo";
import { DEMO_EMAIL, DEMO_PASSWORD } from "../../../lib/demo-config";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (body?.email !== DEMO_EMAIL || body?.password !== DEMO_PASSWORD) {
    return NextResponse.json({ error:"invalid_demo_credentials" }, { status:401 });
  }
  try {
    await startDemoSession();
    return NextResponse.json({ok:true,demo:true});
  } catch (error) {
    console.error("demo login failed", error);
    return NextResponse.json({error:"demo_not_configured"},{status:503});
  }
}
