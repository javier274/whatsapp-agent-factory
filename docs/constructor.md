# Constructor — pasos 0–10 (alto nivel)

Manual operativo para montar un agente WhatsApp por cliente sin mezclar tenants.

## 0 — Claves y acceso
Validar Supabase, OpenRouter, YCloud, Vercel (ver `docs/keys-checklist.md`).
Sin 1–4 → se puede entrevistar; no se enciende.

## 1 — Entrevista profunda
Capas 0–6 (identidad, ideal, oferta, persuasion, operacion, historias).
No inventar precios ni promesas. Semaforo Rojo/Ambar/Verde/Oro.

## 2 — Alta `clients`
Crear fila con nombre, timezone, humano de handoff, `ycloud_phone_number_id` unico.

## 3 — `agent_settings`
System prompt + restrictions + tono + modelo OpenRouter + umbral handoff EUR.
Versionar; solo una version `active`.

## 4 — `offer_items`
Packs con price_min/max, includes/excludes, CTA. Sin precios claros → solo calificar + humano.

## 5 — `persuasion_items`
Objeciones, beneficios, pruebas, rescate, cierre. Versionar; marcar `active`.

## 5b — Cable YCloud ↔ `client_id`
Confirmar que el phone number id del numero WA del cliente apunta a esa fila.
**Prueba anti-mezcla** (paso critico): dos clients; mensaje al numero A no debe usar oferta/persuasion de B.

## 6 — Checklist de prueba interna
A) Webhook 200 + fila inbound en `messages`
B) Respuesta outbound con `persuasion_item_ids`
C) Solo datos del `client_id` correcto
D) Handoff / restricciones respetadas
Si falla A o C → no encender.

## 7 — Encendido controlado
Allowlist / horario / volumen bajo. Monitorizar errores YCloud y OpenRouter.

## 8 — Revision 48–72h
Leer conversaciones reales; ajustar persuasion/offer; no tocar el otro tenant.

## 9 — Follow-ups y rescate
Reglas de `lead_state` (followups_sent, next_followup_at). Rescate solo con consentimiento (capa 5).

## 10 — Operacion continua
Versionar prompts/items; nunca pegar secretos en el repo; aislar siempre por `client_id`.
