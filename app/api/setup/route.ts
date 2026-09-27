import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "../../lib/supabase-server";
import { getSupabaseAdmin } from "../../lib/supabase";
import { z } from "zod";
import { requestTooLarge } from "../../lib/validation";

const setupSchema=z.object({
  company_name:z.string().trim().min(2).max(160),
  user_name:z.string().trim().min(2).max(120)
}).strict();

export async function POST(req:NextRequest) {
  if(requestTooLarge(req))return NextResponse.json({error:"request_too_large"},{status:413});
  const parsed=setupSchema.safeParse(await req.json().catch(()=>null));
  if(!parsed.success)return NextResponse.json({error:"invalid_input",details:parsed.error.flatten()},{status:400});

  try {
    const db=await getSupabaseServer();
    const {data:{user}}=await db.auth.getUser();
    if(!user)return NextResponse.json({error:"unauthorized"},{status:401});

    const existing=await db.from("users").select("company_id").eq("id",user.id).maybeSingle();
    if(existing.error)return NextResponse.json({error:existing.error.message},{status:500});
    if(existing.data?.company_id)return NextResponse.json({company_id:existing.data.company_id,created:false});

    const admin=getSupabaseAdmin();
    if(!admin)return NextResponse.json({error:"server_configuration_error"},{status:503});
    const company=await admin.from("companies").insert({name:parsed.data.company_name}).select("id").single();
    if(company.error)return NextResponse.json({error:"company_create_failed"},{status:500});

    const profile=await admin.from("users").insert({id:user.id,company_id:company.data.id,name:parsed.data.user_name,email:user.email||null}).select("company_id").single();
    if(profile.error){
      await admin.from("companies").delete().eq("id",company.data.id);
      return NextResponse.json({error:"user_profile_create_failed"},{status:500});
    }
    return NextResponse.json({company_id:profile.data.company_id,created:true});
  } catch(error) {
    console.error("setup failed",error);
    return NextResponse.json({error:"server_configuration_error"},{status:500});
  }
}
