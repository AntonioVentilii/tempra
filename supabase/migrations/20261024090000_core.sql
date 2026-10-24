-- Tempra core schema: squads (coach-owned), live squad config (public read,
-- realtime), results (athlete submissions). All writes go through
-- SECURITY DEFINER RPCs so the coach key never leaves the database.
-- Applied to project znhomweyvdkkhvgcnvdc on 2026-10-24 as `tempra_core_schema`.

create extension if not exists pgcrypto;

create table public.squads (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  coach_key text not null,
  created_at timestamptz not null default now()
);

create table public.squad_config (
  squad_id uuid primary key references public.squads(id) on delete cascade,
  code text not null unique,
  config jsonb not null,
  updated_at timestamptz not null default now()
);

create table public.results (
  id uuid primary key default gen_random_uuid(),
  squad_id uuid not null references public.squads(id) on delete cascade,
  code text not null,
  athlete text not null,
  game text not null,
  difficulty int not null,
  score int not null,
  accuracy numeric(5,4) not null,
  mean_rt_ms int,
  trials int not null,
  duration_ms int not null,
  params jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index results_code_created_idx on public.results (code, created_at desc);

alter table public.squads enable row level security;
alter table public.squad_config enable row level security;
alter table public.results enable row level security;

-- Athletes read the live config directly (and via realtime) by squad code.
create policy "squad_config is public to read"
  on public.squad_config for select
  to anon, authenticated
  using (true);

-- No direct policies on squads / results: RPC only.

create or replace function public.default_squad_config()
returns jsonb
language sql immutable
as $$
  select jsonb_build_object(
    'difficulty', 3,
    'games', jsonb_build_array('stroop', 'gonogo', 'nback', 'flanker', 'math', 'trail'),
    'block_duration_s', 90,
    'game_duration_s', 30,
    'time_pressure', true,
    'distractors', false,
    'penalty_on_error', true,
    'auto_adapt', false,
    'message', ''
  );
$$;

create or replace function public.gen_squad_code()
returns text
language plpgsql
as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  candidate text;
begin
  loop
    candidate := '';
    for i in 1..6 loop
      candidate := candidate || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    exit when not exists (select 1 from public.squads where code = candidate);
  end loop;
  return candidate;
end;
$$;

create or replace function public.create_squad(p_name text)
returns table (code text, coach_key text, config jsonb)
language plpgsql security definer set search_path = public
as $$
declare
  v_code text := public.gen_squad_code();
  v_key text := encode(gen_random_bytes(18), 'hex');
  v_id uuid;
  v_config jsonb := public.default_squad_config();
begin
  if p_name is null or length(trim(p_name)) = 0 or length(p_name) > 60 then
    raise exception 'invalid squad name';
  end if;
  insert into public.squads (code, name, coach_key) values (v_code, trim(p_name), v_key) returning id into v_id;
  insert into public.squad_config (squad_id, code, config) values (v_id, v_code, v_config);
  return query select v_code, v_key, v_config;
end;
$$;

create or replace function public.get_squad(p_code text)
returns table (code text, name text, config jsonb, updated_at timestamptz)
language sql security definer set search_path = public stable
as $$
  select s.code, s.name, c.config, c.updated_at
  from public.squads s join public.squad_config c on c.squad_id = s.id
  where s.code = upper(trim(p_code));
$$;

create or replace function public.update_squad_config(p_code text, p_coach_key text, p_config jsonb)
returns table (config jsonb, updated_at timestamptz)
language plpgsql security definer set search_path = public
as $$
declare
  v_id uuid;
begin
  select id into v_id from public.squads where code = upper(trim(p_code)) and coach_key = p_coach_key;
  if v_id is null then
    raise exception 'unauthorized';
  end if;
  update public.squad_config set config = p_config, updated_at = now() where squad_id = v_id;
  return query select c.config, c.updated_at from public.squad_config c where c.squad_id = v_id;
end;
$$;

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
  insert into public.results (squad_id, code, athlete, game, difficulty, score, accuracy, mean_rt_ms, trials, duration_ms, params)
  values (v_id, upper(trim(p_code)), trim(p_athlete), p_game, p_difficulty, p_score, p_accuracy, p_mean_rt_ms, p_trials, p_duration_ms, coalesce(p_params, '{}'::jsonb))
  returning id into v_result;
  return v_result;
end;
$$;

create or replace function public.list_results(p_code text, p_coach_key text, p_limit int default 200)
returns setof public.results
language sql security definer set search_path = public stable
as $$
  select r.* from public.results r
  join public.squads s on s.id = r.squad_id
  where s.code = upper(trim(p_code)) and s.coach_key = p_coach_key
  order by r.created_at desc
  limit least(coalesce(p_limit, 200), 1000);
$$;

revoke all on function public.create_squad(text) from public;
revoke all on function public.get_squad(text) from public;
revoke all on function public.update_squad_config(text, text, jsonb) from public;
revoke all on function public.submit_result(text, text, text, int, int, numeric, int, int, int, jsonb) from public;
revoke all on function public.list_results(text, text, int) from public;
grant execute on function public.create_squad(text) to anon, authenticated;
grant execute on function public.get_squad(text) to anon, authenticated;
grant execute on function public.update_squad_config(text, text, jsonb) to anon, authenticated;
grant execute on function public.submit_result(text, text, text, int, int, numeric, int, int, int, jsonb) to anon, authenticated;
grant execute on function public.list_results(text, text, int) to anon, authenticated;

alter publication supabase_realtime add table public.squad_config;
