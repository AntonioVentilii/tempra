-- Reject a null or non-object config instead of tripping the not-null
-- constraint with an opaque error.
-- Applied to project znhomweyvdkkhvgcnvdc on 2026-10-24 as `update_squad_config_validation`.
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
  select id into v_id from public.squads where code = upper(trim(p_code)) and coach_key = p_coach_key;
  if v_id is null then
    raise exception 'unauthorized';
  end if;
  update public.squad_config set config = p_config, updated_at = now() where squad_id = v_id;
  return query select c.config, c.updated_at from public.squad_config c where c.squad_id = v_id;
end;
$$;
