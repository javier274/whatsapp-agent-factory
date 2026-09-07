# Checklist de claves (Fase A del Constructor)

Marca cuando exista. **No pegues valores en chats públicos ni en el repo.**

## Obligatorias para go-live
- [ ] `SUPABASE_URL`
- [ ] `SUPABASE_SERVICE_ROLE_KEY` (solo servidor)
- [ ] `OPENROUTER_API_KEY`
- [ ] `OPENROUTER_MODEL` (ej. openai/gpt-4.1-mini)
- [ ] `YCLOUD_API_KEY`
- [ ] `YCLOUD_WEBHOOK_SECRET` (si YCloud lo expone)
- [ ] Phone Number ID de WhatsApp del cliente → columna `clients.ycloud_phone_number_id`
- [ ] Proyecto Vercel con esas env vars

## Recomendadas
- [ ] `APP_URL` (URL pública del deploy, para webhooks)
- [ ] Repo GitHub/Origin conectado al deploy
- [ ] Acceso admin Supabase (para correr migración SQL)

## Cómo entregarlas a IA / al equipo
- Preferible: variables en Vercel + Supabase, o secretos del entorno.
- En este chat de Grok Bot: usar el flujo seguro de secretos cuando se pida, **no pegar la clave en texto**.

## Orden de validación
1. Supabase: migración aplicada + `select` de prueba
2. OpenRouter: un completion de prueba
3. YCloud: envío de prueba a número allowlisted
4. Webhook: mensaje real → 200 + fila en `messages`
5. Anti-mezcla: 2 clients, mensaje al número A no usa datos de B
