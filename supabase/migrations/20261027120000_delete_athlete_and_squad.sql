-- Erasure on request: the coach can delete one athlete's results or the whole
-- squad. Both verify the coach key like every other coach RPC. Deleting the
-- squad cascades to squad_config and results (foreign keys in core.sql).
-- Not applied yet.

create or replace function public.delete_athlete_results(p_code text, p_coach_key text, p_athlete text)
returns int
language plpgsql security definer set search_path = public
as $$
declare
  v_id uuid;
  v_count int;
begin
  if p_athlete is null or length(trim(p_athlete)) = 0 or length(p_athlete) > 40 then
    raise exception 'invalid athlete name';
  end if;
  select id into v_id from public.squads where code = upper(trim(p_code)) and coach_key = p_coach_key;
  if v_id is null then
    raise exception 'unauthorized';
  end if;
  delete from public.results where squad_id = v_id and athlete = trim(p_athlete);
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

create or replace function public.delete_squad(p_code text, p_coach_key text)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  delete from public.squads where code = upper(trim(p_code)) and coach_key = p_coach_key;
  if not found then
    raise exception 'unauthorized';
  end if;
end;
$$;

revoke all on function public.delete_athlete_results(text, text, text) from public;
revoke all on function public.delete_squad(text, text) from public;
grant execute on function public.delete_athlete_results(text, text, text) to anon, authenticated;
grant execute on function public.delete_squad(text, text) to anon, authenticated;
