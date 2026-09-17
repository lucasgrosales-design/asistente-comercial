# n8n — integración en los bordes

n8n no contiene la lógica principal del producto. Su función es recibir eventos de canales externos, normalizarlos y entregarlos a la aplicación.

## Flujo MVP
1. Webhook — entrada de mensaje/contacto.
2. Code — normalizar canal, teléfono, external_id y texto.
3. HTTP Request — POST a `/api/webhooks/inbound` de la aplicación.
4. La aplicación identifica contacto/oportunidad, ejecuta extracción IA y persiste.
5. Opcional: HTTP Request de respuesta al canal (WhatsApp/email).

## Contrato canónico
```json
{
  "channel":"whatsapp",
  "external_message_id":"...",
  "sender_id":"...",
  "phone":"...",
  "name":"...",
  "text":"...",
  "occurred_at":"2026-09-17T12:00:00Z",
  "metadata":{}
}
```

El secreto de integración debe viajar en header `x-n8n-secret`. Nunca colocar claves de Supabase/OpenAI dentro de nodos visibles o mensajes.
