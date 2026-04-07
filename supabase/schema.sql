create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null default '',
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  nome text not null default '',
  segmento text not null default '',
  moeda text not null default 'R$',
  premissas jsonb not null default '{}'::jsonb,
  cenarios jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.client_year_data (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  year text not null,
  orc_mes jsonb not null default '{}'::jsonb,
  real_mes jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint client_year_data_client_id_year_key unique (client_id, year)
);

create index if not exists clients_user_id_idx on public.clients (user_id);
create index if not exists client_year_data_user_id_idx on public.client_year_data (user_id);
create index if not exists client_year_data_client_id_idx on public.client_year_data (client_id);

drop trigger if exists set_clients_updated_at on public.clients;
create trigger set_clients_updated_at
before update on public.clients
for each row
execute function public.set_updated_at();

drop trigger if exists set_client_year_data_updated_at on public.client_year_data;
create trigger set_client_year_data_updated_at
before update on public.client_year_data
for each row
execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, coalesce(new.email, ''))
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.client_year_data enable row level security;

drop policy if exists "Profiles are viewable by owner" on public.profiles;
create policy "Profiles are viewable by owner"
on public.profiles
for select
using (auth.uid() = id);

drop policy if exists "Profiles are updatable by owner" on public.profiles;
create policy "Profiles are updatable by owner"
on public.profiles
for update
using (auth.uid() = id);

drop policy if exists "Profiles are insertable by owner" on public.profiles;
create policy "Profiles are insertable by owner"
on public.profiles
for insert
with check (auth.uid() = id);

drop policy if exists "Clients are readable by owner" on public.clients;
create policy "Clients are readable by owner"
on public.clients
for select
using (auth.uid() = user_id);

drop policy if exists "Clients are insertable by owner" on public.clients;
create policy "Clients are insertable by owner"
on public.clients
for insert
with check (auth.uid() = user_id);

drop policy if exists "Clients are updatable by owner" on public.clients;
create policy "Clients are updatable by owner"
on public.clients
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Clients are deletable by owner" on public.clients;
create policy "Clients are deletable by owner"
on public.clients
for delete
using (auth.uid() = user_id);

drop policy if exists "Client year data is readable by owner" on public.client_year_data;
create policy "Client year data is readable by owner"
on public.client_year_data
for select
using (auth.uid() = user_id);

drop policy if exists "Client year data is insertable by owner" on public.client_year_data;
create policy "Client year data is insertable by owner"
on public.client_year_data
for insert
with check (auth.uid() = user_id);

drop policy if exists "Client year data is updatable by owner" on public.client_year_data;
create policy "Client year data is updatable by owner"
on public.client_year_data
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Client year data is deletable by owner" on public.client_year_data;
create policy "Client year data is deletable by owner"
on public.client_year_data
for delete
using (auth.uid() = user_id);
