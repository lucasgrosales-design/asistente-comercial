import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "../../../../lib/supabase-server";
import { resolveCompanyId, normalizeStatus } from "../../../../lib/company";
import { extractCommercialContext, type CommercialExtraction } from "../../../../lib/ai";
import { getDemoState, isDemoSession, saveDemoState } from "../../../../lib/demo";
import { interactionInputSchema, requestTooLarge } from "../../../../lib/validation";

export async function POST(req:NextRequest,{params}:{params:Promise<{id:string}>}){
  if (requestTooLarge(req)) return NextResponse.json({error:"request_too_large"},{status:413});
  const {id}=await params;
  if(!/^[A-Za-z0-9_-]{1,100}$/.test(id))return NextResponse.json({error:"invalid_opportunity_id"},{status:400});
  const parsed=interactionInputSchema.safeParse(await req.json().catch(()=>null));
  if(!parsed.success)return NextResponse.json({error:"invalid_input",details:parsed.error.flatten()},{status:400});
  const body=parsed.data;
  try {
    if(await isDemoSession()){
      const state=await getDemoState(); const opp=state.opportunities.find(o=>o.id===id);
      if(!opp)return NextResponse.json({error:"opportunity_not_found"},{status:404});
      let extracted:CommercialExtraction={summary:body.text.slice(0,220),next_action:body.next_action||"Definir próximo contacto",next_action_at:body.next_action_at||null};
      try{extracted=await extractCommercialContext(body.text,opp.current_summary||"");}catch{}
      const status=body.outcome === "sin_cambios" ? null : normalizeStatus(body.outcome||extracted.status);
      opp.current_summary=extracted.summary||body.text.slice(0,220);opp.next_action=body.next_action||extracted.next_action||"Definir próximo contacto";opp.next_action_at=body.next_action_at||extracted.next_action_at||null;opp.updated_at=new Date().toISOString();
      if(extracted.need)opp.need=extracted.need;if(extracted.product)opp.product=extracted.product;if(extracted.intent)opp.intent=extracted.intent;if(status)opp.status=status;if(status && ["venta","perdido","inactivo"].includes(status)){opp.next_action=null;opp.next_action_at=null;}
      const item={id:`demo-i-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,occurred_at:body.occurred_at||new Date().toISOString(),channel:body.channel||"manual",summary:body.text.slice(0,220),outcome:body.outcome||"Contacto registrado",user_name:"Lucas"};
      state.interactions[id]=[item,...(state.interactions[id]||[])].slice(0,5);await saveDemoState(state);
      return NextResponse.json({interaction:item,extracted,demo:true});
    }
    const db=await getSupabaseServer(); const {data:{user}}=await db.auth.getUser();
    if(!user)return NextResponse.json({error:"unauthorized"},{status:401});
    const companyId=await resolveCompanyId();if(!companyId)return NextResponse.json({error:"company_not_configured"},{status:400});
    const {data:opp,error:oppError}=await db.from("opportunities").select("id,current_summary").eq("id",id).eq("company_id",companyId).maybeSingle();
    if(oppError)return NextResponse.json({error:oppError.message},{status:500});if(!opp)return NextResponse.json({error:"opportunity_not_found"},{status:404});
    let extracted:CommercialExtraction={summary:body.text.slice(0,500),next_action:body.next_action||"Definir próximo contacto",next_action_at:body.next_action_at||null,need:undefined,product:undefined,intent:undefined,status:undefined};
    try{extracted=await extractCommercialContext(body.text,opp.current_summary||"");}catch(error){console.warn("AI extraction unavailable; saving manual interaction",error);}
    const interaction=await db.from("interactions").insert({opportunity_id:id,user_id:user.id,channel:body.channel||"manual",occurred_at:body.occurred_at||new Date().toISOString(),source_text:body.text,summary:extracted.summary||body.text,outcome:body.outcome||"Contacto registrado"}).select().single();
    if(interaction.error)return NextResponse.json({error:interaction.error.message},{status:500});
    const patch:Record<string,unknown>={current_summary:extracted.summary||body.text,next_action:body.next_action||extracted.next_action||"Definir próximo contacto",next_action_at:body.next_action_at||extracted.next_action_at||null,updated_at:new Date().toISOString()};
    if(extracted.need)patch.need=extracted.need;if(extracted.product)patch.product=extracted.product;if(extracted.intent)patch.intent=extracted.intent;const status=body.outcome === "sin_cambios" ? null : normalizeStatus(body.outcome||extracted.status);if(status)patch.status=status;if(status && ["venta","perdido","inactivo"].includes(status)){patch.next_action=null;patch.next_action_at=null;}
    const {error:updateError}=await db.from("opportunities").update(patch).eq("id",id).eq("company_id",companyId);if(updateError)return NextResponse.json({error:updateError.message},{status:500});
    return NextResponse.json({interaction:interaction.data,extracted});
  } catch (error) {
    console.error("interaction POST failed", error);
    return NextResponse.json({error:"server_configuration_error"},{status:500});
  }
}
