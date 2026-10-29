-- Storage limitation (GDPR art. 5.1.e): a squad nobody has used for 12 months
-- is deleted with its config and every result (on delete cascade). Activity is
-- the latest of: squad creation, last config publish, last result.
-- pg_cron runs it every night at 03:17 UTC. Not callable from the client.
-- Not applied yet.

create extension if not exists pg_cron with schema pg_catalog;

create or replace function public.purge_inactive_squads()
returns int
language plpgsql security definer set search_path = public
as $$
declare
  v_count int;
begin
  delete from public.squads s
  where greatest(
    s.created_at,
    coalesce((select c.updated_at from public.squad_config c where c.squad_id = s.id), s.created_at),
    coalesce((select max(r.created_at) from public.results r where r.squad_id = s.id), s.created_at)
  ) < now() - interval '12 months';
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.purge_inactive_squads() from public, anon, authenticated;

select cron.schedule('purge-inactive-squads', '17 3 * * *', $$select public.purge_inactive_squads()$$);
