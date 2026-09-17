# IA MVP

La IA tiene tres responsabilidades:

1. Extraer información comercial relevante de una interacción.
2. Generar/actualizar un resumen corto y factual.
3. Sugerir el próximo paso y fecha cuando exista suficiente contexto.

Debe evitar inventar datos. Si un dato no está en la conversación, debe quedar como desconocido.

## Salida esperada
```json
{
  "contact": {"name": "", "phone": ""},
  "need": "",
  "product": "",
  "intent": "unknown",
  "summary": "",
  "next_action": "",
  "next_action_at": null
}
```
