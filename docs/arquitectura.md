# Arquitectura

## Componentes
- Frontend: Next.js/React, responsive y mobile-first.
- Backend/datos: Supabase/Postgres.
- IA: OpenAI para extracción, resumen y sugerencia de próximo paso.
- Integraciones: n8n.
- Hosting: Vercel.

## Principio
n8n no es el núcleo del producto. Se usa en los bordes para recibir/enviar eventos desde WhatsApp, formularios, email u otros canales.

## Flujo base
Canal -> n8n -> API/app -> IA -> base de datos -> aplicación.
