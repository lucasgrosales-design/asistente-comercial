-- Endurecimiento de seguridad (auditoría 2026-09-28). Ya aplicado en el proyecto grjboblvtmsvynubexwv.
revoke update on table public.users from authenticated;
grant update (name) on table public.users to authenticated;
revoke all on table public.companies, public.users, public.contacts, public.contact_channels,
  public.opportunities, public.conversations, public.interactions, public.inbound_events
  from anon;
