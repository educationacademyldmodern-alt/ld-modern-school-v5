-- Read-only: use only if production still reports stack depth / SQLSTATE 54001.
-- This exposes schema logic, not student records or passwords.
select c.relname as table_name,t.tgname,pg_get_triggerdef(t.oid) as trigger_definition,
 p.proname,pg_get_functiondef(p.oid) as function_definition
from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace
join pg_proc p on p.oid=t.tgfoid
where not t.tgisinternal and ((n.nspname='public' and c.relname in ('profiles','staff','teacher_profiles','teacher_class_assignments','teacher_subject_assignments')) or (n.nspname='auth' and c.relname='users'))
order by n.nspname,c.relname,t.tgname;
select schemaname,tablename,policyname,cmd,qual,with_check from pg_policies
where schemaname='public' and tablename in ('profiles','staff','teacher_profiles','teacher_class_assignments','teacher_subject_assignments');
select p.proname,p.prosecdef,p.proconfig,pg_get_functiondef(p.oid) from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public' and p.proname in ('my_role','role_in','v64_is_admin','v64_teacher_has_class','handle_new_user');
