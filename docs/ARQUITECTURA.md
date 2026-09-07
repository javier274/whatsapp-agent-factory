# Arquitectura — Fábrica de agentes WhatsApp

Documento de referencia del sistema multi-tenant. Stack fijo: **Vercel + Supabase + OpenRouter + YCloud**.

---

## Las 5 cajas

```
┌─────────────┐    ┌──────────────────┐    ┌─────────────┐
│ 1. Canal    │───▶│ 2. Orquestador   │───▶│ 3. Datos    │
│ YCloud / WA │◀───│ Next.js (Vercel) │◀───│ Supabase    │
└─────────────┘    └────────┬─────────┘    └─────────────┘
                            │
                            ▼
                   ┌──────────────────┐
                   │ 4. Modelo        │
                   │ OpenRouter       │
                   └──────────────────┘

┌─────────────────────────────────────────────────────────┐
│ 5. Constructor (Hermes / Claude Code)                   │
│ Entrevista → ficha → alta DB → prueba → encendido       │
│ No habla con el lead final; monta agentes por cliente.  │
└─────────────────────────────────────────────────────────┘
```

### 1. Canal — YCloud / WhatsApp
- Recibe mensajes inbound del número Business del cliente.
- Envía outbound vía API YCloud.
- Identifica el tenant con `ycloud_phone_number_id` (un número = un `client_id`).
- Webhook: `POST /api/webhooks/ycloud`.

### 2. Orquestador — Next.js App Router (Vercel)
- Valida secreto webhook (opcional), deduplica por `external_id`.
- Resuelve `client_id` desde `clients.ycloud_phone_number_id`.
- Persiste inbound, recupera contexto, llama al modelo, persiste outbound, envía por YCloud.
- Usa **service role** de Supabase solo en servidor; filtra **siempre** por `client_id`.

### 3. Datos — Supabase (Postgres + RLS)
- Todas las tablas de negocio llevan `client_id` (excepto la propia `clients`).
- RLS activado; la API no confía en “olvidar” el filtro.
- Migración: `supabase/migrations/001_init.sql`.

### 4. Modelo — OpenRouter
- Único gateway de LLM del sistema (no sustituir por otro proveedor sin pedirlo).
- Modelo por defecto en env / `agent_settings.openrouter_model` (ej. `openai/gpt-4.1-mini`).
- El prompt combina: system del cliente + oferta + 2–5 filas de persuasión + historial reciente.

### 5. Constructor — Hermes Agent + Claude Code
- Persona: `docs/SOUL-constructor-hermes.md`.
- Manual: `docs/MANUAL-OPERATIVO.md` (pasos 0→10).
- Entrevista profunda v2 + semáforo antes de encender.
- Ejemplo de bot de ventas: `docs/hermes-closer-agencia/`.

---

## Flujo de un mensaje (runtime)

1. Lead escribe por WhatsApp → YCloud notifica el webhook.
2. Orquestador: secreto OK → dedupe `external_id` → lookup cliente activo.
3. Upsert contact / conversation; insert mensaje `direction=in`.
4. **Retrieve**: `agent_settings` activa + `offer_items` + **2–5** `persuasion_items` rankeados por trigger + últimos mensajes (solo de ese `client_id`).
5. OpenRouter genera respuesta respetando system prompt y restricciones.
6. Insert mensaje `direction=out` con `persuasion_item_ids` usados.
7. Envío YCloud al mismo número / thread.
8. Si umbral handoff / restricción → fila en `handoffs` + aviso al humano.

---

## Las 6 familias de base de datos

| # | Familia | Tablas | Rol |
|---|---------|--------|-----|
| 1 | **Identidad** | `clients` | Tenant: nombre, timezone, humano, `ycloud_phone_number_id` único |
| 2 | **Cerebro** | `agent_settings` | System prompt, restricciones, tono, modelo OpenRouter, umbral €, **versionado** |
| 3 | **Oferta** | `offer_items` | Packs, price_min/max, includes/excludes, CTA |
| 4 | **Persuasión** | `persuasion_items` | objection / benefit / proof / rescue / close; **versionado** (`version`, `replaces_id`, `active`) |
| 5 | **Conversación** | `contacts`, `conversations`, `messages`, `lead_state` | Personas, hilos, textos, stage/score/follow-ups |
| 6 | **Resultados** | `quotes`, `handoffs` | Presupuestos enviados y escalados a humano |

Regla de oro: **nunca** leer ni escribir filas de un `client_id` distinto al resuelto por el número WhatsApp del webhook.

---

## Multi-tenant (`client_id`)

- Raíz del aislamiento: `clients.ycloud_phone_number_id` → `clients.id`.
- Toda query de retrieve / insert lleva `.eq("client_id", clientId)`.
- Un número WhatsApp no se reutiliza entre clientes (`unique` en DB).
- Prueba anti-mezcla obligatoria antes de go-live (paso **5b** del manual).

---

## Retrieval de persuasión (2–5 filas)

- Se cargan items `active` del `client_id`.
- Se puntúan por coincidencia del `trigger` con el texto inbound.
- Se eligen **mínimo 2, máximo 5** (si hay inventario).
- Los IDs usados se guardan en `messages.persuasion_item_ids` (outbound) para medición.
- Código: `lib/agent/retrieve.ts`.

---

## Versionado

- `agent_settings`: `version` + `active`; solo **una** versión activa por cliente (la de mayor version activa gana en retrieve).
- `persuasion_items`: `version`, `replaces_id`, `active`. Para cambiar copy: nueva fila, desactivar la anterior; no editar a ciegas en producción sin rastro.
- Oferta: preferible desactivar pack viejo y crear uno nuevo si cambian precios.

---

## Medición

Qué mirar por `client_id`:
- Volumen inbound / outbound y errores YCloud / OpenRouter.
- % mensajes con `persuasion_item_ids` no vacíos.
- Items de persuasión más usados (agregar por UUID).
- `lead_state.stage` / `score` (hot/warm/cold).
- `quotes` (sent / accepted / rejected).
- `handoffs` (razón y volumen).
- Tiempo a primera respuesta y follow-ups (`followups_sent`, `next_followup_at`).

Sin medición no se itera el semáforo ni la persuasión.

---

## Anti-mezcla (no negociable)

1. Dos `clients` con `ycloud_phone_number_id` distintos y ofertas distintas.
2. Mensaje al número A → respuesta solo con oferta/persuasión de A.
3. Mensaje al número B → solo datos de B.
4. Si hay cruce de textos, precios o IDs → **STOP**. No encender. Revisar filtro `client_id` y el cable número→cliente.

Detalle operativo: `docs/MANUAL-OPERATIVO.md` §5b y checklist paso 6 (A–D).

---

## Qué no es esta arquitectura

- No es un bot monolítico con un solo prompt para todos los clientes.
- No mezcla memorias entre tenants.
- No usa otro LLM gateway distinto de OpenRouter sin decisión explícita.
- No guarda secretos en el repo (ver `.env.example` y `docs/keys-checklist.md`).
