-- V496: Make Admin Dashboard function routes assignable by Admin.
-- Access is tied to an exact active assignment and the assigned work date.
-- This changes the delegation allowlist only; it does not change user roles.
begin;

create or replace function public.ldm_v278_route_ready(p_route text)
returns boolean
language sql
immutable
as $$
 select btrim(coalesce(p_route,'')) = any(array[
  'attendance','master_attendance','teacher_bells','v90_teacher_daily','homework',
  'academic_monitor','v90_teacher_marks','exams','teacher_notices','gallery','my_notes',
  'class_opinions','v91_student_photos','v143_teacher_qr_attendance','master_gate_pass',
  'v66_programs','staff','expenses','reports','notice_order_center','settings',
  'class_teacher_control','v150_student_master','v6422_due_master','idcard_center',
  'certificate_center','v147_admin_presence','v130_qr_scanner','v147_admin_student_qr',
  'v130_storage','v90_attendance_monitor','attendance_conflict_center','v90_exam_monitor',
  'v90_marks_monitor','v90_transport_monitor','v90_presence_monitor','v90_student_requests',
  'v90_teacher_requests','timetable_master','v90_teaching_monitor','v91_parent_updates',
  'v92_admit_publish','parent_access','v185_admin_activities','notices','events',
  'fee_dashboard','smart_fee_center','students','admissions','v200_due_fee_report'
 ]::text[])
$$;

create or replace function public.ldm_v272_route_ready(p_route text)
returns boolean
language sql
immutable
as $$ select public.ldm_v278_route_ready(p_route) $$;

revoke all on function public.ldm_v278_route_ready(text) from public;
revoke all on function public.ldm_v272_route_ready(text) from public;
grant execute on function public.ldm_v278_route_ready(text) to authenticated;
grant execute on function public.ldm_v272_route_ready(text) to authenticated;

commit;
