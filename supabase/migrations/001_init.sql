-- Agentes WhatsApp por cliente (agencia)
-- Pegar en Supabase → SQL Editor
-- Excelencia: todo lleva client_id; RLS de ejemplo al final

create extension if not exists "pgcrypto";

-- 1) Identidad
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  timezone text not null default 'Europe/Madrid',
  human_name text,
  human_phone text,
  ycloud_phone_number_id text unique,
  wa_display_number text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2) Cerebro corto
create table public.agent_settings (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  system_prompt text not null,
  restrictions text not null,
  language text not null default 'es',
  tone text,
  handoff_threshold_eur numeric,
  openrouter_model text not null default 'openai/gpt-4.1-mini',
  version int not null default 1,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (client_id, version)
);

-- 3) Oferta
create table public.offer_items (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  name text not null,
  price_min numeric,
  price_max numeric,
  includes text,
  excludes text,
  cta text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index offer_items_client_idx on public.offer_items(client_id) where active;

-- 4) Persuasión (versionada)
create table public.persuasion_items (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  type text not null check (type in ('objection','benefit','proof','rescue','close')),
  trigger text not null,
  response text not null,
  proof text,
  intensity text not null default 'soft' check (intensity in ('soft','medium','firm')),
  version int not null default 1,
  replaces_id uuid references public.persuasion_items(id),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index persuasion_client_active_idx
  on public.persuasion_items(client_id, type) where active;

-- 5) Personas
create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  wa_phone text not null,
  name text,
  source text,
  is_returning boolean not null default false,
  created_at timestamptz not null default now(),
  unique (client_id, wa_phone)
);

-- 6) Conversaciones
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  wa_thread_id text,
  status text not null default 'open' check (status in ('open','closed','handoff')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index conversations_client_contact_idx
  on public.conversations(client_id, contact_id);

-- 7) Mensajes
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  direction text not null check (direction in ('in','out')),
  body text not null,
  external_id text,
  persuasion_item_ids uuid[] default '{}',
  created_at timestamptz not null default now()
);

create index messages_conversation_created_idx
  on public.messages(conversation_id, created_at);

create unique index messages_client_external_id_uidx
  on public.messages(client_id, external_id)
  where external_id is not null;

-- 8) Estado del lead
create table public.lead_state (
  contact_id uuid primary key references public.contacts(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  stage text not null default 'new'
    check (stage in ('new','qualifying','quoted','followup','closing','won','lost','rescue')),
  score text check (score in ('hot','warm','cold')),
  followups_sent int not null default 0,
  next_followup_at timestamptz,
  last_quote_at timestamptz,
  updated_at timestamptz not null default now()
);

-- 9) Presupuestos
create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  offer_item_id uuid references public.offer_items(id),
  amount_min numeric,
  amount_max numeric,
  status text not null default 'sent'
    check (status in ('sent','accepted','rejected','expired')),
  created_at timestamptz not null default now()
);

-- 10) Handoffs
create table public.handoffs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  reason text not null,
  summary text,
  created_at timestamptz not null default now()
);

-- RLS: activar (políticas de ejemplo para rol authenticated por client_id en JWT)
-- Tu API de Vercel normalmente usa service role y filtra SIEMPRE por client_id resuelto del webhook.
alter table public.clients enable row level security;
alter table public.agent_settings enable row level security;
alter table public.offer_items enable row level security;
alter table public.persuasion_items enable row level security;
alter table public.contacts enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.lead_state enable row level security;
alter table public.quotes enable row level security;
alter table public.handoffs enable row level security;


-- Politicas de aislamiento por client_id (JWT claim).
-- La API usa service role y filtra SIEMPRE por client_id del webhook.

create policy clients_isolation on public.clients
  for all using (id = (auth.jwt()->>'client_id')::uuid)
  with check (id = (auth.jwt()->>'client_id')::uuid);

create policy agent_settings_isolation on public.agent_settings
  for all using (client_id = (auth.jwt()->>'client_id')::uuid)
  with check (client_id = (auth.jwt()->>'client_id')::uuid);

create policy offer_items_isolation on public.offer_items
  for all using (client_id = (auth.jwt()->>'client_id')::uuid)
  with check (client_id = (auth.jwt()->>'client_id')::uuid);

create policy persuasion_items_isolation on public.persuasion_items
  for all using (client_id = (auth.jwt()->>'client_id')::uuid)
  with check (client_id = (auth.jwt()->>'client_id')::uuid);

create policy contacts_isolation on public.contacts
  for all using (client_id = (auth.jwt()->>'client_id')::uuid)
  with check (client_id = (auth.jwt()->>'client_id')::uuid);

create policy conversations_isolation on public.conversations
  for all using (client_id = (auth.jwt()->>'client_id')::uuid)
  with check (client_id = (auth.jwt()->>'client_id')::uuid);

create policy messages_isolation on public.messages
  for all using (client_id = (auth.jwt()->>'client_id')::uuid)
  with check (client_id = (auth.jwt()->>'client_id')::uuid);

create policy lead_state_isolation on public.lead_state
  for all using (client_id = (auth.jwt()->>'client_id')::uuid)
  with check (client_id = (auth.jwt()->>'client_id')::uuid);

create policy quotes_isolation on public.quotes
  for all using (client_id = (auth.jwt()->>'client_id')::uuid)
  with check (client_id = (auth.jwt()->>'client_id')::uuid);

create policy handoffs_isolation on public.handoffs
  for all using (client_id = (auth.jwt()->>'client_id')::uuid)
  with check (client_id = (auth.jwt()->>'client_id')::uuid);
