# Fábrica de agentes WhatsApp

Proyecto Next.js App Router multi-tenant.

Stack: Vercel, Supabase, OpenRouter, YCloud

## Arquitectura

WhatsApp lead -> webhook /api/webhooks/ycloud
  -> secreto opcional, dedupe external_id
  -> tenant por clients.ycloud_phone_number_id
  -> inbound, retrieve 2-5 persuasion + offer, OpenRouter
  -> outbound con persuasion_item_ids, envio YCloud

Aislamiento por client_id. RLS on. Service role en API.

Tablas: clients, agent_settings, offer_items, persuasion_items, contacts,
conversations, messages (+ external_id), lead_state, quotes, handoffs.

## Setup local

cd whatsapp-agent-factory
npm install
npm run typecheck
npm run build
npm run dev

Página: http://localhost:3000

## Migración

Ejecutar supabase/migrations/001_init.sql en Supabase SQL Editor.

## Vercel

Importar repo, configurar env vars, deploy, fijar APP_URL.

## Webhook

POST /api/webhooks/ycloud
Ver comentarios en app/api/webhooks/ycloud/route.ts
Fixture: tests/fixtures/ycloud-inbound.json

## Primer cliente

Insertar clients + agent_settings + offer_items + persuasion_items (mismo client_id).

## Anti-mezcla

1. Dos clients con phone number id distintos.
2. Mensaje a A no usa datos de B.
3. Si hay cruce: STOP.

## Scripts

npm run dev | build | lint | typecheck

## Docs

docs/keys-checklist.md
docs/constructor.md (pasos 0-10)

Libs fallan claro si falta env; build lazy sin secretos.

## Índice de documentación

- [HERMES.md](HERMES.md) — cómo usar el repo en Hermes / Claude Code
- [CLAUDE.md](CLAUDE.md) — instrucciones del constructor
- [docs/ARQUITECTURA.md](docs/ARQUITECTURA.md) — 5 cajas + bases
- [docs/MANUAL-OPERATIVO.md](docs/MANUAL-OPERATIVO.md) — pasos 0→10
- [docs/constructor.md](docs/constructor.md) — resumen operativo
- [docs/SEMAFORO-FICHA.md](docs/SEMAFORO-FICHA.md) — Rojo/Ámbar/Verde/Oro
- [docs/keys-checklist.md](docs/keys-checklist.md) — claves
- [docs/SOUL-constructor-hermes.md](docs/SOUL-constructor-hermes.md) — SOUL del Constructor
- Entrevista v2: `docs/entrevista-profunda-v2-*.md`
- Plantilla cliente: [docs/plantilla-agente-cliente-whatsapp.md](docs/plantilla-agente-cliente-whatsapp.md)
- Ejemplo Closer Agencia: [docs/hermes-closer-agencia/](docs/hermes-closer-agencia/)

