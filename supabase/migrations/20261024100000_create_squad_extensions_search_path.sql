-- Supabase installs pgcrypto in the `extensions` schema; with search_path
-- pinned to `public` alone, gen_random_bytes() was not found and create_squad
-- failed. Qualify the call explicitly.
-- Applied to project znhomweyvdkkhvgcnvdc on 2026-10-24 as `create_squad_extensions_search_path`.
create or replace function public.create_squad(p_name text)
returns table (code text, coach_key text, config jsonb)
language plpgsql security definer set search_path = public
as $$
declare
  v_code text := public.gen_squad_code();
  v_key text := encode(extensions.gen_random_bytes(18), 'hex');
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
