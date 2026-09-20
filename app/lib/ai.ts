import OpenAI from "openai";

export type CommercialExtraction={name?:string;phone?:string;email?:string;need?:string;product?:string;intent?:string;summary:string;next_action?:string;next_action_at?:string|null;status?:string};

const system=`Eres un asistente de memoria comercial. Convierte una conversación comercial en información factual y breve. No inventes datos ni completes campos por intuición. El resumen debe tener máximo 60 palabras e indicar quién es el cliente, qué busca, qué pasó y qué falta. Sugiere próxima acción y fecha solo cuando surjan del contexto. Devuelve únicamente JSON.`;

export async function extractCommercialContext(text:string, existingSummary=""):Promise<CommercialExtraction>{
  const clean=text.trim().slice(0,12000);
  const key=process.env.OPENAI_API_KEY;
  if(!key) return {summary:existingSummary||"Sin resumen todavía."};
  try {
    const client=new OpenAI({apiKey:key});
    const r=await client.chat.completions.create({model:process.env.OPENAI_MODEL||"gpt-5-mini",response_format:{type:"json_object"},messages:[{role:"system",content:system},{role:"user",content:JSON.stringify({existing_summary:existingSummary,conversation:clean,fields:{name:"",phone:"",email:"",need:"",product:"",intent:"",summary:"",next_action:"",next_action_at:null,status:""}})}]});
    const parsed=JSON.parse(r.choices[0]?.message?.content||"{}");
    return {summary:String(parsed.summary||existingSummary||"Sin resumen todavía.").slice(0,500),name:parsed.name||undefined,phone:parsed.phone||undefined,email:parsed.email||undefined,need:parsed.need||undefined,product:parsed.product||undefined,intent:parsed.intent||undefined,next_action:parsed.next_action||undefined,next_action_at:parsed.next_action_at||null,status:parsed.status||undefined};
  } catch {
    return {summary:existingSummary||"No se pudo generar el resumen automáticamente."};
  }
}
