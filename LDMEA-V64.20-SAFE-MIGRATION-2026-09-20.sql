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
