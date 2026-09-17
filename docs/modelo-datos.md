# Modelo de datos MVP

## companies
id, name, created_at

## users
id, company_id, name, role

## contacts
id, company_id, name, phone, email, metadata, created_at, updated_at

## opportunities
id, company_id, contact_id, assigned_user_id, need, product, intent, status, current_summary, next_action, next_action_at, created_at, updated_at

## interactions
id, opportunity_id, user_id, channel, occurred_at, source_text, summary, outcome, created_at

## conversations
id, opportunity_id, channel, external_id, started_at, updated_at

La conversación completa puede conservarse cuando sea necesario para trazabilidad, pero la interfaz trabaja principalmente con el resumen comercial.
