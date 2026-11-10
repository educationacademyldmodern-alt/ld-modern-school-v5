-- LD Modern School ERP V505 - BACKEND READ-ONLY AUDIT
-- SAFE: single SELECT, no UPDATE/INSERT/DELETE/DDL or privilege change.
-- Run in Supabase SQL Editor if full marks/edit/assignment access needs verification.
-- Do not treat FOUND function names as proof that a teacher has the correct RLS access.
WITH required(func) AS (
 VALUES
 ('ldm_v320_exam_list'),('ldm_v320_exam_load'),('ldm_v320_exam_save'),
 ('ldm_marks_sync471'),('ldm_teacher_list471'),('ldm_teacher_load471'),
 ('ldm_teacher_exam_action475'),('ldm_work403_read'),('ldm_work403_write'),
 ('ldm_work403_history'),('ldm_work_change461_save'),
 ('ldm_work_progress461'),('ldm_weekly_work461')
), f AS (
 SELECT r.func,
        coalesce(jsonb_agg(jsonb_build_object(
          'signature',pg_get_function_identity_arguments(p.oid),
          'security_definer',p.prosecdef,
          'authenticated_can_execute',has_function_privilege('authenticated',p.oid,'EXECUTE')
        )) FILTER (WHERE p.oid IS NOT NULL),'[]'::jsonb) AS definitions
 FROM required r
 LEFT JOIN pg_namespace n ON n.nspname='public'
 LEFT JOIN pg_proc p ON p.pronamespace=n.oid AND p.proname=r.func
 GROUP BY r.func
), policies AS (
 SELECT tablename,count(*) AS total
 FROM pg_policies
 WHERE schemaname='public' AND tablename IN
  ('students','student_marks','timetable','teaching_diary','marks_check_status')
 GROUP BY tablename
)
SELECT jsonb_pretty(jsonb_build_object(
 'purpose','V505 read-only SQL audit; no database change',
 'functions',(SELECT jsonb_agg(jsonb_build_object(
  'function_name',func,'status',CASE WHEN jsonb_array_length(definitions)>0 THEN 'FOUND' ELSE 'MISSING' END,
  'definitions',definitions) ORDER BY func) FROM f),
 'policies',(SELECT coalesce(jsonb_agg(jsonb_build_object('table',tablename,'count',total) ORDER BY tablename),'[]'::jsonb) FROM policies),
 'warning','Actual Max Marks update and assigned-module permissions require role-specific backend testing; not proven by this report'
)) AS v505_backend_read_only_report;
