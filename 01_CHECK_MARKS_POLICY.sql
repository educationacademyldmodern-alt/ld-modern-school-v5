-- READ ONLY: inspect teacher marks security before changing any policy
SELECT policyname,cmd,roles,qual,with_check
FROM pg_policies WHERE schemaname='public' AND tablename='student_marks'
ORDER BY policyname;
SELECT column_name,data_type FROM information_schema.columns
WHERE table_schema='public' AND table_name IN ('student_marks','teacher_profiles','teacher_subjects')
ORDER BY table_name,ordinal_position;
