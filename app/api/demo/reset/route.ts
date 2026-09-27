import { NextResponse } from "next/server";
import { clearDemoState } from "../../../lib/demo";

export async function POST() {
  await clearDemoState();
  return NextResponse.json({ok:true});
}
