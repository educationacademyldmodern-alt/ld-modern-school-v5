BEGIN;
-- V463 repair. No change to recorded marks, attendance, fees or payroll.
CREATE TABLE IF NOT EXISTS public.ldm_leave_rate460(
 teacher_id uuid REFERENCES public.teacher_profiles(id), month_start date CHECK(extract(day FROM month_start)=1),
 daily_rate numeric(10,2) NOT NULL CHECK(daily_rate>=0), PRIMARY KEY(teacher_id,month_start)
);
ALTER TABLE public.ldm_leave_rate460 ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.ldm_leave_rate460 FROM PUBLIC,anon,authenticated;
CREATE OR REPLACE FUNCTION public.ldm_staff_preview464(p_teacher uuid,p_month date,p_set_rate numeric DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE t public.teacher_profiles%ROWTYPE; is_admin boolean; rate numeric; days jsonb; salary jsonb; m date:=date_trunc('month',p_month)::date; linked boolean; scan_days jsonb:='{}'; warning text:='';
BEGIN
 SELECT lower(role) IN ('admin','super_admin','principal') INTO is_admin FROM public.profiles WHERE id=auth.uid() AND lower(coalesce(status,'active'))='active' AND lower(role) IN ('teacher','admin','super_admin','principal');
 IF is_admin IS NULL OR p_month IS NULL THEN RAISE EXCEPTION 'Active school account required' USING ERRCODE='42501'; END IF;
 SELECT * INTO STRICT t FROM public.teacher_profiles WHERE id=p_teacher AND (is_admin OR (auth_user_id=auth.uid() AND is_active IS TRUE AND lower(approval_status)='approved'));
 linked:=nullif(trim(t.employee_id),'') IS NOT NULL AND NOT EXISTS(SELECT FROM public.teacher_profiles x WHERE x.employee_id=t.employee_id AND x.id<>t.id);
 IF NOT linked THEN warning:='कर्मचारी ID खाली या एक से अधिक शिक्षकों पर दर्ज है। कर्मचारी रजिस्टर और पेरोल का मिलान बाकी है।';END IF;
 IF to_regclass('public.v65_teacher_attendance') IS NOT NULL AND t.auth_user_id IS NOT NULL THEN
 EXECUTE $lookup$
 SELECT coalesce(jsonb_object_agg(day,status ORDER BY stamp),'{}'::jsonb) FROM (
 SELECT coalesce(j->>'attendance_date',j->>'att_date',j->>'date',left(j->>'check_in_at',10)) AS day,
 coalesce(nullif(j->>'status',''),'Present') AS status,coalesce(j->>'updated_at',j->>'check_in_at','') AS stamp
 FROM public.v65_teacher_attendance a CROSS JOIN LATERAL (SELECT to_jsonb(a) j) x
 WHERE coalesce(j->>'teacher_user_id',j->>'auth_user_id',j->>'user_id',j->>'teacher_auth_user_id')=$1::text
 ) d WHERE day>=to_char($2,'YYYY-MM-DD') AND day<to_char($2+interval '1 month','YYYY-MM-DD')
 $lookup$ INTO scan_days USING t.auth_user_id,m;
 END IF;
 IF p_set_rate IS NOT NULL THEN
  IF NOT is_admin OR p_set_rate<0 OR p_set_rate::text IN ('NaN','Infinity') THEN RAISE EXCEPTION 'Valid Admin rate required';END IF;
  INSERT INTO public.ldm_leave_rate460 VALUES(t.id,m,p_set_rate) ON CONFLICT(teacher_id,month_start) DO UPDATE SET daily_rate=excluded.daily_rate;
 END IF;
 SELECT daily_rate INTO rate FROM public.ldm_leave_rate460 WHERE teacher_id=t.id AND month_start=m;
 SELECT jsonb_agg(jsonb_build_object('date',day,'open',is_open,'calendar',label,'status',att,'leave',approved,'deduction',CASE WHEN NOT is_open OR NOT approved THEN 0 ELSE rate END) ORDER BY day)
 INTO days FROM (
 SELECT d::date AS day,coalesce(h.is_working_day,extract(isodow FROM d)<>7) AS is_open,coalesce(h.holiday_name,'') AS label,
 coalesce((SELECT a.status FROM public.staff_attendance a WHERE linked AND a.employee_id=t.employee_id AND a.date=d::date ORDER BY a.created_at DESC,a.id DESC LIMIT 1),scan_days->>to_char(d,'YYYY-MM-DD')) AS att,
 EXISTS(SELECT FROM public.leave l WHERE linked AND l.employee_id=t.employee_id AND lower(trim(l.status)) IN ('approved','accepted') AND d::date BETWEEN l.from_date AND l.to_date) AS approved
 FROM generate_series(m::timestamp,(m+interval '1 month - 1 day')::timestamp,interval '1 day') d
 LEFT JOIN public.school_holidays h ON h.holiday_date=d::date) q;
 IF to_regclass('public.payroll') IS NULL THEN salary:='[]';warning:=concat_ws(' ',warning,'पेरोल तालिका उपलब्ध नहीं है।'); ELSE
 SELECT coalesce(jsonb_agg(jsonb_build_object('month',p.month,'net',p.net_salary,'deduction',p.deduction,'status',p.status)),'[]') INTO salary FROM public.payroll p WHERE linked AND p.employee_id=t.employee_id AND p.month=to_char(m,'YYYY-MM'); END IF;
 RETURN jsonb_build_object('warning',warning,'name',t.teacher_name,'employee',t.employee_id,'rate',rate,'days',days,'payroll',salary);
END $$;
REVOKE ALL ON FUNCTION public.ldm_staff_preview464(uuid,date,numeric) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.ldm_staff_preview464(uuid,date,numeric) TO authenticated;

CREATE OR REPLACE FUNCTION public.ldm_aw_registry() RETURNS jsonb LANGUAGE sql IMMUTABLE SET search_path=pg_catalog AS $$ SELECT '{"routes": ["v90_attendance_monitor", "attendance_conflict_center", "v90_exam_monitor", "v90_marks_monitor", "v90_transport_monitor", "v90_presence_monitor", "v90_student_requests", "v90_teacher_requests", "timetable_master", "v90_teaching_monitor", "academic_monitor", "master_gate_pass", "v91_parent_updates", "v92_admit_publish", "parent_access"], "rules": {"v90_attendance_monitor": {"students": ["read"], "attendance": ["read"], "staff_attendance": ["read"]}, "attendance_conflict_center": {"students": ["read"], "attendance": ["read"]}, "v90_exam_monitor": {"students": ["read"], "v69_exam_master": ["read"], "v69_exam_classes": ["read"], "v69_admit_card_controls": ["read"], "v90_exam_attendance": ["read", "write", "edit"]}, "v90_marks_monitor": {"students": ["read"], "student_marks": ["read"], "v90_marks_check_status": ["read"], "academics": ["read"]}, "v90_transport_monitor": {"students": ["read"], "transport": ["read"], "v90_transport_trip_attendance": ["read", "write", "edit"]}, "v90_presence_monitor": {"students": ["read"], "attendance": ["read"], "staff_attendance": ["read"], "leave": ["read"], "student_leave_requests": ["read"]}, "v90_student_requests": {"students": ["read"], "student_leave_requests": ["read"], "student_correction_requests": ["read"], "student_roster_requests": ["read"]}, "v90_teacher_requests": {"students": ["read"], "v90_teacher_requests": ["read", "approve"], "student_roster_requests": ["read"], "leave": ["read"]}, "timetable_master": {"students": ["read"], "academics": ["read"], "timetable": ["read"], "v763_bell_time_master": ["read", "global"]}, "v90_teaching_monitor": {"students": ["read"], "timetable": ["read"], "teaching_diary": ["read"]}, "academic_monitor": {"students": ["read"], "timetable": ["read"], "teaching_diary": ["read"], "syllabus_master": ["read"], "ldm_v265_copy_checks": ["read"], "ldm_v265_bell_tests": ["read"], "ldm_v265_principal_audits": ["read"]}, "master_gate_pass": {"students": ["read"], "v102_student_gate_pass": ["read"]}, "v91_parent_updates": {"students": ["read"], "student_correction_requests": ["read"]}, "v92_admit_publish": {"students": ["read"], "v69_exam_master": ["read"], "v69_exam_classes": ["read"], "v69_admit_card_controls": ["read"], "v92_admit_publication_controls": ["read"]}, "parent_access": {"students": ["read"]}}, "permissions": {"v90_attendance_monitor": ["read", "staff"], "attendance_conflict_center": ["read", "approve"], "v90_exam_monitor": ["read", "write", "edit"], "v90_marks_monitor": ["read"], "v90_transport_monitor": ["read", "write", "edit"], "v90_presence_monitor": ["read", "staff"], "v90_student_requests": ["read", "approve"], "v90_teacher_requests": ["read", "approve", "staff"], "timetable_master": ["read", "write", "edit", "global"], "v90_teaching_monitor": ["read"], "academic_monitor": ["read", "write", "edit", "approve"], "master_gate_pass": ["read", "write", "edit", "approve"], "v91_parent_updates": ["read", "approve"], "v92_admit_publish": ["read", "approve"], "parent_access": ["read"]}}'::jsonb $$;

ALTER TABLE public.timetable ADD COLUMN IF NOT EXISTS teacher_profile_id uuid;
-- A legacy name can be resolved only when exactly one teacher master matches it.
CREATE OR REPLACE FUNCTION public.ldm_teacher_bells460()
RETURNS SETOF public.timetable LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT t.* FROM public.timetable t
 JOIN public.teacher_profiles me ON me.auth_user_id=auth.uid() AND lower(me.approval_status)='approved' AND me.is_active IS TRUE
 JOIN public.profiles p ON p.id=auth.uid() AND lower(p.role)='teacher' AND lower(coalesce(p.status,'active'))='active'
 WHERE t.teacher_profile_id=me.id OR (t.teacher_profile_id IS NULL AND lower(btrim(t.teacher_name))=lower(btrim(me.teacher_name))
 AND NOT EXISTS(SELECT FROM public.teacher_profiles other WHERE other.id<>me.id AND lower(btrim(other.teacher_name))=lower(btrim(me.teacher_name))))
 ORDER BY t.period_no
$$;
REVOKE ALL ON FUNCTION public.ldm_teacher_bells460() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.ldm_teacher_bells460() TO authenticated;
-- Keep the installed central permissions and row-revision checks.
CREATE OR REPLACE FUNCTION public.ldm_teacher_exam464(p_paper uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog,public AS $$
DECLARE result jsonb; meta jsonb;
BEGIN
 result:=public.ldm_v320_exam_load(p_paper);
 meta:=result->'paper';
 RETURN jsonb_set(result,'{rows}',coalesce((SELECT jsonb_agg(r ORDER BY ord)
 FROM jsonb_array_elements(result->'rows') WITH ORDINALITY e(r,ord)
 WHERE public.ldm_marks_row_teacher_allowed(coalesce(meta->>'academic_session',meta->>'session'),meta->>'class_name',meta->>'subject_name',r->>'admission_no')),'[]'));
END $$;
CREATE OR REPLACE FUNCTION public.ldm_teacher_save464(p_paper uuid,p_action text,p_rows jsonb,p_max numeric,p_revision integer,p_request uuid,p_reason text)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog,public AS $$
DECLARE permitted jsonb;
BEGIN
 IF p_action IS DISTINCT FROM 'marks' OR jsonb_typeof(p_rows) IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'Invalid marks request'; END IF;
 permitted:=public.ldm_teacher_exam464(p_paper);
 IF EXISTS(SELECT FROM jsonb_array_elements(p_rows) e WHERE NOT EXISTS(SELECT FROM jsonb_array_elements(permitted->'rows') r WHERE r->>'student_id'=e->>'student_id')) THEN RAISE EXCEPTION 'Student outside assigned class or section' USING ERRCODE='42501';END IF;
 PERFORM public.ldm_v320_exam_save(p_paper,p_action,p_rows,p_max,p_revision,p_request,p_reason);
 RETURN public.ldm_teacher_exam464(p_paper);
END $$;
REVOKE ALL ON FUNCTION public.ldm_teacher_exam464(uuid),public.ldm_teacher_save464(uuid,text,jsonb,numeric,integer,uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.ldm_teacher_exam464(uuid),public.ldm_teacher_save464(uuid,text,jsonb,numeric,integer,uuid,text) TO authenticated;
NOTIFY pgrst,'reload schema';
COMMIT;
