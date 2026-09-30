# Auditoría técnica — 2026-09-28

## Bloqueo de producción
`supabase_env_not_configured` (middleware.ts) aparece cuando en el build faltan `NEXT_PUBLIC_SUPABASE_URL` o
`NEXT_PUBLIC_SUPABASE_ANON_KEY` (o `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`). Las variables `NEXT_PUBLIC_*` se
incrustan al compilar: después de cargarlas hay que **redeployar sin caché**. `/api/health` ahora informa
qué variables faltan (solo nombres).

## Correcciones aplicadas en el código
- ai.ts: regex de fecha con doble escape → toda extracción con fecha era descartada.
- Ficha: link de WhatsApp roto por regex con doble escape (`/\\D/g`).
- Zona horaria: "hoy" se calculaba en UTC; ahora America/Argentina/Buenos_Aires.
- Una consulta nueva sin fecha no aparecía en "Para atender ahora": ahora aparece ("Consulta nueva").
- Inicio y Seguimiento ordenados por urgencia, con etiqueta del motivo.
- Registrar interacción ya no fuerza el estado "En conversación" por defecto ("Sin cambios").
- Estados cerrados limpian la próxima acción; el resultado se guarda con etiqueta legible.
- Etiquetas coherentes ("Vendido / No vendido", "Seguimiento" en toda la navegación).
- layout: `<html lang="es">` y `<body>` explícitos.
- Login: manejo de errores si falta configuración, mensajes en español, mínimo 8 caracteres.
- middleware: sin bucle /login ↔ / con cookie demo huérfana.
- Webhook: secreto comparado en tiempo constante; no depende de cookies ni de la clave anon.
- Demo: se eliminan sesiones vencidas al iniciar otra.
- Cabeceras de seguridad HTTP en next.config.ts.
- schema.sql: 2 funciones usaban `$` en vez de `$$` (no se podía reproducir la base).

## Base de datos (aplicado en Supabase)
- `users`: un usuario podía cambiar su propio `company_id`/`role` (romper aislamiento). UPDATE limitado a `name`.
- Rol `anon` tenía privilegios completos en tablas de negocio: revocados.
- Ver supabase/migrations/20260928_security_hardening.sql.

## Pendiente (requiere acciones fuera del código)
- Cargar/verificar variables en Vercel Production y redeployar sin caché.
- Supabase Auth: activar "Leaked password protection" (advisor de seguridad).
- Definir política de confirmación de email para altas.
- Tests automatizados (hoy solo typecheck + build en CI) y rate limiting en /api/demo/login y webhooks.

## Mejoras agregadas (2026-09-29)
- Acciones rápidas en la ficha de cada persona: posponer (mañana / 3 días / 1 semana), marcar vendido / no vendido y retomar. Quedan registradas en el historial. Ruta: PATCH /api/opportunities/[id].
- Instalable en el teléfono (manifest + ícono), pensado para vendedores que trabajan desde el celular.
- Pruebas automáticas (vitest, 16 casos) sobre zona horaria, prioridades de seguimiento y acciones rápidas; se ejecutan en CI con `npm test`.
