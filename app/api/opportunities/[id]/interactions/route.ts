import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "../../../../lib/supabase-server";
import { resolveCompanyId, normalizeStatus } from "../../../../lib/company";
import { extractCommercialContext, type CommercialExtraction } from "../../../../lib/ai";
import { getDemoState, isDemoSession, isDemoUser, saveDemoState } from "../../../../lib/demo";

export async function POST(req:NextRequest,{params}:{params:Promise<{id:string}>}){
  const {id}=await params; const body=await req.json().catch(()=>null);
  if(!body?.text?.trim())return NextResponse.json({error:"text is required"},{status:400});
  const db=await getSupabaseServer(); const {data:{user}}=await db.auth.getUser();

  if(await isDemoSession() || isDemoUser(user?.email)){
    const state=await getDemoState(); const opp=state.opportunities.find(o=>o.id===id);
    if(!opp)return NextResponse.json({error:"opportunity_not_found"},{status:404});
    let extracted:CommercialExtraction={summary:body.text.trim().slice(0,220),next_action:body.next_action||"Definir próximo contacto",next_action_at:body.next_action_at||null};
    try{extracted=await extractCommercialContext(body.text.trim(),opp.current_summary||"");}catch{}
    const status=normalizeStatus(body.outcome||extracted.status);
    opp.current_summary=extracted.summary||body.text.trim().slice(0,220);opp.next_action=body.next_action||extracted.next_action||"Definir próximo contacto";opp.next_action_at=body.next_action_at||extracted.next_action_at||null;opp.updated_at=new Date().toISOString();
    if(extracted.need)opp.need=extracted.need;if(extracted.product)opp.product=extracted.product;if(extracted.intent)opp.intent=extracted.intent;if(status)opp.status=status;
    const item={id:`demo-i-${Date.now()}`,occurred_at:body.occurred_at||new Date().toISOString(),channel:body.channel||"manual",summary:body.text.trim().slice(0,220),outcome:body.outcome||"Contacto registrado",user_name:"Lucas"};
    state.interactions[id]=[item,...(state.interactions[id]||[])].slice(0,5);await saveDemoState(state);return NextResponse.json({interaction:item,extracted,demo:true});
  }
  if(!user)return NextResponse.json({error:"unauthorized"},{status:401});
  const companyId=await resolveCompanyId();if(!companyId)return NextResponse.json({error:"company_not_configured"},{status:400});
  const {data:opp,error:oppError}=await db.from("opportunities").select("id,current_summary").eq("id",id).eq("company_id",companyId).maybeSingle();
  if(oppError)return NextResponse.json({error:oppError.message},{status:500});if(!opp)return NextResponse.json({error:"opportunity_not_found"},{status:404});
  let extracted:CommercialExtraction={summary:body.text.trim().slice(0,500),next_action:body.next_action||"Definir próximo contacto",next_action_at:body.next_action_at||null,need:undefined,product:undefined,intent:undefined,status:undefined};
  try{extracted=await extractCommercialContext(body.text.trim(),opp.current_summary||"");}catch(error){console.warn("AI extraction unavailable; saving manual interaction",error);}
  const interaction=await db.from("interactions").insert({opportunity_id:id,user_id:user.id,channel:body.channel||"manual",occurred_at:body.occurred_at||new Date().toISOString(),source_text:body.text.trim(),summary:extracted.summary||body.text.trim(),outcome:body.outcome||"Contacto registrado"}).select().single();
  if(interaction.error)return NextResponse.json({error:interaction.error.message},{status:500});
  const patch:Record<string,unknown>={current_summary:extracted.summary||body.text.trim(),next_action:body.next_action||extracted.next_action||"Definir próximo contacto",next_action_at:body.next_action_at||extracted.next_action_at||null,updated_at:new Date().toISOString()};
  if(extracted.need)patch.need=extracted.need;if(extracted.product)patch.product=extracted.product;if(extracted.intent)patch.intent=extracted.intent;const status=normalizeStatus(body.outcome||extracted.status);if(status)patch.status=status;
  const {error:updateError}=await db.from("opportunities").update(patch).eq("id",id).eq("company_id",companyId);if(updateError)return NextResponse.json({error:updateError.message},{status:500});
  return NextResponse.json({interaction:interaction.data,extracted});
}
