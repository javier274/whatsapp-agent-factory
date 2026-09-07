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
