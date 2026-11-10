-- V500: READ-ONLY DIAGNOSTICS ONLY. Do not run as a migration.
-- Run in your authorized Supabase SQL editor to inspect schema / RLS (no data change).
select table_schema,table_name from information_schema.tables
 where table_schema='public' and table_name in ('students','teacher_profiles','teaching_diary','timetable','v90_marks_check_status','student_marks')
 order by table_name;
select p.proname as rpc_name, pg_get_function_identity_arguments(p.oid) as signature
 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
 where n.nspname='public' and p.proname in ('ldm_teacher_list471','ldm_teacher_load471','ldm_teacher_exam_action475','ldm_marks_sync471','ldm_v320_exam_list','ldm_v320_exam_load','ldm_v320_exam_save') order by 1;
select schemaname,tablename,policyname,cmd,roles,qual,with_check
 from pg_policies where schemaname='public' and tablename in ('students','timetable','teaching_diary','v90_marks_check_status','student_marks') order by tablename,policyname;
-- This document makes no alterations to RLS, grants or operational records.
