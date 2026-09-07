# Manual operativo — pasos 0 → 10

Guía completa para montar un agente WhatsApp por cliente **sin mezclar tenants**.  
Companion de alto nivel: `docs/constructor.md`. Persona del Constructor: `docs/SOUL-constructor-hermes.md`.

Idioma de trabajo: español. No inventar precios ni casos. No pegar secretos en el repo.

---

## Mapa rápido

| Paso | Nombre | ¿Bloquea go-live si falla? |
|------|--------|----------------------------|
| 0 | Claves y acceso | Sí (para encender) |
| 1 | Entrevista profunda v2 | Sí (Rojo) |
| 2 | Alta `clients` | Sí |
| 3 | `agent_settings` | Sí |
| 4 | `offer_items` | Sí (sin precios → solo calificar+humano) |
| 5 | `persuasion_items` | Parcial |
| **5b** | Cable YCloud + **anti-mezcla** | **Sí** |
| **6** | Checklist prueba A–D | **Sí si falla A o C** |
| 7 | Encendido controlado | — |
| 8 | Revisión 48–72h | — |
| 9 | Follow-ups y rescate | Según capa 5 |
| 10 | Operación continua | — |

---

## 0 — Claves y acceso

Validar según `docs/keys-checklist.md`:

1. Supabase URL + service role (servidor).
2. OpenRouter API key + modelo por defecto.
3. YCloud API + webhook secret + phone number id del cliente.
4. Proyecto Vercel con env vars + `APP_URL`.
5. (Opcional) repo GitHub.

**Regla:** sin 1–4 se puede **entrevistar**; no se **enciende** ni se promete go-live.  
Claves solo en `.env.local` / Vercel / secretos — **nunca** en git.

---

## 1 — Entrevista profunda v2

### Puntero discovery v2 (leer en este orden)

1. `docs/entrevista-profunda-v2-constructor.md` — capas 0–6 base.
2. `docs/entrevista-profunda-v2-capas-1-y-3.md` — identidad y dinero en profundidad.
3. `docs/entrevista-profunda-v2-profundizacion.md` — capas 2, 4, 6 si hay vaguedad.
4. `docs/entrevista-profunda-v2-capa-5.md` — operación, consentimiento, ética.
5. Emitir ficha + **semáforo** con `docs/SEMAFORO-FICHA.md`.

### Capas (resumen)
0 Contexto · 1 Identidad/voz · 2 Ideal & anti · 3 Oferta/dinero · 4 Persuasión · 5 Operación/consentimiento · 6 Historias

### Técnica
Pregunta → parafrasea → ejemplo real 90 días → “¿y qué pasó después?” → guarda solo si deja de ser vago.

### Stops
- Sin precios claros (capa 3) → STOP de cierre.
- Sin consentimiento rescate (capa 5) → rescate OFF.
- Sin humano + horario → no encender.
- Semáforo **Rojo** → no crear agente de cierre.

Plantilla de voz/oferta: `docs/plantilla-agente-cliente-whatsapp.md`.  
Ejemplo de closer de agencia: `docs/hermes-closer-agencia/`.

---

## 2 — Alta `clients`

Crear fila con:
- `name`, `timezone` (ej. `Europe/Madrid`)
- `human_name`, `human_phone` (handoff)
- `ycloud_phone_number_id` **único**
- `wa_display_number` (opcional, legible)
- `active = true`

Un número WhatsApp = un `client_id`. No compartir número entre clientes.

---

## 3 — `agent_settings`

- `system_prompt` + `restrictions` + `language` + `tone`
- `openrouter_model` (OpenRouter)
- `handoff_threshold_eur`
- `version` (empezar en 1), `active = true`

**Versionar:** al cambiar prompt, nueva fila con `version+1`, desactivar la anterior. Solo una activa por cliente en retrieve.

---

## 4 — `offer_items`

Por cada pack:
- `name`, `price_min` / `price_max`
- `includes` / `excludes`
- `cta`
- `active = true`

Sin precios claros → el agente solo califica y escala a humano (no cierre en firme).

---

## 5 — `persuasion_items`

Tipos: `objection` | `benefit` | `proof` | `rescue` | `close`.  
Campos: `trigger`, `response`, `proof`, `intensity` (soft/medium/firm), `version`, `active`.

Mínimo razonable para Verde: ≥5 objeciones + benefits + al menos un close.  
Versionar cambios; no pisar historial sin `replaces_id` / desactivar.

Runtime recupera **2–5** filas rankeadas (`lib/agent/retrieve.ts`).

---

## 5b — Cable YCloud ↔ `client_id` + anti-mezcla

1. Confirmar que el phone number id del WhatsApp del cliente apunta a **esa** fila `clients`.
2. Webhook YCloud → `APP_URL/api/webhooks/ycloud`.
3. **Prueba anti-mezcla (crítica):**
   - Tener (o crear temporal) dos clients A y B con ofertas/persuasión distintas y números distintos.
   - Escribir al número A → la respuesta y los `persuasion_item_ids` / oferta deben ser solo de A.
   - Escribir al número B → solo datos de B.
   - Si hay cruce de precios, nombres de pack o copy → **STOP**. No continuar al paso 7.

Anti-mezcla no es opcional: es la garantía multi-tenant del producto.

---

## 6 — Checklist de prueba interna (A–D)

Ejecutar en entorno real (o staging con mismas credenciales de webhook) con allowlist.

### A) Webhook sano
- [ ] POST inbound → HTTP **200**
- [ ] Fila `messages` con `direction=in` y `client_id` correcto
- [ ] `external_id` deduplica (reenviar mismo evento no duplica lógica dañina)

**Si falla A → no encender.**

### B) Outbound con persuasión
- [ ] Respuesta enviada por YCloud
- [ ] Fila `messages` `direction=out`
- [ ] `persuasion_item_ids` rellenado cuando había inventario (ideal 2–5 UUIDs)

### C) Aislamiento `client_id`
- [ ] Texto/precios solo del cliente del número
- [ ] Ningún dato del otro tenant en prompt ni en respuesta
- [ ] Queries de retrieve filtradas (revisar si hay duda)

**Si falla C → no encender. Volver a 5b.**

### D) Handoff y restricciones
- [ ] Pedir humano / superar umbral € → fila `handoffs` + comportamiento según prompt
- [ ] Restricciones (no inventar precios, no garantías mágicas) respetadas en al menos 2 pruebas adversariales

Solo con A–D en verde (A y C obligatorios) se pasa al paso 7.

---

## 7 — Encendido controlado

- Allowlist de números / horario del negocio / volumen bajo.
- Monitorizar errores YCloud y OpenRouter.
- Humano de handoff avisado de que el bot está live.
- Semáforo mínimo: **Verde** (Ámbar solo modo calificar+humano, documentado).

---

## 8 — Revisión 48–72h

- Leer conversaciones reales de **ese** `client_id`.
- Ajustar `persuasion_items` / `offer_items` / prompt (versionando).
- No tocar filas de otro tenant.
- Anotar qué items de persuasión se usaron más.

---

## 9 — Follow-ups y rescate

- Reglas en `lead_state`: `followups_sent`, `next_followup_at`, `stage`.
- Máximos y tono según entrevista (capa 5) y skills de ejemplo en `docs/hermes-closer-agencia/skills/`.
- **Rescate** solo con consentimiento claro; si no → rescate OFF.
- Baja / “no me escribáis”: parar y marcar, no discutir.

---

## 10 — Operación continua

- Versionar prompts e items; medir (`docs/ARQUITECTURA.md` §Medición).
- Nunca pegar secretos en el repo ni en docs.
- Aislar siempre por `client_id`.
- Cambios de arquitectura: no improvisar por cliente; el diseño es de fábrica.
- Semáforo Oro: iterar con datos, no a ojo.

---

## Semáforo Rojo / Ámbar / Verde / Oro

Resumen operativo (detalle en `docs/SEMAFORO-FICHA.md`):

| Color | Significado | Acción |
|-------|-------------|--------|
| **Rojo** | Faltan bloqueantes; no cierre | Solo entrevista / documentar huecos |
| **Ámbar** | Mínimo parcial | Calificar + humano; sin volumen |
| **Verde** | Listo prueba + encendido controlado | Pasos 2→7 con checklist |
| **Oro** | Excelencia + medición | Escalar volumen con monitoreo |

---

## Referencias rápidas

- Arquitectura (5 cajas, 6 familias): `docs/ARQUITECTURA.md`
- Claves: `docs/keys-checklist.md`
- SOUL Constructor: `docs/SOUL-constructor-hermes.md`
- Schema SQL: `supabase/migrations/001_init.sql`
- Webhook: `app/api/webhooks/ycloud/route.ts`
- Hermes Desktop: `HERMES.md` (raíz del repo)
