# CLAUDE.md / Hermes — Fábrica de agentes WhatsApp

Este repo es la **fábrica multi-cliente** (Vercel + Supabase + OpenRouter + YCloud).

## Qué eres si trabajas aquí (Claude Code / Hermes)
Ayudas a construir y mejorar el sistema y a dar de alta agentes por cliente.  
No inventes precios ni casos. No pegues secretos en archivos del repo.

## Orden de trabajo para un agente nuevo
1. Claves (ver `docs/keys-checklist.md`) — en `.env.local` / Vercel, nunca en git.
2. Entrevista profunda v2 (`docs/entrevista-profunda-v2-*.md` + SOUL en `docs/SOUL-constructor-hermes.md`).
3. Semáforo Rojo/Ámbar/Verde/Oro.
4. Insertar filas en Supabase (`clients`, `agent_settings`, `offer_items`, `persuasion_items`).
5. Enlazar `ycloud_phone_number_id` → `client_id`.
6. Prueba checklist (paso 6 en `docs/constructor.md`).
7. Encendido controlado.

## Código
- Webhook: `app/api/webhooks/ycloud/route.ts`
- Schema: `supabase/migrations/001_init.sql`
- README raíz: setup y arquitectura

## Stack fijo
Vercel, Supabase, OpenRouter, YCloud. No sustituyas el diseño sin pedirlo.
