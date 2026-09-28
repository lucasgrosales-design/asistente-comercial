create extension if not exists pgcrypto;

create schema if not exists private;

create table if not exists public.companies (id uuid primary key default gen_random_uuid(), name text not null, created_at timestamptz not null default now());
create table if not exists public.users (id uuid primary key references auth.users(id) on delete cascade, company_id uuid not null references public.companies(id) on delete cascade, name text not null, email text, role text not null default 'seller', created_at timestamptz not null default now());
create table if not exists public.contacts (id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade, name text not null, phone text, email text, metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table if not exists public.contact_channels (id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade, contact_id uuid not null references public.contacts(id) on delete cascade, channel text not null, external_sender_id text not null, created_at timestamptz not null default now(), unique(company_id,channel,external_sender_id));
create table if not exists public.opportunities (id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade, contact_id uuid not null references public.contacts(id) on delete cascade, assigned_user_id uuid references public.users(id) on delete set null, need text, product text, intent text, status text not null default 'nuevo' check(status in ('nuevo','en_conversacion','seguimiento','venta','perdido','inactivo')), current_summary text, next_action text, next_action_at date, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table if not exists public.conversations (id uuid primary key default gen_random_uuid(), opportunity_id uuid not null references public.opportunities(id) on delete cascade, channel text not null, external_id text, started_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(channel,external_id));
create table if not exists public.interactions (id uuid primary key default gen_random_uuid(), opportunity_id uuid not null references public.opportunities(id) on delete cascade, user_id uuid references public.users(id) on delete set null, channel text not null default 'manual', occurred_at timestamptz not null default now(), source_text text, summary text not null, outcome text, created_at timestamptz not null default now());
create table if not exists public.inbound_events (id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade, channel text not null, external_message_id text not null, sender_id text not null, received_at timestamptz not null default now(), processed_at timestamptz, opportunity_id uuid references public.opportunities(id) on delete set null, unique(company_id,channel,external_message_id));
alter table public.interactions add column if not exists inbound_event_id uuid unique references public.inbound_events(id) on delete set null;

create index if not exists idx_users_company on public.users(company_id);
create index if not exists idx_opportunities_company_status on public.opportunities(company_id,status);
create index if not exists idx_opportunities_next_action on public.opportunities(company_id,next_action_at);
create index if not exists idx_interactions_opportunity on public.interactions(opportunity_id,occurred_at desc);
create index if not exists idx_interactions_inbound_event on public.interactions(inbound_event_id);
create index if not exists idx_contact_channels_lookup on public.contact_channels(company_id,channel,external_sender_id);
create index if not exists idx_inbound_events_sender on public.inbound_events(company_id,channel,sender_id,received_at desc);

alter table public.companies enable row level security;
alter table public.users enable row level security;
alter table public.contacts enable row level security;
alter table public.contact_channels enable row level security;
alter table public.opportunities enable row level security;
alter table public.conversations enable row level security;
alter table public.interactions enable row level security;
alter table public.inbound_events enable row level security;

create or replace function private.current_company_id() returns uuid language sql stable security definer set search_path='' as $$ select company_id from public.users where id=(select auth.uid()) limit 1 $$;
revoke all on function private.current_company_id() from public;
grant usage on schema private to authenticated;
grant execute on function private.current_company_id() to authenticated;

drop policy if exists "company users" on public.companies;
drop policy if exists "company users read users" on public.users;
drop policy if exists "company contacts" on public.contacts;
drop policy if exists "company contact channels" on public.contact_channels;
drop policy if exists "company opportunities" on public.opportunities;
drop policy if exists "company conversations" on public.conversations;
drop policy if exists "company interactions" on public.interactions;
drop policy if exists "company inbound events" on public.inbound_events;
create policy "company users" on public.companies for select to authenticated using (id=(select private.current_company_id()));
create policy "company users read users" on public.users for select to authenticated using (company_id=(select private.current_company_id()));
create policy "company contacts" on public.contacts for all to authenticated using (company_id=(select private.current_company_id())) with check (company_id=(select private.current_company_id()));
create policy "company contact channels" on public.contact_channels for all to authenticated using (company_id=(select private.current_company_id())) with check (company_id=(select private.current_company_id()));
create policy "company opportunities" on public.opportunities for all to authenticated using (company_id=(select private.current_company_id())) with check (company_id=(select private.current_company_id()));
create policy "company conversations" on public.conversations for all to authenticated using (exists(select 1 from public.opportunities o where o.id=opportunity_id and o.company_id=(select private.current_company_id()))) with check (exists(select 1 from public.opportunities o where o.id=opportunity_id and o.company_id=(select private.current_company_id())));
create policy "company interactions" on public.interactions for all to authenticated using (exists(select 1 from public.opportunities o where o.id=opportunity_id and o.company_id=(select private.current_company_id()))) with check (exists(select 1 from public.opportunities o where o.id=opportunity_id and o.company_id=(select private.current_company_id())));
create policy "company inbound events" on public.inbound_events for all to authenticated using (company_id=(select private.current_company_id())) with check (company_id=(select private.current_company_id()));

revoke all on table public.companies,public.users,public.contacts,public.contact_channels,public.opportunities,public.conversations,public.interactions,public.inbound_events from anon;
grant select,insert,update,delete on public.companies,public.users,public.contacts,public.contact_channels,public.opportunities,public.conversations,public.interactions,public.inbound_events to authenticated;
grant all on public.companies,public.users,public.contacts,public.contact_channels,public.opportunities,public.conversations,public.interactions,public.inbound_events to service_role;

create or replace function public.create_opportunity(p_name text,p_phone text default null,p_need text default null,p_email text default null) returns uuid language plpgsql security invoker set search_path=public as $
declare v_company uuid; v_contact uuid; v_opp uuid; v_phone text; v_email text;
begin
  v_company := private.current_company_id();
  if v_company is null then raise exception 'company_not_configured'; end if;
  if nullif(trim(p_name),'') is null then raise exception 'name_required'; end if;
  v_phone := nullif(trim(p_phone),'');
  v_email := nullif(lower(trim(p_email)),'');
  select id into v_contact from public.contacts where company_id=v_company and ((v_phone is not null and phone=v_phone) or (v_email is not null and lower(email)=v_email)) order by updated_at desc limit 1;
  if v_contact is null then
    insert into public.contacts(company_id,name,phone,email) values(v_company,trim(p_name),v_phone,v_email) returning id into v_contact;
  else
    update public.contacts set name=coalesce(nullif(trim(p_name),''),name), phone=coalesce(v_phone,phone), email=coalesce(v_email,email), updated_at=now() where id=v_contact and company_id=v_company;
  end if;
  insert into public.opportunities(company_id,contact_id,assigned_user_id,need,status) values(v_company,v_contact,auth.uid(),nullif(trim(p_need),''),'nuevo') returning id into v_opp;
  return v_opp;
end; $;
revoke all on function public.create_opportunity(text,text,text,text) from public;
grant execute on function public.create_opportunity(text,text,text,text) to authenticated;


create table if not exists public.demo_sessions (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique,
  state jsonb not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);
create index if not exists idx_demo_sessions_expires_at on public.demo_sessions(expires_at);
alter table public.demo_sessions enable row level security;
revoke all on table public.demo_sessions from anon, authenticated;
grant all on table public.demo_sessions to service_role;
create policy "demo sessions server only" on public.demo_sessions for all to anon, authenticated using (false) with check (false);

