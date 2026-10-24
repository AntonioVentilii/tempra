-- Defence in depth before the repository goes public.
-- RLS already blocks every direct table write and every direct read of
-- squads and results; this also drops the default table grants, so a future
-- permissive policy or a disabled RLS cannot expose coach keys or results.
-- squad_config keeps SELECT: Realtime postgres_changes needs it.
-- The RPCs are SECURITY DEFINER and keep working unchanged.
-- Free-form RPC inputs get upper bounds so nobody can fill the database with
-- oversized payloads: real params are well under 1 KB, configs under 1 KB.
-- Apply to project znhomweyvdkkhvgcnvdc as `harden_grants_and_payloads`; not applied yet.

revoke all on table public.squads, public.results from anon, authenticated;
revoke insert, update, delete, truncate, references, trigger on table public.squad_config from anon, authenticated;

alter function public.gen_squad_code() set search_path = public;
alter function public.default_squad_config() set search_path = public;

create or replace function public.submit_result(
  p_code text, p_athlete text, p_game text, p_difficulty int, p_score int,
  p_accuracy numeric, p_mean_rt_ms int, p_trials int, p_duration_ms int, p_params jsonb
)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_id uuid;
  v_result uuid;
begin
  select id into v_id from public.squads where code = upper(trim(p_code));
  if v_id is null then
    raise exception 'unknown squad';
  end if;
  if p_athlete is null or length(trim(p_athlete)) = 0 or length(p_athlete) > 40 then
    raise exception 'invalid athlete name';
  end if;
  if p_game is null or length(p_game) = 0 or length(p_game) > 40 then
    raise exception 'invalid game';
  end if;
  if p_params is not null and pg_column_size(p_params) > 16384 then
    raise exception 'params too large';
  end if;
  insert into public.results (squad_id, code, athlete, game, difficulty, score, accuracy, mean_rt_ms, trials, duration_ms, params)
  values (v_id, upper(trim(p_code)), trim(p_athlete), p_game, p_difficulty, p_score, p_accuracy, p_mean_rt_ms, p_trials, p_duration_ms, coalesce(p_params, '{}'::jsonb))
  returning id into v_result;
  return v_result;
end;
$$;

create or replace function public.update_squad_config(p_code text, p_coach_key text, p_config jsonb)
returns table (config jsonb, updated_at timestamptz)
language plpgsql security definer set search_path = public
as $$
declare
  v_id uuid;
begin
  if p_config is null or jsonb_typeof(p_config) <> 'object' then
    raise exception 'invalid config';
  end if;
  if pg_column_size(p_config) > 32768 then
    raise exception 'config too large';
  end if;
  select id into v_id from public.squads where code = upper(trim(p_code)) and coach_key = p_coach_key;
  if v_id is null then
    raise exception 'unauthorized';
  end if;
  update public.squad_config set config = p_config, updated_at = now() where squad_id = v_id;
  return query select c.config, c.updated_at from public.squad_config c where c.squad_id = v_id;
end;
$$;
