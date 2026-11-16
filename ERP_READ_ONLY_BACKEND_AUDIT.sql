-- Read-only metadata audit. NOT EXECUTED. No student records or function bodies returned.
BEGIN TRANSACTION READ ONLY;
SELECT n.nspname AS schema_name, p.proname, pg_get_function_identity_arguments(p.oid) AS arguments,
       p.prosecdef AS security_definer, p.proconfig AS function_settings, p.proacl AS privileges
FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname='public' AND p.proname IN
('ldm_fee_due_snapshot_v2','ldm_fee_set_due_target_v3','ldm_v320_exam_load','ldm_v320_exam_save',
 'ldm_get_student_qr','ldm_storage_can_delete','ldm_v398_bootstrap','ldm_v267_teacher_academic_summary')
ORDER BY p.proname,arguments;
SELECT n.nspname AS schema_name,c.relname,c.relrowsecurity,c.relforcerowsecurity
FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' AND c.relkind IN ('r','p') AND c.relname IN
('students','student_marks','teacher_profiles','staff','student_fee_settings','ldm_fee_balance_adjustments','teaching_diary');
SELECT schemaname,tablename,policyname,permissive,roles,cmd,qual,with_check
FROM pg_policies WHERE schemaname='public' AND tablename IN
('students','student_marks','teacher_profiles','staff','student_fee_settings','ldm_fee_balance_adjustments','teaching_diary');
SELECT schemaname,tablename,indexname,indexdef FROM pg_indexes
WHERE schemaname='public' AND tablename IN
('student_marks','student_fee_settings','ldm_fee_balance_adjustments','teacher_profiles');
ROLLBACK;
