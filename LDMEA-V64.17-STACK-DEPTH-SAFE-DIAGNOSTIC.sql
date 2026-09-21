-- L D MODERN EDUCATION ACADEMY
-- V64.17 STACK DEPTH SAFE DIAGNOSTIC
-- READ ONLY: this file changes no data, trigger, policy or schema.

-- Staff triggers and their functions
SELECT
  n.nspname AS schema_name,
  c.relname AS table_name,
  t.tgname AS trigger_name,
  pg_get_triggerdef(t.oid, true) AS trigger_definition,
  p.proname AS function_name,
  pg_get_functiondef(p.oid) AS function_definition
FROM pg_trigger t
JOIN pg_class c ON c.oid=t.tgrelid
JOIN pg_namespace n ON n.oid=c.relnamespace
JOIN pg_proc p ON p.oid=t.tgfoid
WHERE NOT t.tgisinternal
  AND n.nspname='public'
  AND c.relname IN ('staff','teacher_profiles')
ORDER BY c.relname,t.tgname;

-- Staff / teacher RLS policies
SELECT schemaname,tablename,policyname,permissive,roles,cmd,qual,with_check
FROM pg_policies
WHERE schemaname='public'
  AND tablename IN ('staff','teacher_profiles')
ORDER BY tablename,policyname;

-- Foreign keys involving staff / teacher_profiles
SELECT
  tc.table_name, tc.constraint_name, tc.constraint_type,
  kcu.column_name,
  ccu.table_name AS referenced_table,
  ccu.column_name AS referenced_column
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu
 ON tc.constraint_name=kcu.constraint_name AND tc.table_schema=kcu.table_schema
LEFT JOIN information_schema.constraint_column_usage ccu
 ON tc.constraint_name=ccu.constraint_name AND tc.table_schema=ccu.table_schema
WHERE tc.table_schema='public'
 AND (tc.table_name IN ('staff','teacher_profiles')
      OR ccu.table_name IN ('staff','teacher_profiles'))
ORDER BY tc.table_name,tc.constraint_name;
