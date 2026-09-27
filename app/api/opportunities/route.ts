import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "../../lib/supabase-server";
import { resolveCompanyId } from "../../lib/company";
import { getDemoState, isDemoSession, isDemoUser, saveDemoState } from "../../lib/demo";
import { opportunityInputSchema, requestTooLarge } from "../../lib/validation";
import type { Opportunity } from "../../lib/types";

export async function GET() {
  try {
    const db = await getSupabaseServer();
    const { data:{ user } } = await db.auth.getUser();
    if (await isDemoSession()) return NextResponse.json({data:(await getDemoState()).opportunities,demo:true});
    if (!user) return NextResponse.json({error:"unauthorized"},{status:401});
    if (isDemoUser(user.email)) return NextResponse.json({data:(await getDemoState()).opportunities,demo:true});
    const companyId=await resolveCompanyId();
    if(!companyId)return NextResponse.json({error:"company_not_configured"},{status:400});
    const {data,error}=await db.from("opportunities").select("*,contacts(name,phone,email),users(name)").eq("company_id",companyId).order("updated_at",{ascending:false});
    if(error)return NextResponse.json({error:error.message},{status:500});
    return NextResponse.json({data});
  } catch (error) {
    console.error("opportunities GET failed", error);
    return NextResponse.json({error:"server_configuration_error"},{status:500});
  }
}

export async function POST(req:NextRequest){
  if (requestTooLarge(req)) return NextResponse.json({error:"request_too_large"},{status:413});
  const parsed=opportunityInputSchema.safeParse(await req.json().catch(()=>null));
  if(!parsed.success)return NextResponse.json({error:"invalid_input",details:parsed.error.flatten()},{status:400});
  const body=parsed.data;
  try {
    const db=await getSupabaseServer();
    const {data:{user}}=await db.auth.getUser();
    if(await isDemoSession() || isDemoUser(user?.email)){
      const state=await getDemoState(); const id=`demo-new-${Date.now()}`;
      const opportunity:Opportunity={id,contact_name:body.name,phone:body.phone||null,need:body.need||null,product:null,intent:"Consulta inicial",status:"nuevo",current_summary:"Nueva oportunidad creada durante la sesión demo.",next_action:"Contactar",next_action_at:null,assigned_user_name:"Lucas",updated_at:new Date().toISOString()};
      state.opportunities=[opportunity,...state.opportunities].slice(0,12);state.interactions[id]=[];
      await saveDemoState(state);
      return NextResponse.json({opportunity,demo:true},{status:201});
    }
    if(!user)return NextResponse.json({error:"unauthorized"},{status:401});
    const {data:opportunityId,error}=await db.rpc("create_opportunity",{p_name:body.name,p_phone:body.phone||null,p_need:body.need||null,p_email:body.email||null});
    if(error)return NextResponse.json({error:error.message},{status:500});
    const result=await db.from("opportunities").select("*,contacts(name,phone,email),users(name)").eq("id",opportunityId).maybeSingle();
    if(result.error)return NextResponse.json({error:result.error.message},{status:500});
    if(!result.data)return NextResponse.json({error:"opportunity_not_found"},{status:404});
    return NextResponse.json({opportunity:result.data},{status:201});
  } catch (error) {
    console.error("opportunities POST failed", error);
    return NextResponse.json({error:"server_configuration_error"},{status:500});
  }
}
