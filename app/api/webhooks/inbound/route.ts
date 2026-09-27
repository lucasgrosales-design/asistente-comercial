import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../lib/supabase";
import { extractCommercialContext } from "../../../lib/ai";
import { resolveCompanyId, normalizeStatus } from "../../../lib/company";
import { inboundEventSchema, requestTooLarge } from "../../../lib/validation";

export async function POST(req: NextRequest) {
  const secret = process.env.N8N_SHARED_SECRET;
  if (!secret) return NextResponse.json({ok:false,error:"webhook_not_configured"},{status:503});
  if (req.headers.get("x-n8n-secret") !== secret) return NextResponse.json({ok:false,error:"unauthorized"},{status:401});
  if (requestTooLarge(req, 32768)) return NextResponse.json({ok:false,error:"request_too_large"},{status:413});

  const parsed = inboundEventSchema.safeParse(await req.json().catch(()=>null));
  if (!parsed.success) return NextResponse.json({ok:false,error:"invalid_event",details:parsed.error.flatten()},{status:400});
  const event = parsed.data;

  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ok:false,error:"supabase_not_configured"},{status:503});

  const configuredCompany = process.env.DEFAULT_COMPANY_ID;
  if (event.company_id && configuredCompany && event.company_id !== configuredCompany) return NextResponse.json({ok:false,error:"company_not_allowed"},{status:403});
  const companyId = await resolveCompanyId(event.company_id || configuredCompany, {allowUnauthenticated:true});
  if (!companyId) return NextResponse.json({ok:false,error:"company_not_configured"},{status:400});

  let inboundEventId: string;
  const eventInsert = await db.from("inbound_events").insert({company_id:companyId,channel:event.channel,external_message_id:event.external_message_id,sender_id:event.sender_id,received_at:event.received_at||new Date().toISOString()}).select("id").single();
  if (eventInsert.error) {
    if (eventInsert.error.code !== "23505") return NextResponse.json({ok:false,error:eventInsert.error.message},{status:500});
    const existing = await db.from("inbound_events").select("id,opportunity_id,processed_at").eq("company_id",companyId).eq("channel",event.channel).eq("external_message_id",event.external_message_id).single();
    if(existing.error||!existing.data)return NextResponse.json({ok:false,error:existing.error?.message||"duplicate_event_lookup_failed"},{status:500});
    if(existing.data.processed_at)return NextResponse.json({ok:true,duplicate:true,opportunity_id:existing.data.opportunity_id});
    inboundEventId=existing.data.id;
  } else inboundEventId=eventInsert.data.id;

  const channelIdentity=await db.from("contact_channels").select("contact_id").eq("company_id",companyId).eq("channel",event.channel).eq("external_sender_id",event.sender_id).maybeSingle();
  if(channelIdentity.error)return NextResponse.json({ok:false,error:channelIdentity.error.message},{status:500});
  let contactId:string|null=channelIdentity.data?.contact_id||null;
  if(!contactId){
    const contact=await db.from("contacts").insert({company_id:companyId,name:event.sender_name?.trim()||event.name?.trim()||event.sender_id,phone:event.phone?.trim()||(event.channel==="whatsapp"?event.sender_id:null),email:event.email?.trim()||null}).select("id").single();
    if(contact.error)return NextResponse.json({ok:false,error:contact.error.message},{status:500});
    contactId=contact.data.id;
    const identity=await db.from("contact_channels").insert({company_id:companyId,contact_id:contactId,channel:event.channel,external_sender_id:event.sender_id});
    if(identity.error&&identity.error.code!=="23505")return NextResponse.json({ok:false,error:identity.error.message},{status:500});
  }

  const openOpp=await db.from("opportunities").select("id,current_summary,status").eq("company_id",companyId).eq("contact_id",contactId).not("status","in","(venta,perdido,inactivo)").order("updated_at",{ascending:false}).limit(1).maybeSingle();
  let opportunityId=openOpp.data?.id||null;
  const existingSummary=openOpp.data?.current_summary||"";
  if(!opportunityId){
    const created=await db.from("opportunities").insert({company_id:companyId,contact_id:contactId,assigned_user_id:event.user_id||null,status:"nuevo",need:event.need?.trim()||null,product:event.product?.trim()||null}).select("id").single();
    if(created.error)return NextResponse.json({ok:false,error:created.error.message},{status:500});
    opportunityId=created.data.id;
  }

  const extracted=await extractCommercialContext(event.text,existingSummary);
  const patch:Record<string,unknown>={current_summary:extracted.summary,updated_at:new Date().toISOString()};
  if(extracted.need)patch.need=extracted.need;if(extracted.product)patch.product=extracted.product;if(extracted.intent)patch.intent=extracted.intent;if(extracted.next_action)patch.next_action=extracted.next_action;if(extracted.next_action_at)patch.next_action_at=extracted.next_action_at;
  const normalizedStatus=normalizeStatus(extracted.status);
  if(normalizedStatus)patch.status=normalizedStatus;else if(!openOpp.data?.status||openOpp.data.status==="nuevo")patch.status="en_conversacion";

  const interaction=await db.from("interactions").insert({opportunity_id:opportunityId,user_id:event.user_id||null,channel:event.channel,occurred_at:event.occurred_at||event.received_at||new Date().toISOString(),source_text:event.text,summary:extracted.summary,outcome:event.outcome||null}).select("id").single();
  if(interaction.error)return NextResponse.json({ok:false,error:interaction.error.message},{status:500});
  const updated=await db.from("opportunities").update(patch).eq("id",opportunityId).eq("company_id",companyId);
  if(updated.error)return NextResponse.json({ok:false,error:updated.error.message},{status:500});
  const marked=await db.from("inbound_events").update({processed_at:new Date().toISOString(),opportunity_id:opportunityId}).eq("id",inboundEventId).eq("company_id",companyId);
  if(marked.error)return NextResponse.json({ok:false,error:marked.error.message},{status:500});
  return NextResponse.json({ok:true,processed:true,opportunity_id:opportunityId,interaction_id:interaction.data.id,extracted});
}
