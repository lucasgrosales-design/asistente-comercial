# Asistente Comercial

Asistente de memoria comercial para equipos que venden. No es un CRM.

## Qué hace
- recibe un contacto;
- obtiene información comercial básica;
- registra interacciones sin obligar al vendedor a completar formularios extensos;
- genera/actualiza un resumen comercial corto;
- conserva la próxima acción;
- permite que otro vendedor o el dueño entienda rápidamente qué pasó.

## Arquitectura
Next.js + Supabase/Postgres + OpenAI + n8n + Vercel.

n8n integra canales externos. La lógica de negocio vive en la aplicación.

## Arranque local
1. `cp .env.example .env.local`
2. completar Supabase/OpenAI si se desea persistencia/IA real;
3. `npm install`
4. `npm run dev`

Sin Supabase configurado, la interfaz funciona en modo demo.

## GitHub
Este repositorio contiene el MVP y la documentación de producto, arquitectura, datos, IA y n8n. No colocar secretos en Git.
