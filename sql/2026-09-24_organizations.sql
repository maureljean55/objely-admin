-- Organisations (lycées, universités…) registered from the objely-admin portal.
-- Same pattern as admin_users / admin_audit_log: RLS on and NO policies, so the
-- table is unreachable from the public app and its API keys. It is only ever
-- read/written with the service_role key from the admin portal's server side.
--
-- Run once in the Supabase SQL editor of the project the admin portal points to.
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 120),
  type text not null default 'lycee' check (type in ('ecole', 'college', 'lycee', 'universite', 'autre')),
  city text check (city is null or char_length(city) between 1 and 80),
  contact_email text check (contact_email is null or char_length(contact_email) between 3 and 160),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Same name in two different cities is fine; the exact same name + city is a duplicate.
create unique index if not exists organizations_name_city_key
  on public.organizations (lower(btrim(name)), lower(coalesce(city, '')));

create index if not exists organizations_created_at_idx on public.organizations (created_at desc);

alter table public.organizations enable row level security;
