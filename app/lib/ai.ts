import OpenAI from "openai";
import { z } from "zod";

export type CommercialExtraction={name?:string;phone?:string;email?:string;need?:string;product?:string;intent?:string;summary:string;next_action?:string;next_action_at?:string|null;status?:string};

const extractionSchema=z.object({
  name:z.string().trim().max(160).optional().nullable(),
  phone:z.string().trim().max(40).optional().nullable(),
  email:z.string().trim().email().max(254).optional().nullable(),
  need:z.string().trim().max(240).optional().nullable(),
  product:z.string().trim().max(160).optional().nullable(),
  intent:z.string().trim().max(160).optional().nullable(),
  summary:z.string().trim().max(500).default("Sin resumen todavía."),
  next_action:z.string().trim().max(240).optional().nullable(),
  next_action_at:z.string().regex(/^\\d{4}-\\d{2}-\\d{2}$/).optional().nullable(),
  status:z.enum(["nuevo","en_conversacion","seguimiento","venta","perdido","inactivo"]).optional().nullable()
}).strict();

const system=`Eres un asistente de memoria comercial. Convierte una conversación comercial en información factual y breve. No inventes datos ni completes campos por intuición. El resumen debe tener máximo 60 palabras e indicar quién es el cliente, qué busca, qué pasó y qué falta. Sugiere próxima acción y fecha solo cuando surjan del contexto. Devuelve únicamente JSON y usa fechas YYYY-MM-DD.`;

export async function extractCommercialContext(text:string, existingSummary=""):Promise<CommercialExtraction>{
  const clean=text.trim().slice(0,12000);
  const key=process.env.OPENAI_API_KEY;
  if(!key) return {summary:existingSummary||"Sin resumen todavía."};
  try{
    const client=new OpenAI({apiKey:key});
    const r=await client.chat.completions.create({
      model:process.env.OPENAI_MODEL||"gpt-5-mini",
      response_format:{type:"json_object"},
      messages:[
        {role:"system",content:system},
        {role:"user",content:JSON.stringify({existing_summary:existingSummary,conversation:clean,fields:{name:"",phone:"",email:"",need:"",product:"",intent:"",summary:"",next_action:"",next_action_at:null,status:""}})}
      ]
    });
    const raw=JSON.parse(r.choices[0]?.message?.content||"{}");
    const parsed=extractionSchema.safeParse(raw);
    if(!parsed.success)return {summary:existingSummary||"No se pudo validar la extracción automática."};
    const value=parsed.data;
    return {
      summary:value.summary||existingSummary||"Sin resumen todavía.",
      name:value.name||undefined,
      phone:value.phone||undefined,
      email:value.email||undefined,
      need:value.need||undefined,
      product:value.product||undefined,
      intent:value.intent||undefined,
      next_action:value.next_action||undefined,
      next_action_at:value.next_action_at||null,
      status:value.status||undefined
    };
  }catch{
    return {summary:existingSummary||"No se pudo generar el resumen automáticamente."};
  }
}
