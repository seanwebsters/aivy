-- Aivy — production schema (Phase 3). Mirrors src/lib/store.ts.
-- All tables have RLS enabled. Server routes use the service role; customers
-- read their own data through Supabase Auth (auth.uid()).

create extension if not exists "pgcrypto";

create table public.analyses (
  id text primary key,
  user_id uuid references auth.users(id) on delete set null,
  owner_key_hash text not null,               -- hash of the anonymous browser key, before sign-in
  url text not null,
  domain text not null,
  status text not null check (status in ('queued','fetching','profiling','awaiting_answers','recommending','complete','failed')),
  mode text not null check (mode in ('ai','heuristic','demo')),
  error text,
  site jsonb,
  profile jsonb,
  questions jsonb,
  answers jsonb,
  opportunities jsonb,
  attempts int not null default 0,
  assistant_used int not null default 0,
  assistant_limit int not null default 150,
  assistant_flagged int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.analyses (domain);
create index on public.analyses (user_id);

create table public.entitlements (
  analysis_id text primary key references public.analyses(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  source text not null check (source in ('stripe','simulated','demo')),
  stripe_session_id text unique not null,     -- idempotency: one entitlement per session
  amount int not null,
  currency text not null,
  email text,
  refunded_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.progress (
  analysis_id text references public.analyses(id) on delete cascade,
  playbook_id text not null,
  done text[] not null default '{}',
  started_at timestamptz,
  completed_at timestamptz,
  primary key (analysis_id, playbook_id)
);

create table public.outcomes (
  id uuid primary key default gen_random_uuid(),
  analysis_id text references public.analyses(id) on delete cascade,
  playbook_id text not null,
  metric text not null,
  before_value text,
  after_value text,
  note text,
  created_at timestamptz not null default now()
);

create table public.ai_costs (
  id bigint generated always as identity primary key,
  analysis_id text references public.analyses(id) on delete set null,
  provider text not null,
  model text not null,
  purpose text not null,
  input_tokens int not null,
  output_tokens int not null,
  usd numeric(10,6) not null,
  created_at timestamptz not null default now()
);
create index on public.ai_costs (created_at);

create table public.stripe_events (
  id text primary key,                        -- webhook idempotency
  received_at timestamptz not null default now()
);

create table public.app_events (
  id bigint generated always as identity primary key,
  level text not null,
  type text not null,
  message text not null,
  analysis_id text,
  created_at timestamptz not null default now()
);

alter table public.analyses enable row level security;
alter table public.entitlements enable row level security;
alter table public.progress enable row level security;
alter table public.outcomes enable row level security;
alter table public.ai_costs enable row level security;
alter table public.stripe_events enable row level security;
alter table public.app_events enable row level security;

-- Customers can read their own analyses and entitlements once signed in.
create policy "own analyses" on public.analyses for select using (user_id = auth.uid());
create policy "own entitlements" on public.entitlements for select using (user_id = auth.uid());
-- Progress and outcomes: only for analyses the user owns AND has paid for.
create policy "own progress" on public.progress for all using (
  exists (select 1 from public.entitlements e where e.analysis_id = progress.analysis_id and e.user_id = auth.uid() and e.refunded_at is null)
) with check (
  exists (select 1 from public.entitlements e where e.analysis_id = progress.analysis_id and e.user_id = auth.uid() and e.refunded_at is null)
);
create policy "own outcomes" on public.outcomes for all using (
  exists (select 1 from public.entitlements e where e.analysis_id = outcomes.analysis_id and e.user_id = auth.uid() and e.refunded_at is null)
) with check (
  exists (select 1 from public.entitlements e where e.analysis_id = outcomes.analysis_id and e.user_id = auth.uid() and e.refunded_at is null)
);
-- ai_costs, stripe_events, app_events: no policies → service role only.
