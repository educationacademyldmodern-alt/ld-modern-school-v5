-- L D MODERN EDUCATION ACADEMY
-- V64.19 SAFE / IDEMPOTENT SUPPORT MIGRATION
-- Non-destructive: no DROP TABLE, TRUNCATE, DELETE, or data reset.

-- Helpful lookup indexes used by central student / teacher / parent resolution.
DO $$ BEGIN
  IF to_regclass('public.students') IS NOT NULL THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_v6419_students_admission_no ON public.students(admission_no)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_v6419_students_class_name ON public.students(class_name)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_v6419_students_parent_email_lower ON public.students(lower(parent_email)) WHERE parent_email IS NOT NULL';
  END IF;
  IF to_regclass('public.teacher_profiles') IS NOT NULL THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_v6419_teacher_profiles_auth_user ON public.teacher_profiles(auth_user_id)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_v6419_teacher_profiles_employee ON public.teacher_profiles(employee_id)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_v6419_teacher_profiles_email_lower ON public.teacher_profiles(lower(email)) WHERE email IS NOT NULL';
  END IF;
END $$;

-- Read-only recursion audit. Review returned definitions before changing any production trigger/RLS policy.
SELECT n.nspname AS schema_name,c.relname AS table_name,t.tgname AS trigger_name,
       pg_get_triggerdef(t.oid,true) AS trigger_definition,p.proname AS function_name,
       pg_get_functiondef(p.oid) AS function_definition
FROM pg_trigger t
JOIN pg_class c ON c.oid=t.tgrelid
JOIN pg_namespace n ON n.oid=c.relnamespace
JOIN pg_proc p ON p.oid=t.tgfoid
WHERE NOT t.tgisinternal AND n.nspname='public'
  AND c.relname IN ('profiles','staff','teacher_profiles','students')
ORDER BY c.relname,t.tgname;

SELECT schemaname,tablename,policyname,permissive,roles,cmd,qual,with_check
FROM pg_policies
WHERE schemaname='public' AND tablename IN ('profiles','staff','teacher_profiles','students')
ORDER BY tablename,policyname;

NOTIFY pgrst, 'reload schema';
SELECT 'V64.19 SAFE SUPPORT MIGRATION COMPLETE — inspect the diagnostic result before any trigger/RLS repair' AS status;

-- V64.22: Fast manual due master + safe system teacher ID support.
create table if not exists public.student_fee_settings(
  id uuid primary key default gen_random_uuid(),
  admission_no text not null,
  academic_session text not null,
  monthly_fee numeric not null default 0,
  updated_at timestamptz not null default now(),
  unique(admission_no, academic_session)
);
create table if not exists public.v6421_manual_due(
  id uuid primary key default gen_random_uuid(),
  admission_no text not null,
  academic_session text not null,
  due_month text not null,
  due_amount numeric not null default 0,
  updated_at timestamptz not null default now(),
  unique(admission_no, academic_session, due_month)
);
create index if not exists idx_v6421_manual_due_adm_session on public.v6421_manual_due(admission_no,academic_session);

do $$ begin
 if to_regclass('public.staff') is not null then
   alter table public.staff add column if not exists employee_id text;
   create unique index if not exists staff_employee_id_unique_nonblank on public.staff(employee_id) where employee_id is not null and btrim(employee_id)<>'';
 end if;
end $$;

create or replace function public.ldmea_staff_auto_employee_id() returns trigger language plpgsql as $$
begin
 if new.employee_id is null or btrim(new.employee_id)='' or upper(btrim(new.employee_id))='AUTO' then
   new.employee_id := 'EMP-' || to_char(clock_timestamp(),'YYMMDD') || '-' || upper(substr(md5(gen_random_uuid()::text),1,6));
 end if;
 return new;
end $$;
do $$ begin
 if to_regclass('public.staff') is not null and not exists(select 1 from pg_trigger where tgname='trg_ldmea_staff_auto_employee_id') then
   execute 'create trigger trg_ldmea_staff_auto_employee_id before insert on public.staff for each row execute function public.ldmea_staff_auto_employee_id()';
 end if;
end $$;
notify pgrst, 'reload schema';

-- ===== V64.22 FINAL REQUIREMENT PATCH =====
-- Multi-class teacher compatibility + due master compatibility. Non-destructive / re-runnable.
DO $$ BEGIN
  IF to_regclass('public.teacher_profiles') IS NOT NULL THEN
    ALTER TABLE public.teacher_profiles ADD COLUMN IF NOT EXISTS requested_classes text[] DEFAULT '{}'::text[];
    ALTER TABLE public.teacher_profiles ADD COLUMN IF NOT EXISTS requested_subjects text[] DEFAULT '{}'::text[];
    ALTER TABLE public.teacher_profiles ADD COLUMN IF NOT EXISTS password_created boolean NOT NULL DEFAULT false;
    ALTER TABLE public.teacher_profiles ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
    ALTER TABLE public.teacher_profiles ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
    ALTER TABLE public.teacher_profiles ADD COLUMN IF NOT EXISTS employee_id text;
    CREATE UNIQUE INDEX IF NOT EXISTS teacher_profiles_employee_id_unique_nonblank ON public.teacher_profiles(employee_id) WHERE employee_id IS NOT NULL AND btrim(employee_id)<>'';
  END IF;
  IF to_regclass('public.teacher_class_assignments') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS idx_v6422_teacher_class_active ON public.teacher_class_assignments(teacher_profile_id,class_name,is_active);
  END IF;
END $$;
CREATE OR REPLACE FUNCTION public.ldmea_teacher_profile_auto_employee_id() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW.employee_id IS NULL OR btrim(NEW.employee_id)='' OR upper(btrim(NEW.employee_id))='AUTO' THEN
   NEW.employee_id := 'TCH-' || to_char(clock_timestamp(),'YYMMDD') || '-' || upper(substr(md5(gen_random_uuid()::text),1,6));
 END IF;
 RETURN NEW;
END $$;
DO $$ BEGIN
 IF to_regclass('public.teacher_profiles') IS NOT NULL AND NOT EXISTS(SELECT 1 FROM pg_trigger WHERE tgname='trg_ldmea_teacher_profile_auto_employee_id') THEN
   EXECUTE 'CREATE TRIGGER trg_ldmea_teacher_profile_auto_employee_id BEFORE INSERT ON public.teacher_profiles FOR EACH ROW EXECUTE FUNCTION public.ldmea_teacher_profile_auto_employee_id()';
 END IF;
END $$;
DO $$ BEGIN
 IF to_regclass('public.teacher_profiles') IS NOT NULL THEN
   UPDATE public.teacher_profiles SET employee_id='TCH-'||upper(substr(md5(id::text),1,10)) WHERE employee_id IS NULL OR btrim(employee_id)='';
 END IF;
END $$;
NOTIFY pgrst, 'reload schema';
SELECT 'V64.22 FINAL REQUIREMENT PATCH COMPLETE' AS status;
