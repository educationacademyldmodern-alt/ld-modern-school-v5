-- L D MODERN EDUCATION ACADEMY
-- FINAL TEACHER CANONICAL STABILITY MIGRATION — 2026-09-23
-- Purpose: ONE Teacher ID source + ONE V2 mapping/login path.
-- Safe rule: does NOT delete teacher history, attendance, timetable, assignments or existing staff rows.
-- Run AFTER LDMEA-TEACHER-V2-FINAL-SAFE-MIGRATION-2026-09-23.sql.

begin;

-- Serialize teacher number allocation across concurrent Admin saves.
create or replace function public.ldmea_teacher_canonical_code()
returns text language plpgsql security definer set search_path=public,pg_temp as $$
declare c text;
begin
  perform pg_advisory_xact_lock(hashtext('LDMEA_TEACHER_CANONICAL_ID'));
  loop
    c := public.teacher_v2_next_code();
    exit when not exists(select 1 from public.staff where employee_id=c)
              and not exists(select 1 from public.teacher_v2_master where teacher_code=c or employee_id=c);
  end loop;
  return c;
end $$;

-- Final BEFORE INSERT guard. PostgreSQL fires same-event triggers by name; zzz_ makes this
-- the final ID normalization guard even when an older legacy trigger is still installed.
create or replace function public.ldmea_staff_teacher_id_final_guard()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin
  if lower(coalesce(new.staff_type,'')) in ('teaching','teacher')
     or lower(coalesce(new.designation,'')) like '%teacher%' then
    if new.employee_id is null or btrim(new.employee_id)='' or new.employee_id !~ '^TCH-[0-9]{4}-[0-9]{4,}$' then
      new.employee_id := public.ldmea_teacher_canonical_code();
    end if;
  end if;
  return new;
end $$;

do $$ begin
  if to_regclass('public.staff') is not null then
    drop trigger if exists zzz_ldmea_teacher_id_final_guard on public.staff;
    create trigger zzz_ldmea_teacher_id_final_guard
      before insert on public.staff
      for each row execute function public.ldmea_staff_teacher_id_final_guard();
  end if;
end $$;

-- Normalize V2 master from the linked teacher profile/staff without renumbering historical staff.
-- Existing V2 teacher_code is preserved; missing V2 codes receive the canonical next serial.
do $$
declare r record; code text; mob text;
begin
  if to_regclass('public.teacher_v2_master') is null then
    raise exception 'teacher_v2_master missing: run LDMEA-TEACHER-V2-FINAL-SAFE-MIGRATION-2026-09-23.sql first';
  end if;
  for r in select id,teacher_code,employee_id,mobile from public.teacher_v2_master order by created_at,id loop
    code:=nullif(btrim(r.teacher_code),'');
    if code is null then code:=public.ldmea_teacher_canonical_code(); end if;
    mob:=public.teacher_v2_normalize_mobile(r.mobile);
    update public.teacher_v2_master
       set teacher_code=code,
           mobile=mob,
           updated_at=now()
     where id=r.id;
  end loop;
end $$;

-- Active mobile must resolve to one Teacher only. We do not delete duplicates: conflicting
-- rows are left visible for Admin correction and resolver returns AMBIGUOUS_MOBILE.
create index if not exists teacher_v2_active_mobile_lookup
  on public.teacher_v2_master((public.teacher_v2_normalize_mobile(mobile)))
  where is_active and login_enabled and mobile is not null;

commit;
notify pgrst,'reload schema';
