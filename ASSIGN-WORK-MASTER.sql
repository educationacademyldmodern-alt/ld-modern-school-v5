-- L D MODERN EDUCATION ACADEMY: ASSIGN WORK ONLY
-- Back up the database/schema first. Apply to staging and verify before production.
-- Rerun-safe; no student/fee data deletion; no global role upgrade.
BEGIN;
ALTER TABLE public.ldm_work403_meta ADD COLUMN IF NOT EXISTS scope_class text NOT NULL DEFAULT '';
ALTER TABLE public.ldm_work403_meta ADD COLUMN IF NOT EXISTS scope_section text NOT NULL DEFAULT '';
ALTER TABLE public.ldm_work403_meta ADD COLUMN IF NOT EXISTS scope_subject text NOT NULL DEFAULT '';
ALTER TABLE public.ldm_work403_meta ADD COLUMN IF NOT EXISTS aw_scoped boolean NOT NULL DEFAULT false;
ALTER TABLE public.ldm_work403_meta ADD COLUMN IF NOT EXISTS aw_permissions text[] NOT NULL DEFAULT '{}';

CREATE OR REPLACE FUNCTION public.ldm_aw_registry() RETURNS jsonb LANGUAGE sql IMMUTABLE SET search_path=pg_catalog AS $$ SELECT '{"routes": ["v90_attendance_monitor", "attendance_conflict_center", "v90_exam_monitor", "v90_marks_monitor", "v90_transport_monitor", "v90_presence_monitor", "v90_student_requests", "v90_teacher_requests", "timetable_master", "v90_teaching_monitor", "academic_monitor", "master_gate_pass", "v91_parent_updates", "v92_admit_publish", "parent_access"], "rules": {"v90_attendance_monitor": {"students": ["read"], "attendance": ["read"], "staff_attendance": ["read"]}, "attendance_conflict_center": {"students": ["read"], "attendance": ["read"]}, "v90_exam_monitor": {"students": ["read"], "v69_exam_master": ["read"], "v69_exam_classes": ["read"], "v69_admit_card_controls": ["read"], "v90_exam_attendance": ["read", "write", "edit"]}, "v90_marks_monitor": {"students": ["read"], "student_marks": ["read"], "v90_marks_check_status": ["read"], "academics": ["read"]}, "v90_transport_monitor": {"students": ["read"], "transport": ["read"], "v90_transport_trip_attendance": ["read", "write", "edit"]}, "v90_presence_monitor": {"students": ["read"], "attendance": ["read"], "staff_attendance": ["read"], "leave": ["read"], "student_leave_requests": ["read"]}, "v90_student_requests": {"students": ["read"], "student_leave_requests": ["read"], "student_correction_requests": ["read"], "student_roster_requests": ["read"]}, "v90_teacher_requests": {"students": ["read"], "v90_teacher_requests": ["read", "approve"], "student_roster_requests": ["read"], "leave": ["read"]}, "timetable_master": {"students": ["read"], "academics": ["read"], "timetable": ["read"], "v763_bell_time_master": ["read", "global"]}, "v90_teaching_monitor": {"students": ["read"], "timetable": ["read"], "teaching_diary": ["read"]}, "academic_monitor": {"students": ["read"], "timetable": ["read"], "teaching_diary": ["read"], "syllabus_master": ["read"], "ldm_v265_copy_checks": ["read"], "ldm_v265_bell_tests": ["read"], "ldm_v265_principal_audits": ["read"]}, "master_gate_pass": {"students": ["read"], "v102_student_gate_pass": ["read"]}, "v91_parent_updates": {"students": ["read"], "student_correction_requests": ["read"]}, "v92_admit_publish": {"students": ["read"], "v69_exam_master": ["read"], "v69_exam_classes": ["read"], "v69_admit_card_controls": ["read"], "v92_admit_publication_controls": ["read"]}, "parent_access": {"students": ["read"]}}, "permissions": {"v90_attendance_monitor": ["read", "staff"], "attendance_conflict_center": ["read", "approve"], "v90_exam_monitor": ["read", "write", "edit"], "v90_marks_monitor": ["read"], "v90_transport_monitor": ["read", "write", "edit"], "v90_presence_monitor": ["read", "staff"], "v90_student_requests": ["read", "approve"], "v90_teacher_requests": ["read", "approve", "staff"], "timetable_master": ["read", "write", "edit", "global"], "v90_teaching_monitor": ["read"], "academic_monitor": ["read", "write", "edit", "approve"], "master_gate_pass": ["read", "write", "edit", "approve"], "v91_parent_updates": ["read", "approve"], "v92_admit_publish": ["read", "approve"], "parent_access": ["read"]}}'::jsonb $$;

CREATE OR REPLACE FUNCTION public.ldm_aw_present() RETURNS boolean LANGUAGE sql STABLE SET search_path=pg_catalog AS $$
 SELECT coalesce(nullif(current_setting('request.headers',true),'')::jsonb->>'x-ldm-work-assignment','')<>'' $$;

CREATE OR REPLACE FUNCTION public.ldm_aw_context(p_assignment uuid DEFAULT NULL) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE ident uuid; result jsonb;
BEGIN
 BEGIN ident:=coalesce(p_assignment,nullif(nullif(current_setting('request.headers',true),'')::jsonb->>'x-ldm-work-assignment','')::uuid); EXCEPTION WHEN invalid_text_representation THEN RETURN NULL; END;
 IF ident IS NULL OR auth.uid() IS NULL THEN RETURN NULL; END IF;
 SELECT jsonb_build_object('assignment',a.id,'task',t.id,'route',t.module_route,'class',m.scope_class,'section',m.scope_section,'subject',m.scope_subject,'permissions',to_jsonb(m.aw_permissions)) INTO result
 FROM public.ldm_work_task_assignees a JOIN public.ldm_work_tasks t ON t.id=a.task_id JOIN public.ldm_work403_meta m ON m.task_id=t.id
 WHERE a.id=ident AND a.teacher_auth_user_id=auth.uid() AND a.is_active AND a.status NOT IN('removed','completed')
 AND t.is_active AND t.status NOT IN('cancelled','completed') AND m.aw_scoped AND NOT m.paused AND NOT m.archived
 AND coalesce(t.work_date,(now() AT TIME ZONE 'Asia/Kolkata')::date)<=(now() AT TIME ZONE 'Asia/Kolkata')::date
 AND (t.due_date IS NULL OR t.due_date>=(now() AT TIME ZONE 'Asia/Kolkata')::date)
 AND public.ldm_v398_admin(t.created_by)
 AND EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND lower(p.role)='teacher' AND lower(coalesce(p.status,'active'))='active')
 AND EXISTS(SELECT 1 FROM public.teacher_profiles tp WHERE tp.auth_user_id=auth.uid() AND tp.is_active IS DISTINCT FROM false AND tp.approval_status='Approved');
 RETURN result;
END $$;

CREATE OR REPLACE FUNCTION public.ldm_aw_scope(c jsonb,r jsonb,p_table text DEFAULT '') RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE cl text:=r->>'class_name';sec text:=r->>'section';sub text:=coalesce(r->>'subject',r->>'subject_name');st jsonb;
BEGIN
 IF c IS NULL THEN RETURN false; END IF;
 IF p_table='ldm_v265_principal_audits' AND coalesce(c->>'section','')<>'' THEN
 IF jsonb_array_length(coalesce(r->'sample_admission_nos','[]'::jsonb))=0 OR EXISTS(SELECT 1 FROM jsonb_array_elements_text(r->'sample_admission_nos') sample_adm WHERE NOT EXISTS(SELECT 1 FROM public.students sampled_student WHERE sampled_student.admission_no=sample_adm AND public.ldm_aw_scope(c,to_jsonb(sampled_student),'students'))) THEN RETURN false;END IF;
 sec:=c->>'section';
 END IF;
 IF p_table='ldm_v265_copy_checks' AND sec IS NULL THEN
 SELECT d.section INTO sec FROM public.teaching_diary d WHERE d.teacher_user_id::text=r->>'teacher_user_id' AND d.teaching_date::text=r->>'teaching_date' AND d.period_no::text=r->>'period_no' LIMIT 1;
 END IF;
 IF p_table<>'students' AND nullif(r->>'admission_no','') IS NOT NULL THEN
 SELECT to_jsonb(s) INTO st FROM public.students s WHERE s.admission_no=r->>'admission_no';
 IF st IS NULL THEN RETURN false; END IF;
 cl:=st->>'class_name';sec:=st->>'section';
 END IF;
 IF coalesce(c->>'class','')<>'' AND public.ldm_v265_norm_class(cl) IS DISTINCT FROM public.ldm_v265_norm_class(c->>'class') THEN RETURN false;END IF;
 IF coalesce(c->>'section','')<>'' AND lower(btrim(coalesce(sec,'')))<>lower(btrim(c->>'section')) THEN RETURN false;END IF;
 IF coalesce(c->>'subject','')<>'' AND (r?'subject' OR r?'subject_name') AND lower(btrim(coalesce(sub,'')))<>lower(btrim(c->>'subject')) THEN RETURN false;END IF;
 RETURN true;
END $$;

CREATE OR REPLACE FUNCTION public.ldm_aw_row(p_table text,r jsonb,p_action text,c jsonb) RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE allowed jsonb:=public.ldm_aw_registry()->'rules'->(c->>'route')->p_table;act text:=p_action;
BEGIN
 IF c IS NULL OR c IS DISTINCT FROM public.ldm_aw_context() OR NOT coalesce((c->'permissions')?'read',false) THEN RETURN false;END IF;
 IF p_table='v90_teacher_requests' AND act='edit' THEN act:='approve'; END IF;
 IF p_table='v763_bell_time_master' AND act IN('write','edit') THEN act:='global'; END IF;
 IF NOT coalesce(allowed?act,false) OR NOT coalesce((c->'permissions')?act,false) THEN RETURN false;END IF;
 IF p_table IN('staff_attendance','leave') AND (NOT ((c->'permissions')?'staff') OR coalesce(c->>'class','')<>'' OR coalesce(c->>'section','')<>'') THEN RETURN false;END IF;
 IF p_table IN('v69_exam_master','v763_bell_time_master') THEN RETURN act='read' OR ((c->'permissions')?'global' AND coalesce(c->>'class','')='' AND coalesce(c->>'section','')='' AND coalesce(c->>'subject','')='');END IF;
 IF p_table='v69_exam_classes' THEN RETURN public.ldm_aw_scope(c||jsonb_build_object('section',''),r,p_table);END IF;
 IF p_table IN('v90_transport_trip_attendance','v90_exam_attendance') AND act<>'read' AND (nullif(r->>'admission_no','') IS NULL OR NOT EXISTS(SELECT 1 FROM public.students st WHERE st.admission_no=r->>'admission_no' AND public.ldm_aw_scope(c,to_jsonb(st),'students'))) THEN RETURN false;END IF;
 RETURN public.ldm_aw_scope(c,r,p_table);
END $$;

CREATE OR REPLACE FUNCTION public.ldm_aw_require(p_routes text[],p_action text,r jsonb DEFAULT NULL) RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE c jsonb:=public.ldm_aw_context();
BEGIN
 IF c IS NULL OR NOT coalesce(c->>'route'=ANY(p_routes),false) OR NOT coalesce((c->'permissions')?p_action,false) OR (r IS NOT NULL AND NOT public.ldm_aw_scope(c,r)) THEN RAISE EXCEPTION 'Assigned route, action or scope denied' USING ERRCODE='42501';END IF;
 RETURN true;
END $$;

DO $aw$ DECLARE tab text; action text; verb text; pred text; pol text; BEGIN
 FOREACH tab IN ARRAY ARRAY['academics','attendance','ldm_v265_bell_tests','ldm_v265_copy_checks','ldm_v265_principal_audits','leave','staff_attendance','student_correction_requests','student_leave_requests','student_marks','student_roster_requests','students','syllabus_master','teaching_diary','timetable','transport','v102_student_gate_pass','v69_admit_card_controls','v69_exam_classes','v69_exam_master','v763_bell_time_master','v90_exam_attendance','v90_marks_check_status','v90_teacher_requests','v90_transport_trip_attendance','v92_admit_publication_controls'] LOOP
 IF to_regclass('public.'||quote_ident(tab)) IS NULL THEN RAISE EXCEPTION 'Assign Work dependency missing: %',tab; END IF;
 EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',tab);
 FOREACH action IN ARRAY ARRAY['read','write','edit','delete'] LOOP
 verb:=CASE action WHEN 'read' THEN 'SELECT' WHEN 'write' THEN 'INSERT' WHEN 'edit' THEN 'UPDATE' ELSE 'DELETE' END;
 pred:=format('public.ldm_aw_row(%L,to_jsonb(%I.*),%L,(SELECT public.ldm_aw_context()))',tab,tab,action);
 IF tab='students' THEN pred:='false';END IF;
 pol:='ldm_aw_limit_'||action;
 EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I',pol,tab);
 EXECUTE format('CREATE POLICY %I ON public.%I AS RESTRICTIVE FOR %s TO authenticated %s',pol,tab,verb,
 CASE WHEN action='write' THEN 'WITH CHECK (NOT public.ldm_aw_present() OR '||pred||')'
 WHEN action='edit' THEN 'USING (NOT public.ldm_aw_present() OR '||pred||') WITH CHECK (NOT public.ldm_aw_present() OR '||pred||')'
 ELSE 'USING (NOT public.ldm_aw_present() OR '||pred||')' END);
 IF action<>'delete' THEN
 pol:='ldm_aw_allow_'||action;EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I',pol,tab);
 EXECUTE format('CREATE POLICY %I ON public.%I FOR %s TO authenticated %s',pol,tab,verb,
 CASE WHEN action='write' THEN 'WITH CHECK (public.ldm_aw_present() AND '||pred||')'
 WHEN action='edit' THEN 'USING (public.ldm_aw_present() AND '||pred||') WITH CHECK (public.ldm_aw_present() AND '||pred||')'
 ELSE 'USING (public.ldm_aw_present() AND '||pred||')' END);
 END IF;
 END LOOP;
 END LOOP;
END $aw$;


-- Original module queries use this scope-filtered projection, never identity documents/QR tokens.
CREATE OR REPLACE VIEW public.ldm_aw_students WITH (security_barrier=true) AS
SELECT id,student_name,admission_no,student_id,roll_no,class_name,section,father_name,mother_name,phone,student_email,parent_email,status,is_active,dob,gender,photo_url,student_photo_url,guardian_name,emergency_phone,parent_login_status,parent_login_updated_at,student_login_status,student_login_updated_at,academic_session
FROM public.students s WHERE public.ldm_aw_present() AND public.ldm_aw_row('students',to_jsonb(s),'read',(SELECT public.ldm_aw_context()));
REVOKE ALL ON public.ldm_aw_students FROM PUBLIC,anon;
GRANT SELECT ON public.ldm_aw_students TO authenticated;

CREATE OR REPLACE FUNCTION public.ldm_aw_request_update_guard() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog,public AS $$
BEGIN
 IF public.ldm_aw_present() AND TG_OP='UPDATE' AND (to_jsonb(NEW)-ARRAY['status','admin_note','reviewed_by','reviewed_at','updated_at']) IS DISTINCT FROM (to_jsonb(OLD)-ARRAY['status','admin_note','reviewed_by','reviewed_at','updated_at']) THEN RAISE EXCEPTION 'Only request decision fields may be edited' USING ERRCODE='42501';END IF;
 IF public.ldm_aw_present() AND (NEW.status NOT IN('Approved','Rejected') OR NEW.reviewed_by IS DISTINCT FROM auth.uid()) THEN RAISE EXCEPTION 'Invalid delegated decision' USING ERRCODE='42501';END IF;
 RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS ldm_aw_request_update_guard ON public.v90_teacher_requests;

CREATE TRIGGER ldm_aw_request_update_guard BEFORE UPDATE ON public.v90_teacher_requests FOR EACH ROW EXECUTE FUNCTION public.ldm_aw_request_update_guard();

CREATE OR REPLACE FUNCTION public.ldm_aw_refs(p_kind text) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE c jsonb:=public.ldm_aw_context();rs jsonb;
BEGIN
 IF c IS NULL OR NOT ((c->'permissions')?'read') THEN RAISE EXCEPTION 'Active assignment required' USING ERRCODE='42501';END IF;
 IF p_kind='teacher_profiles' AND c->>'route'=ANY(ARRAY['timetable_master','v90_teacher_requests','v90_teaching_monitor','academic_monitor']) THEN
 SELECT coalesce(jsonb_agg(jsonb_build_object('id',id,'auth_user_id',auth_user_id,'teacher_name',teacher_name,'full_name',teacher_name,'approval_status',approval_status,'is_active',is_active) ORDER BY teacher_name),'[]') INTO rs FROM public.teacher_profiles WHERE is_active IS DISTINCT FROM false AND approval_status='Approved';RETURN rs;
 ELSIF p_kind='staff' AND c->>'route'=ANY(ARRAY['v90_attendance_monitor','v90_presence_monitor']) THEN
 IF NOT ((c->'permissions')?'staff') OR coalesce(c->>'class','')<>'' OR coalesce(c->>'section','')<>'' THEN RETURN '[]';END IF;
 SELECT coalesce(jsonb_agg(jsonb_build_object('id',id,'staff_name',staff_name,'employee_id',employee_id,'status',status) ORDER BY staff_name),'[]') INTO rs FROM public.staff;RETURN rs;
 END IF;
 RAISE EXCEPTION 'Reference outside assignment' USING ERRCODE='42501';
END $$;

CREATE OR REPLACE FUNCTION public.ldm_work403_team(p_task uuid, p_team jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE r record;
BEGIN
 IF NOT public.ldm_work403_actor() THEN RAISE EXCEPTION 'Admin only' USING ERRCODE='42501';END IF;
 IF jsonb_typeof(p_team) IS DISTINCT FROM 'array' OR jsonb_array_length(p_team)=0 THEN RAISE EXCEPTION 'Select at least one teacher';END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements_text(p_team) uid WHERE NOT EXISTS(SELECT 1 FROM public.teacher_profiles t JOIN public.profiles p ON p.id=t.auth_user_id WHERE t.auth_user_id::text=uid AND t.is_active IS DISTINCT FROM false AND t.approval_status='Approved' AND lower(coalesce(p.status,'active'))='active')) THEN RAISE EXCEPTION 'Select active approved mapped teachers only';END IF;
 UPDATE public.ldm_work_task_assignees a SET is_active=false,status=CASE WHEN a.status='completed' THEN 'completed' ELSE 'removed' END,updated_at=now() WHERE task_id=p_task AND NOT p_team ? a.teacher_auth_user_id::text;
 FOR r IN SELECT DISTINCT ON(t.auth_user_id) t.* FROM public.teacher_profiles t WHERE p_team ? t.auth_user_id::text ORDER BY t.auth_user_id,t.id LOOP
 INSERT INTO public.ldm_work_task_assignees(task_id,teacher_auth_user_id,teacher_profile_id,teacher_name,responsibility,status,is_active,assigned_by)
 VALUES(p_task,r.auth_user_id,r.id::text,r.teacher_name,'assistant','assigned',true,auth.uid())
 ON CONFLICT(task_id,teacher_auth_user_id) DO UPDATE SET teacher_name=excluded.teacher_name,teacher_profile_id=excluded.teacher_profile_id,is_active=true,status=CASE WHEN public.ldm_work_task_assignees.status='removed' THEN 'assigned' ELSE public.ldm_work_task_assignees.status END,updated_at=now();
 END LOOP;
 -- Completed assignment rows and notes are never reset by reassigning a team.
 IF EXISTS(SELECT 1 FROM public.ldm_work_task_assignees WHERE task_id=p_task AND is_active AND status NOT IN('removed','completed')) THEN
 UPDATE public.ldm_work_tasks SET status=CASE WHEN status='completed' THEN 'assigned' ELSE status END,is_active=NOT coalesce((SELECT paused OR archived FROM public.ldm_work403_meta WHERE task_id=p_task),false),updated_at=now() WHERE id=p_task AND status<>'cancelled';
 END IF;
END$function$
;

CREATE OR REPLACE FUNCTION public.ldm_work403_write(p_request uuid, p_action text, p_data jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE adm boolean:=public.ldm_work403_actor();old public.ldm_work403_requests;req jsonb:=jsonb_build_object('action',p_action,'data',p_data);ident uuid;r record;t public.ldm_work_tasks;before_data jsonb;result jsonb;ids uuid[];meta public.ldm_work403_meta;rev int;cat uuid;team jsonb;cnt int:=0;vtype text;
BEGIN
 IF p_request IS NULL OR jsonb_typeof(p_data) IS DISTINCT FROM 'object' OR octet_length(p_data::text)>2000000 THEN RAISE EXCEPTION 'Invalid request';END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_request::text,403));SELECT * INTO old FROM public.ldm_work403_requests WHERE id=p_request;
 IF FOUND THEN IF old.actor<>auth.uid() OR old.request IS DISTINCT FROM req THEN RAISE EXCEPTION 'Request reused';END IF;RETURN old.result;END IF;
 IF p_action='progress' THEN
 IF NOT EXISTS(SELECT 1 FROM public.teacher_profiles WHERE auth_user_id=auth.uid() AND is_active IS DISTINCT FROM false AND approval_status='Approved') THEN RAISE EXCEPTION 'Active approved teacher required' USING ERRCODE='42501';END IF;
 ident:=(p_data->>'assignment')::uuid;
 SELECT a.task_id INTO ident FROM public.ldm_work_task_assignees a JOIN public.ldm_work_tasks tt ON tt.id=a.task_id WHERE a.id=ident AND a.teacher_auth_user_id=auth.uid() FOR UPDATE OF tt;
 IF ident IS NULL OR EXISTS(SELECT 1 FROM public.ldm_work403_meta WHERE task_id=ident AND (paused OR archived)) THEN RAISE EXCEPTION 'Task unavailable' USING ERRCODE='42501';END IF;
 PERFORM public.ldm_teacher_update_task_assignment((p_data->>'assignment')::uuid,p_data->>'status',coalesce(p_data->>'note',''));result:=jsonb_build_object('saved',true,'id',ident);
 ELSE
 IF NOT adm THEN RAISE EXCEPTION 'Admin only' USING ERRCODE='42501';END IF;
 IF p_action='category' THEN
 ident:=nullif(p_data->>'id','')::uuid;
 IF ident IS NULL THEN INSERT INTO public.ldm_work403_categories(name) VALUES(btrim(p_data->>'name')) RETURNING id INTO ident;
 ELSE SELECT to_jsonb(c) INTO before_data FROM public.ldm_work403_categories c WHERE id=ident FOR UPDATE;IF before_data IS NULL OR (before_data->>'revision')::int IS DISTINCT FROM (p_data->>'revision')::int THEN RAISE EXCEPTION 'Category changed; refresh' USING ERRCODE='40001';END IF;
 UPDATE public.ldm_work403_categories SET name=coalesce(nullif(btrim(p_data->>'name'),''),name),archived=coalesce((p_data->>'archived')::boolean,archived),revision=revision+1 WHERE id=ident;END IF;
 result:=jsonb_build_object('saved',true,'id',ident);
 ELSIF p_action='workload' THEN
 ident:=(p_data->>'id')::uuid;
 IF NOT EXISTS(SELECT 1 FROM public.teacher_profiles WHERE auth_user_id=ident AND is_active IS DISTINCT FROM false AND approval_status='Approved') THEN RAISE EXCEPTION 'Teacher not available';END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(ident::text,404));SELECT to_jsonb(l) INTO before_data FROM public.ldm_work403_load l WHERE teacher_id=ident FOR UPDATE;
 IF coalesce((before_data->>'revision')::int,0) IS DISTINCT FROM (p_data->>'revision')::int THEN RAISE EXCEPTION 'Workload changed; refresh' USING ERRCODE='40001';END IF;
 INSERT INTO public.ldm_work403_load(teacher_id,teaching_minutes,capacity,light_until,heavy_from) VALUES(ident,(p_data->>'teaching_minutes')::numeric,(p_data->>'capacity')::numeric,(p_data->>'light_until')::numeric,(p_data->>'heavy_from')::numeric)
 ON CONFLICT(teacher_id) DO UPDATE SET teaching_minutes=excluded.teaching_minutes,capacity=excluded.capacity,light_until=excluded.light_until,heavy_from=excluded.heavy_from,revision=public.ldm_work403_load.revision+1;
 result:=jsonb_build_object('saved',true,'id',ident);
 ELSIF p_action IN('save','duplicate','team','pause','resume','archive','restore','complete') THEN
 IF p_action='save' AND nullif(p_data->>'id','') IS NULL THEN ids:=ARRAY[NULL::uuid];
 ELSE SELECT array_agg(DISTINCT x::uuid ORDER BY x::uuid) INTO ids FROM jsonb_array_elements_text(CASE WHEN p_data ? 'ids' THEN p_data->'ids' ELSE jsonb_build_array(p_data->>'id') END)x;IF coalesce(array_length(ids,1),0)=0 OR array_length(ids,1)>500 THEN RAISE EXCEPTION 'Select 1–500 tasks per batch';END IF;END IF;
 FOREACH ident IN ARRAY ids LOOP
 IF ident IS NOT NULL THEN
 SELECT * INTO t FROM public.ldm_work_tasks WHERE id=ident FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Task not found';END IF;
 IF public.ldm_work403_version(ident) IS DISTINCT FROM p_data->'versions'->>ident::text THEN RAISE EXCEPTION 'Task or team changed; refresh and review' USING ERRCODE='40001';END IF;
 SELECT to_jsonb(t)||jsonb_build_object('meta',(SELECT to_jsonb(m) FROM public.ldm_work403_meta m WHERE task_id=ident),'team',(SELECT jsonb_agg(to_jsonb(a)) FROM public.ldm_work_task_assignees a WHERE task_id=ident)) INTO before_data;
 ELSE before_data:=NULL;END IF;
 IF p_action IN('save','duplicate') THEN
 IF array_length(ids,1)<>1 THEN RAISE EXCEPTION 'Edit one task at a time';END IF;
 IF p_action='duplicate' THEN
 INSERT INTO public.ldm_work_tasks(title,details,module_route,priority,work_date,due_date,status,is_active,created_by) VALUES(t.title||' — Copy',t.details,t.module_route,t.priority,t.work_date,t.due_date,'assigned',true,auth.uid()) RETURNING id INTO ident;
 INSERT INTO public.ldm_work403_meta(task_id,category_id,duty_type,custom_type,minutes,difficulty,weekly_occurrences,scope_class,scope_section,scope_subject,aw_scoped,aw_permissions) SELECT ident,category_id,duty_type,custom_type,minutes,difficulty,weekly_occurrences,scope_class,scope_section,scope_subject,aw_scoped,aw_permissions FROM public.ldm_work403_meta WHERE task_id=t.id;
 SELECT coalesce(jsonb_agg(teacher_auth_user_id::text),'[]') INTO team FROM public.ldm_work_task_assignees WHERE task_id=t.id AND is_active;
 IF jsonb_array_length(team)>0 THEN PERFORM public.ldm_work403_team(ident,team);END IF;
 ELSE
 IF length(btrim(coalesce(p_data->>'title',''))) NOT BETWEEN 1 AND 500 OR length(coalesce(p_data->>'details',''))>100000 THEN RAISE EXCEPTION 'Title/instructions required within limit';END IF;
 cat:=nullif(p_data->>'category_id','')::uuid;
 IF cat IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.ldm_work403_categories WHERE id=cat AND (NOT archived OR cat=(SELECT category_id FROM public.ldm_work403_meta WHERE task_id=ident))) THEN RAISE EXCEPTION 'Choose active category';END IF;
 IF nullif(p_data->>'module_route','') IS NOT NULL AND NOT public.ldm_v278_route_ready(p_data->>'module_route') THEN RAISE EXCEPTION 'ERP route is not delegation-ready';END IF;
 IF nullif(p_data->>'due_date','')::date<nullif(p_data->>'work_date','')::date THEN RAISE EXCEPTION 'Due date precedes start';END IF;
 IF coalesce(p_data->>'priority','Normal') NOT IN('Low','Normal','High','Urgent') THEN RAISE EXCEPTION 'Invalid priority';END IF;
 vtype:=p_data->>'duty_type';IF vtype NOT IN('One-Time','Permanent','Temporary','Daily','Weekly','Monthly','Exam Special','Custom') OR vtype IS NULL OR (vtype='Custom' AND nullif(btrim(p_data->>'custom_type'),'') IS NULL) THEN RAISE EXCEPTION 'Select duty type';END IF;
 IF ident IS NULL THEN INSERT INTO public.ldm_work_tasks(title,details,module_route,priority,work_date,due_date,status,is_active,created_by) VALUES(btrim(p_data->>'title'),coalesce(p_data->>'details',''),nullif(p_data->>'module_route',''),coalesce(p_data->>'priority','Normal'),nullif(p_data->>'work_date','')::date,nullif(p_data->>'due_date','')::date,'assigned',true,auth.uid()) RETURNING id INTO ident;
 ELSE UPDATE public.ldm_work_tasks SET title=btrim(p_data->>'title'),details=coalesce(p_data->>'details',''),module_route=nullif(p_data->>'module_route',''),priority=coalesce(p_data->>'priority','Normal'),work_date=nullif(p_data->>'work_date','')::date,due_date=nullif(p_data->>'due_date','')::date,updated_at=now() WHERE id=ident;END IF;
 INSERT INTO public.ldm_work403_meta(task_id,category_id,duty_type,custom_type,minutes,difficulty,weekly_occurrences) VALUES(ident,cat,vtype,coalesce(p_data->>'custom_type',''),(p_data->>'minutes')::numeric,(p_data->>'difficulty')::numeric,(p_data->>'weekly_occurrences')::numeric)
 ON CONFLICT(task_id) DO UPDATE SET category_id=excluded.category_id,duty_type=excluded.duty_type,custom_type=excluded.custom_type,minutes=excluded.minutes,difficulty=excluded.difficulty,weekly_occurrences=excluded.weekly_occurrences,revision=public.ldm_work403_meta.revision+1;

 IF (public.ldm_aw_registry()->'routes') ? (p_data->>'module_route') THEN
 IF jsonb_typeof(p_data->'aw_permissions') IS DISTINCT FROM 'array' OR NOT ((p_data->'aw_permissions')?'read') OR EXISTS(SELECT 1 FROM jsonb_array_elements_text(p_data->'aw_permissions') x WHERE NOT ((public.ldm_aw_registry()->'permissions'->(p_data->>'module_route'))?x)) THEN RAISE EXCEPTION 'Select supported explicit permissions';END IF;
 IF ((p_data->'aw_permissions')?'global' OR (p_data->'aw_permissions')?'staff') AND (coalesce(p_data->>'scope_class','')<>'' OR coalesce(p_data->>'scope_section','')<>'' OR coalesce(p_data->>'scope_subject','')<>'') THEN RAISE EXCEPTION 'Whole-school authority requires All Classes / Sections / Subjects';END IF;
 IF coalesce(p_data->>'scope_subject','')<>'' AND p_data->>'module_route' NOT IN('academic_monitor','timetable_master','v90_marks_monitor','v90_teaching_monitor') THEN RAISE EXCEPTION 'Subject scope is only supported for academic functions';END IF;
 UPDATE public.ldm_work403_meta SET aw_scoped=true,scope_class=btrim(coalesce(p_data->>'scope_class','')),scope_section=btrim(coalesce(p_data->>'scope_section','')),scope_subject=btrim(coalesce(p_data->>'scope_subject','')),aw_permissions=ARRAY(SELECT DISTINCT jsonb_array_elements_text(p_data->'aw_permissions')) WHERE task_id=ident;
 ELSE
 IF coalesce(p_data->>'scope_class','')<>'' OR coalesce(p_data->>'scope_section','')<>'' OR coalesce(p_data->>'scope_subject','')<>'' THEN RAISE EXCEPTION 'Legacy function: use its existing permission setup';END IF;
 UPDATE public.ldm_work403_meta SET aw_scoped=false,scope_class='',scope_section='',scope_subject='',aw_permissions='{}' WHERE task_id=ident;
 END IF;
 PERFORM public.ldm_work403_team(ident,p_data->'team');
 END IF;
 ELSIF p_action='team' THEN PERFORM public.ldm_work403_team(ident,p_data->'team');
 ELSE
 INSERT INTO public.ldm_work403_meta(task_id) VALUES(ident) ON CONFLICT DO NOTHING;
 IF p_action='pause' THEN UPDATE public.ldm_work403_meta SET paused=true,revision=revision+1 WHERE task_id=ident;UPDATE public.ldm_work_tasks SET is_active=false,updated_at=now() WHERE id=ident;
 ELSIF p_action='resume' THEN UPDATE public.ldm_work403_meta SET paused=false,revision=revision+1 WHERE task_id=ident;UPDATE public.ldm_work_tasks SET is_active=(status NOT IN('completed','cancelled')) AND NOT (SELECT archived FROM public.ldm_work403_meta WHERE task_id=ident),updated_at=now() WHERE id=ident;
 ELSIF p_action='archive' THEN UPDATE public.ldm_work403_meta SET archived=true,revision=revision+1 WHERE task_id=ident;UPDATE public.ldm_work_tasks SET is_active=false,updated_at=now() WHERE id=ident;
 ELSIF p_action='restore' THEN UPDATE public.ldm_work403_meta SET archived=false,revision=revision+1 WHERE task_id=ident;UPDATE public.ldm_work_tasks SET is_active=(status NOT IN('completed','cancelled')) AND NOT (SELECT paused FROM public.ldm_work403_meta WHERE task_id=ident),updated_at=now() WHERE id=ident;
 ELSIF p_action='complete' THEN
 UPDATE public.ldm_work_task_assignees SET status='completed',completed_at=coalesce(completed_at,now()),updated_at=now() WHERE task_id=ident AND is_active AND status NOT IN('removed','completed');
 UPDATE public.ldm_work_tasks SET status='completed',is_active=false,updated_at=now() WHERE id=ident;
 END IF;
 END IF;
 INSERT INTO public.ldm_work_task_events(task_id,actor_user_id,actor_role,event_type,note) VALUES(ident,auth.uid(),'admin','smart_'||p_action,left(coalesce(p_data->>'note',''),2000));
 INSERT INTO public.ldm_work403_audit(actor,action,entity_id,before_data,after_data) VALUES(auth.uid(),p_action,ident,before_data,jsonb_build_object('version',public.ldm_work403_version(ident),'data',p_data));cnt:=cnt+1;
 END LOOP;
 result:=jsonb_build_object('saved',true,'id',ident,'count',cnt);
 ELSE RAISE EXCEPTION 'Unknown action';END IF;
 IF p_action IN('category','workload') THEN INSERT INTO public.ldm_work403_audit(actor,action,entity_id,before_data,after_data) VALUES(auth.uid(),p_action,ident,before_data,p_data);END IF;
 END IF;
 INSERT INTO public.ldm_work403_requests(id,actor,request,result) VALUES(p_request,auth.uid(),req,result);RETURN result;
END$function$;

CREATE OR REPLACE FUNCTION public.ldm_work403_read(p_filter jsonb DEFAULT '{}'::jsonb, p_page integer DEFAULT 1, p_size integer DEFAULT 50)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE adm boolean:=public.ldm_work403_actor();rs jsonb;cats jsonb;teachers jsonb:='[]';loads jsonb:='[]';n bigint;counts jsonb;sz int:=greatest(1,least(100,p_size));pg int:=greatest(1,p_page);q text:=left(coalesce(p_filter->>'query',''),150);
BEGIN
 IF jsonb_typeof(p_filter) IS DISTINCT FROM 'object' THEN RAISE EXCEPTION 'Invalid filter';END IF;
 IF NOT adm THEN p_filter:=p_filter-'teacher';END IF;
 SELECT coalesce(jsonb_agg(to_jsonb(c) ORDER BY name),'[]') INTO cats FROM public.ldm_work403_categories c;
 IF adm AND NOT coalesce((p_filter->>'report')::boolean,false) THEN
 SELECT coalesce(jsonb_agg(jsonb_build_object('id',p.auth_user_id,'profile_id',p.id::text,'name',p.teacher_name,'employee_id',p.employee_id) ORDER BY p.teacher_name),'[]') INTO teachers FROM public.teacher_profiles p WHERE p.is_active IS DISTINCT FROM false AND p.approval_status='Approved' AND p.auth_user_id IS NOT NULL AND EXISTS(SELECT 1 FROM public.profiles WHERE id=p.auth_user_id AND lower(coalesce(status,'active'))='active');
 END IF;
 WITH visible AS(SELECT t.id,t.title,t.details,t.module_route,t.priority,t.work_date,t.due_date,t.is_active,t.created_by,t.created_at,t.updated_at,t.status task_status,CASE WHEN adm THEN t.status WHEN t.status='cancelled' AND own.status<>'completed' THEN 'cancelled' ELSE own.status END status,coalesce(m.paused,false) paused,coalesce(m.archived,false) archived,m.category_id,m.duty_type,coalesce(m.minutes,30) minutes,coalesce(m.difficulty,1) difficulty,coalesce(m.weekly_occurrences,1) weekly_occurrences,m.custom_type,m.scope_class,m.scope_section,m.scope_subject,m.aw_scoped,m.aw_permissions,
 public.ldm_work403_version(t.id) version,
 coalesce((SELECT jsonb_agg(to_jsonb(a) ORDER BY a.assigned_at,a.id) FROM public.ldm_work_task_assignees a WHERE a.task_id=t.id AND (adm OR a.teacher_auth_user_id=auth.uid())),'[]') assignees
 FROM public.ldm_work_tasks t LEFT JOIN public.ldm_work403_meta m ON m.task_id=t.id LEFT JOIN public.ldm_work_task_assignees own ON own.task_id=t.id AND own.teacher_auth_user_id=auth.uid()
 WHERE (adm OR own.id IS NOT NULL)),
 filtered AS(SELECT * FROM visible v WHERE concat_ws(' ',title,details) ILIKE '%'||q||'%' AND (coalesce(p_filter->>'category','')='' OR category_id::text=p_filter->>'category') AND (coalesce(p_filter->>'teacher','')='' OR EXISTS(SELECT 1 FROM public.ldm_work_task_assignees a WHERE a.task_id=v.id AND a.teacher_auth_user_id::text=p_filter->>'teacher' AND a.is_active)) AND
 CASE coalesce(p_filter->>'status','active') WHEN 'all' THEN true WHEN 'archived' THEN archived WHEN 'paused' THEN paused AND NOT archived WHEN 'completed' THEN status='completed' AND NOT archived WHEN 'in_progress' THEN status='in_progress' AND NOT archived WHEN 'pending' THEN status NOT IN('completed','cancelled','removed') AND NOT archived WHEN 'cancelled' THEN status='cancelled' AND NOT archived ELSE NOT archived END)
 SELECT (SELECT count(*) FROM filtered),(SELECT coalesce(jsonb_agg(to_jsonb(z) ORDER BY created_at DESC,id),'[]') FROM(SELECT * FROM filtered ORDER BY created_at DESC,id LIMIT sz OFFSET (pg-1)*sz)z),jsonb_build_object('in_progress',count(*) FILTER(WHERE NOT archived AND status='in_progress'),'pending',count(*) FILTER(WHERE NOT archived AND status NOT IN('completed','cancelled','removed')),'completed',count(*) FILTER(WHERE status='completed' AND NOT archived),'paused',count(*) FILTER(WHERE paused AND NOT archived),'archived',count(*) FILTER(WHERE archived)) INTO n,rs,counts FROM visible;
 IF NOT coalesce((p_filter->>'report')::boolean,false) THEN
 -- No fixed task cap: totals include ALL active assignments, independently of visible page.
 SELECT coalesce(jsonb_agg(to_jsonb(z) ORDER BY name),'[]') INTO loads FROM(
 SELECT p.auth_user_id id,p.teacher_name name,coalesce(l.teaching_minutes,0) teaching_minutes,coalesce(l.capacity,2400) capacity,coalesce(l.light_until,.5) light_until,coalesce(l.heavy_from,.85) heavy_from,coalesce(l.revision,0) revision,
 count(t.id) FILTER(WHERE t.id IS NOT NULL) task_count,
 coalesce(sum(coalesce(m.minutes,30)*coalesce(m.difficulty,1)*coalesce(m.weekly_occurrences,1)) FILTER(WHERE t.id IS NOT NULL),0) duty_minutes,
 (SELECT count(*) FROM public.academics ac WHERE nullif(btrim(to_jsonb(ac)->>'teacher_name'),'')=btrim(p.teacher_name)) teaching_assignments
 FROM (SELECT DISTINCT ON(auth_user_id) * FROM public.teacher_profiles WHERE auth_user_id IS NOT NULL ORDER BY auth_user_id,id) p LEFT JOIN public.ldm_work403_load l ON l.teacher_id=p.auth_user_id
 LEFT JOIN public.ldm_work_task_assignees a ON a.teacher_auth_user_id=p.auth_user_id AND a.is_active AND a.status NOT IN('removed','completed')
 LEFT JOIN public.ldm_work_tasks t ON t.id=a.task_id AND t.is_active AND t.status NOT IN('cancelled','completed') AND NOT EXISTS(SELECT 1 FROM public.ldm_work403_meta mm WHERE mm.task_id=t.id AND (mm.paused OR mm.archived))
 LEFT JOIN public.ldm_work403_meta m ON m.task_id=t.id
 WHERE p.is_active IS DISTINCT FROM false AND p.approval_status='Approved' AND p.auth_user_id IS NOT NULL AND (adm OR p.auth_user_id=auth.uid())
 GROUP BY p.auth_user_id,p.teacher_name,l.teaching_minutes,l.capacity,l.light_until,l.heavy_from,l.revision)z;
 END IF;
 RETURN jsonb_build_object('admin',adm,'actor',auth.uid(),'rows',rs,'count',n,'page',pg,'size',sz,'counts',counts,'categories',cats,'teachers',teachers,'workload',loads);
END$function$;

CREATE OR REPLACE FUNCTION public.ldm_has_active_delegation(p_route text)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_ok boolean := false;
  v_uid text := auth.uid()::text;
begin
  if v_uid is null or coalesce(trim(p_route),'') = '' then
    return false;
  end if;

  if to_regclass('public.ldm_work_tasks') is null
     or to_regclass('public.ldm_work_task_assignees') is null then
    return false;
  end if;

  execute $q$
    select exists(
      select 1
      from public.ldm_work_task_assignees a
      join public.ldm_work_tasks t on t.id = a.task_id
      where NOT EXISTS(SELECT 1 FROM public.ldm_work403_meta aw WHERE aw.task_id=t.id AND aw.aw_scoped) AND a.teacher_auth_user_id::text = $1
        and coalesce(a.is_active,true) = true
        and lower(coalesce(a.status,'assigned')) in ('assigned','in_progress','submitted')
        and lower(coalesce(t.status,'assigned')) in ('assigned','in_progress','submitted')
        and coalesce(t.module_route,'') = $2
    )
  $q$
  into v_ok
  using v_uid, p_route;

  return coalesce(v_ok,false);
exception when others then
  return false;
end
$function$;

CREATE OR REPLACE FUNCTION public.ldm_v272_has_delegated_route(p_route text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
 select public.ldm_v278_route_ready(p_route) and exists(
  select 1 from public.ldm_work_task_assignees a
  join public.ldm_work_tasks t on t.id=a.task_id
  where NOT EXISTS(SELECT 1 FROM public.ldm_work403_meta aw WHERE aw.task_id=t.id AND aw.aw_scoped) AND a.teacher_auth_user_id=auth.uid()
    and a.is_active is true
    and lower(coalesce(a.status,'assigned')) not in ('removed','completed')
    and t.is_active is true
    and lower(coalesce(t.status,'assigned')) not in ('cancelled','completed')
    and btrim(coalesce(t.module_route,''))=btrim(coalesce(p_route,''))
    and coalesce(t.work_date,public.ldm_v278_india_date())<=public.ldm_v278_india_date()
 )
$function$;

CREATE OR REPLACE FUNCTION public.ldm_v272_my_assignment_for_route(p_route text)
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
 select a.id from public.ldm_work_task_assignees a
 join public.ldm_work_tasks t on t.id=a.task_id
 where NOT EXISTS(SELECT 1 FROM public.ldm_work403_meta aw WHERE aw.task_id=t.id AND aw.aw_scoped) AND a.teacher_auth_user_id=auth.uid()
   and a.is_active is true
   and lower(coalesce(a.status,'assigned')) not in ('removed','completed')
   and t.is_active is true
   and lower(coalesce(t.status,'assigned')) not in ('cancelled','completed')
   and public.ldm_v278_route_ready(t.module_route)
   and btrim(coalesce(t.module_route,''))=btrim(coalesce(p_route,''))
   and coalesce(t.work_date,public.ldm_v278_india_date())<=public.ldm_v278_india_date()
 order by a.assigned_at desc limit 1
$function$;

CREATE OR REPLACE FUNCTION public.ldm_v272_validate_delegated_route(p_assignment_id uuid, p_route text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
 select exists(
  select 1 from public.ldm_work_task_assignees a
  join public.ldm_work_tasks t on t.id=a.task_id
  where NOT EXISTS(SELECT 1 FROM public.ldm_work403_meta aw WHERE aw.task_id=t.id AND aw.aw_scoped) AND a.id=p_assignment_id
    and a.teacher_auth_user_id=auth.uid()
    and a.is_active is true
    and lower(coalesce(a.status,'assigned')) not in ('removed','completed')
    and t.is_active is true
    and lower(coalesce(t.status,'assigned')) not in ('cancelled','completed')
    and public.ldm_v278_route_ready(t.module_route)
    and btrim(coalesce(t.module_route,''))=btrim(coalesce(p_route,''))
    and coalesce(t.work_date,public.ldm_v278_india_date())<=public.ldm_v278_india_date()
 )
$function$;

CREATE OR REPLACE FUNCTION public.ldm_v259_gate_pass_assigned()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select
    public.v64_is_admin()
    or exists (
      select 1
      from public.ldm_work_task_assignees a
      join public.ldm_work_tasks t on t.id = a.task_id
      where NOT EXISTS(SELECT 1 FROM public.ldm_work403_meta aw WHERE aw.task_id=t.id AND aw.aw_scoped) AND a.teacher_auth_user_id = auth.uid()
        and a.is_active is true
        and lower(coalesce(a.status,'assigned')) not in ('removed','completed')
        and lower(coalesce(t.status,'assigned')) not in ('cancelled','completed')
        and lower(coalesce(t.module_route,'')) = 'master_gate_pass'
    );
$function$;

CREATE OR REPLACE FUNCTION public.ldm_resolve_attendance_conflict(p_date date, p_admission_no text, p_status text, p_action text DEFAULT 'manual_status'::text, p_note text DEFAULT ''::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_id uuid;
  v_status text;
  v_action text;
  v_snapshot jsonb := '[]'::jsonb;
begin
 IF public.ldm_aw_present() THEN
PERFORM public.ldm_aw_require(ARRAY['attendance_conflict_center'],'approve');
 IF EXISTS(SELECT 1 FROM unnest(ARRAY[p_admission_no]) a WHERE NOT EXISTS(SELECT 1 FROM public.students s WHERE s.admission_no=a AND public.ldm_aw_scope(public.ldm_aw_context(),to_jsonb(s),'students'))) THEN RAISE EXCEPTION 'Student outside assigned scope' USING ERRCODE='42501';END IF;
 END IF;

  if not (public.ldm_v187_is_admin() OR public.ldm_aw_present()) then
    raise exception 'Admin / Principal only';
  end if;

  if p_date is null then
    raise exception 'Attendance date required';
  end if;

  if nullif(btrim(coalesce(p_admission_no,'')),'') is null then
    raise exception 'Admission No. required';
  end if;

  if not exists (
    select 1 from public.students s
    where btrim(coalesce(s.admission_no,'')) = btrim(p_admission_no)
      and lower(coalesce(s.status,'active')) <> 'inactive'
  ) then
    raise exception 'Active student not found';
  end if;

  v_status := lower(btrim(coalesce(p_status,'')));
  if v_status in ('p','present') then v_status := 'present';
  elsif v_status in ('a','absent') then v_status := 'absent';
  elsif v_status in ('l','leave') then v_status := 'leave';
  elsif v_status in ('not_marked','not marked','unmarked') then v_status := 'not_marked';
  else raise exception 'Invalid attendance status';
  end if;

  v_action := case when lower(coalesce(p_action,''))='keep_latest'
                   then 'keep_latest' else 'manual_status' end;

  select coalesce(jsonb_agg(to_jsonb(a)), '[]'::jsonb)
    into v_snapshot
  from public.attendance a
  where a.date = p_date
    and btrim(coalesce(a.admission_no,'')) = btrim(p_admission_no);

  insert into public.ldm_attendance_resolutions(
    attendance_date,admission_no,chosen_status,resolution_action,
    admin_note,original_rows,is_active,resolved_by,resolved_at,updated_at
  ) values (
    p_date,btrim(p_admission_no),v_status,v_action,
    coalesce(p_note,''),v_snapshot,true,auth.uid(),now(),now()
  )
  on conflict (attendance_date,admission_no) do update
    set chosen_status=excluded.chosen_status,
        resolution_action=excluded.resolution_action,
        admin_note=excluded.admin_note,
        original_rows=excluded.original_rows,
        is_active=true,
        resolved_by=auth.uid(),
        resolved_at=now(),
        updated_at=now()
  returning id into v_id;

  return v_id;
end;
$function$;

CREATE OR REPLACE FUNCTION public.ldm_reopen_attendance_conflict(p_date date, p_admission_no text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
 IF public.ldm_aw_present() THEN
PERFORM public.ldm_aw_require(ARRAY['attendance_conflict_center'],'approve');
 IF EXISTS(SELECT 1 FROM unnest(ARRAY[p_admission_no]) a WHERE NOT EXISTS(SELECT 1 FROM public.students s WHERE s.admission_no=a AND public.ldm_aw_scope(public.ldm_aw_context(),to_jsonb(s),'students'))) THEN RAISE EXCEPTION 'Student outside assigned scope' USING ERRCODE='42501';END IF;
 END IF;

  if not (public.ldm_v187_is_admin() OR public.ldm_aw_present()) then
    raise exception 'Admin / Principal only';
  end if;

  update public.ldm_attendance_resolutions
     set is_active=false,
         updated_at=now()
   where attendance_date=p_date
     and admission_no=btrim(coalesce(p_admission_no,''))
     and is_active is true;

  return found;
end;
$function$;

CREATE OR REPLACE FUNCTION public.ldm_attendance_resolution_statuses(p_date date, p_classes text[] DEFAULT NULL::text[])
 RETURNS TABLE(admission_no text, chosen_status text, resolution_action text, resolved_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_role text := '';
  v_teacher_id text := null;
begin
 IF public.ldm_aw_present() THEN
PERFORM public.ldm_aw_require(ARRAY['v90_attendance_monitor','attendance_conflict_center'],'read');
 END IF;

  if auth.uid() is null then
    raise exception 'Login required';
  end if;

  select lower(coalesce(p.role,'')) into v_role
  from public.profiles p
  where p.id=auth.uid()
    and lower(coalesce(p.status,'active')) <> 'disabled'
  limit 1;

  if v_role in ('admin','super_admin','principal') OR public.ldm_aw_present() then
    return query
    select r.admission_no, r.chosen_status, r.resolution_action, r.resolved_at
    from public.ldm_attendance_resolutions r
    join public.students s on btrim(coalesce(s.admission_no,''))=btrim(coalesce(r.admission_no,''))
    where (NOT public.ldm_aw_present() OR public.ldm_aw_scope(public.ldm_aw_context(),to_jsonb(s),'students')) AND r.attendance_date=p_date
      and r.is_active is true
      and (p_classes is null or s.class_name = any(p_classes));
    return;
  end if;

  if v_role='teacher' then
    select tp.id::text into v_teacher_id
    from public.teacher_profiles tp
    where tp.auth_user_id=auth.uid()
      and coalesce(tp.is_active,true) is true
      and lower(coalesce(tp.approval_status,'approved'))='approved'
    limit 1;

    if v_teacher_id is null then
      raise exception 'Teacher mapping required';
    end if;

    return query
    select r.admission_no, r.chosen_status, r.resolution_action, r.resolved_at
    from public.ldm_attendance_resolutions r
    join public.students s on btrim(coalesce(s.admission_no,''))=btrim(coalesce(r.admission_no,''))
    where (NOT public.ldm_aw_present() OR public.ldm_aw_scope(public.ldm_aw_context(),to_jsonb(s),'students')) AND r.attendance_date=p_date
      and r.is_active is true
      and (p_classes is null or s.class_name = any(p_classes))
      and exists (
        select 1
        from public.teacher_class_assignments a
        where a.teacher_profile_id::text=v_teacher_id
          and a.class_name=s.class_name
          and coalesce(a.is_active,true) is true
      );
    return;
  end if;

  raise exception 'Role not allowed';
end;
$function$;

CREATE OR REPLACE FUNCTION public.ldm_fee_due_snapshot_v2(p_session text DEFAULT NULL::text, p_admission_nos text[] DEFAULT NULL::text[], p_until_month text DEFAULT NULL::text)
 RETURNS TABLE(admission_no text, current_due numeric, scheduled_due numeric, adjustment_due numeric, correction_amount numeric, unallocated_credit numeric, is_free boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
 declare scheduled text[];legacy text[];
 begin
 IF public.ldm_aw_present() THEN
PERFORM public.ldm_aw_require(ARRAY['v92_admit_publish'],'read');
 SELECT coalesce(array_agg(s.admission_no::text),'{}'::text[]) INTO p_admission_nos FROM public.students s WHERE (p_admission_nos IS NULL OR s.admission_no=ANY(p_admission_nos)) AND public.ldm_aw_scope(public.ldm_aw_context(),to_jsonb(s),'students');
 END IF;

 perform public.ldm_v336_refresh_due(p_session,p_admission_nos);
 select array_agg(s.admission_no::text) filter(where m.admission_no is not null),array_agg(s.admission_no::text) filter(where m.admission_no is null)
 into scheduled,legacy from public.students s left join public.ldm_v336_fee_members m on m.academic_session=p_session and m.admission_no=s.admission_no
 where (p_admission_nos is null or s.admission_no=any(p_admission_nos)) and lower(coalesce(s.status,'active')) not in ('inactive','left','withdrawn','deleted','trashed','recycled','archived','transferred') and (s.academic_session is null or s.academic_session=p_session);
 if cardinality(legacy)>0 then return query select * from public.ldm_fee_due_snapshot_v336_previous(p_session,legacy,p_until_month);end if;
 -- Exact-date plans own their timeline; an old class-wide cutoff must not hide a later due date.
 if cardinality(scheduled)>0 then return query select * from public.ldm_fee_due_snapshot_v335_base(p_session,scheduled,p_until_month);end if;
 end;
 $function$;

CREATE OR REPLACE FUNCTION public.v92_set_admit_publication(p_exam_id uuid, p_admission_nos text[], p_publish boolean, p_allow_due_override boolean DEFAULT false)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_adm text;
  v_due numeric:=0;
  v_hold boolean:=false;
  v_updated integer:=0;
  v_skipped integer:=0;
begin
 IF public.ldm_aw_present() THEN
PERFORM public.ldm_aw_require(ARRAY['v92_admit_publish'],'approve');
 IF EXISTS(SELECT 1 FROM unnest(p_admission_nos) a WHERE NOT EXISTS(SELECT 1 FROM public.students s WHERE s.admission_no=a AND public.ldm_aw_scope(public.ldm_aw_context(),to_jsonb(s),'students'))) THEN RAISE EXCEPTION 'Student outside assigned scope' USING ERRCODE='42501';END IF;
 IF coalesce(p_allow_due_override,false) THEN RAISE EXCEPTION 'Due override remains Admin only' USING ERRCODE='42501';END IF;
 END IF;

  if not (public.v64_is_admin() OR public.ldm_aw_present()) then raise exception 'Admin / Principal only'; end if;
  if p_exam_id is null or not exists(select 1 from public.v69_exam_master where id=p_exam_id) then
    raise exception 'Exam not found';
  end if;
  if p_admission_nos is null or cardinality(p_admission_nos)=0 then
    return jsonb_build_object('updated',0,'skipped_due_or_hold',0);
  end if;

  foreach v_adm in array p_admission_nos loop
    v_adm:=trim(coalesce(v_adm,''));
    if v_adm='' then continue; end if;
    if not exists(
      select 1 from public.students s
      join public.v69_exam_classes ec on ec.exam_id=p_exam_id and ec.class_name=s.class_name
      where s.admission_no=v_adm
        and coalesce(lower(nullif(s.status,'')),'active') not in ('inactive','deleted','left','withdrawn')
    ) then
      v_skipped:=v_skipped+1; continue;
    end if;

    if not coalesce(p_publish,false) then
      insert into public.v92_admit_publication_controls(
        exam_id,admission_no,is_published,allow_due_override,published_by,published_at,updated_at
      ) values(p_exam_id,v_adm,false,false,auth.uid(),null,now())
      on conflict(exam_id,admission_no) do update set
        is_published=false,allow_due_override=false,published_by=auth.uid(),published_at=null,updated_at=now();
      v_updated:=v_updated+1;
      continue;
    end if;

    v_due:=coalesce(public.v67_current_fee_due(v_adm),0);
    select coalesce(c.is_withheld,false) into v_hold
      from public.v69_admit_card_controls c
      where c.exam_id=p_exam_id and c.admission_no=v_adm;
    v_hold:=coalesce(v_hold,false);

    if v_hold or (v_due>0 and not coalesce(p_allow_due_override,false)) then
      v_skipped:=v_skipped+1; continue;
    end if;

    insert into public.v92_admit_publication_controls(
      exam_id,admission_no,is_published,allow_due_override,published_by,published_at,updated_at
    ) values(
      p_exam_id,v_adm,true,(v_due>0 and coalesce(p_allow_due_override,false)),auth.uid(),now(),now()
    )
    on conflict(exam_id,admission_no) do update set
      is_published=true,
      allow_due_override=excluded.allow_due_override,
      published_by=auth.uid(),
      published_at=now(),
      updated_at=now();
    v_updated:=v_updated+1;
  end loop;

  return jsonb_build_object('updated',v_updated,'skipped_due_or_hold',v_skipped);
end $function$;

CREATE OR REPLACE FUNCTION public.v763_save_teacher_week(p_teacher_name text, p_rows jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  j jsonb;
  v_id uuid;
  v_day text;
  v_period integer;
  v_start time;
  v_end time;
  v_class text;
  v_section text;
  v_subject text;
  v_saved integer:=0;
  v_inserted integer:=0;
  v_updated integer:=0;
begin
 IF public.ldm_aw_present() THEN
PERFORM public.ldm_aw_require(ARRAY['timetable_master'],'write');PERFORM public.ldm_aw_require(ARRAY['timetable_master'],'edit');
 DECLARE j jsonb; previous jsonb;
 BEGIN
 FOR j IN SELECT value FROM jsonb_array_elements(p_rows) LOOP
 IF NOT public.ldm_aw_scope(public.ldm_aw_context(),j,'timetable') THEN RAISE EXCEPTION 'Timetable row outside assigned scope' USING ERRCODE='42501';END IF;
 FOR previous IN SELECT to_jsonb(t) FROM public.timetable t WHERE lower(trim(t.teacher_name))=lower(trim(p_teacher_name)) AND t.day_name=initcap(lower(trim(j->>'day_name'))) AND t.period_no=(j->>'period_no')::int FOR UPDATE LOOP
 IF NOT public.ldm_aw_scope(public.ldm_aw_context(),previous,'timetable') THEN RAISE EXCEPTION 'Existing bell belongs to another scope' USING ERRCODE='42501';END IF;
 END LOOP;
 END LOOP;
 END;

 END IF;

  if not (public.v64_is_admin() OR public.ldm_aw_present()) then raise exception 'Admin/Principal only'; end if;
  if nullif(trim(coalesce(p_teacher_name,'')),'') is null then raise exception 'Teacher required'; end if;
  if p_rows is null or jsonb_typeof(p_rows)<>'array' then raise exception 'Rows must be a JSON array'; end if;

  for j in select value from jsonb_array_elements(p_rows)
  loop
    v_day:=initcap(lower(trim(coalesce(j->>'day_name',''))));
    v_period:=coalesce(nullif(j->>'period_no','')::integer,0);
    v_start:=nullif(j->>'start_time','')::time;
    v_end:=nullif(j->>'end_time','')::time;
    v_class:=trim(coalesce(j->>'class_name',''));
    v_section:=trim(coalesce(j->>'section',''));
    v_subject:=trim(coalesce(j->>'subject',''));

    if v_day not in ('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday') then
      raise exception 'Invalid day: %',v_day;
    end if;
    if v_period<1 or v_period>20 then raise exception 'Invalid Bell/Period: %',v_period; end if;
    if v_class='' or v_subject='' then raise exception '% Bell %: Class and Subject required',v_day,v_period; end if;

    v_id:=null;
    select t.id into v_id
    from public.timetable t
    where lower(trim(coalesce(t.teacher_name,'')))=lower(trim(p_teacher_name))
      and t.day_name=v_day and t.period_no=v_period
    order by t.created_at desc nulls last,t.id desc
    limit 1;

    if v_id is null then
      insert into public.timetable(teacher_name,day_name,period_no,start_time,end_time,class_name,section,subject,created_at)
      values(trim(p_teacher_name),v_day,v_period,v_start,v_end,v_class,nullif(v_section,''),v_subject,now());
      v_inserted:=v_inserted+1;
    else
      update public.timetable
      set teacher_name=trim(p_teacher_name),day_name=v_day,period_no=v_period,start_time=v_start,end_time=v_end,
          class_name=v_class,section=nullif(v_section,''),subject=v_subject
      where id=v_id;
      v_updated:=v_updated+1;
    end if;
    v_saved:=v_saved+1;
  end loop;

  return jsonb_build_object('saved',v_saved,'inserted',v_inserted,'updated',v_updated);
end $function$;

CREATE OR REPLACE FUNCTION public.v102_create_gate_pass(p_admission_nos text[], p_reason_code text, p_reason text, p_departure_time time without time zone, p_note text DEFAULT ''::text, p_gate_date date DEFAULT CURRENT_DATE)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_uid uuid:=auth.uid();
  v_admin boolean:=public.v64_is_admin();
  v_delegate boolean:=public.ldm_v259_gate_pass_assigned() OR public.ldm_aw_present();
  v_role text:='';
  v_name text:='';
  v_group uuid:=gen_random_uuid();
  v_adm text;
  s public.students%rowtype;
  v_status text;
  v_id uuid;
  v_created jsonb:='[]'::jsonb;
  v_skipped jsonb:='[]'::jsonb;
  v_count int:=0;
begin
 IF public.ldm_aw_present() THEN
PERFORM public.ldm_aw_require(ARRAY['master_gate_pass'],'write');
 IF EXISTS(SELECT 1 FROM unnest(p_admission_nos) a WHERE NOT EXISTS(SELECT 1 FROM public.students s WHERE s.admission_no=a AND public.ldm_aw_scope(public.ldm_aw_context(),to_jsonb(s),'students'))) THEN RAISE EXCEPTION 'Student outside assigned scope' USING ERRCODE='42501';END IF;
 END IF;

  if v_uid is null then raise exception 'Secure login required'; end if;
  select lower(coalesce(role,'')),coalesce(full_name,'') into v_role,v_name from public.profiles where id=v_uid;
  if not v_admin and v_role<>'teacher' then raise exception 'Admin / approved Teacher only'; end if;
  if v_role='teacher' then
    select coalesce(tp.teacher_name,v_name,'Teacher') into v_name from public.teacher_profiles tp where tp.auth_user_id=v_uid limit 1;
  end if;
  if coalesce(array_length(p_admission_nos,1),0)=0 then raise exception 'Student select करें'; end if;
  if array_length(p_admission_nos,1)>50 then raise exception 'Safe batch: एक बार में अधिकतम 50 students'; end if;
  if p_departure_time is null then raise exception 'Departure time required'; end if;
  v_status:=case when v_admin then 'Approved' else 'Pending' end;

  foreach v_adm in array p_admission_nos loop
    v_adm:=trim(coalesce(v_adm,''));
    if v_adm='' then continue; end if;
    select * into s from public.students where admission_no=v_adm limit 1;
    if s.id is null then
      v_skipped:=v_skipped||jsonb_build_array(jsonb_build_object('admission_no',v_adm,'reason','Student not found'));
      continue;
    end if;
    if lower(coalesce(s.status,'active'))='inactive' then
      v_skipped:=v_skipped||jsonb_build_array(jsonb_build_object('admission_no',v_adm,'student_name',s.student_name,'reason','Student inactive'));
      continue;
    end if;
    if not v_admin and not v_delegate and not public.v64_teacher_has_class(s.class_name) then
      v_skipped:=v_skipped||jsonb_build_array(jsonb_build_object('admission_no',v_adm,'student_name',s.student_name,'reason','Class not assigned'));
      continue;
    end if;
    if exists(select 1 from public.v102_student_gate_pass g where g.admission_no=v_adm and g.gate_date=p_gate_date and g.status in ('Pending','Approved','Left School')) then
      v_skipped:=v_skipped||jsonb_build_array(jsonb_build_object('admission_no',v_adm,'student_name',s.student_name,'reason','Active gate pass already exists'));
      continue;
    end if;

    insert into public.v102_student_gate_pass(
      group_id,gate_date,student_id,admission_no,student_name,father_name,class_name,section,phone,
      reason_code,reason,common_note,requested_departure_time,approved_departure_time,status,
      requested_by,requested_by_role,requested_by_name,
      reviewed_by,reviewed_by_name,reviewed_at
    ) values(
      v_group,p_gate_date,s.id,s.admission_no,s.student_name,s.father_name,s.class_name,s.section,s.phone,
      left(trim(coalesce(p_reason_code,'Other')),80),left(trim(coalesce(p_reason,'')),500),left(trim(coalesce(p_note,'')),500),p_departure_time,
      case when v_admin then p_departure_time else null end,v_status,
      v_uid,case when v_admin then 'admin' else 'teacher' end,coalesce(nullif(v_name,''),case when v_admin then 'Admin' else 'Teacher' end),
      case when v_admin then v_uid else null end,case when v_admin then coalesce(nullif(v_name,''),'Admin') else null end,case when v_admin then now() else null end
    ) returning id into v_id;
    v_count:=v_count+1;
    v_created:=v_created||jsonb_build_array(jsonb_build_object('id',v_id,'admission_no',s.admission_no,'student_name',s.student_name,'status',v_status));
  end loop;

  return jsonb_build_object('group_id',v_group,'status',v_status,'created_count',v_count,'created',v_created,'skipped',v_skipped);
end $function$;

CREATE OR REPLACE FUNCTION public.v102_review_gate_pass(p_ids uuid[], p_decision text, p_note text DEFAULT ''::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_dec text:=initcap(lower(trim(coalesce(p_decision,''))));
  v_uid uuid:=auth.uid();
  v_name text:='Admin';
  v_id uuid;
  v_count int:=0;
begin
 IF public.ldm_aw_present() THEN
PERFORM public.ldm_aw_require(ARRAY['master_gate_pass'],'approve');
 IF EXISTS(SELECT 1 FROM unnest(p_ids) k WHERE NOT EXISTS(SELECT 1 FROM public.v102_student_gate_pass aw_record WHERE aw_record.id=k AND public.ldm_aw_scope(public.ldm_aw_context(),to_jsonb(aw_record),'v102_student_gate_pass'))) THEN RAISE EXCEPTION 'Record outside assigned scope' USING ERRCODE='42501';END IF;
 END IF;

  if not (public.v64_is_admin() OR public.ldm_aw_present()) then raise exception 'Primary Admin only'; end if;
  if v_dec not in ('Approved','Rejected') then raise exception 'Decision must be Approved or Rejected'; end if;
  if coalesce(array_length(p_ids,1),0)=0 then raise exception 'Gate pass select करें'; end if;
  if array_length(p_ids,1)>50 then raise exception 'Safe batch: अधिकतम 50'; end if;
  select coalesce(full_name,'Admin') into v_name from public.profiles where id=v_uid;
  foreach v_id in array p_ids loop
    update public.v102_student_gate_pass
       set status=v_dec,
           approved_departure_time=case when v_dec='Approved' then coalesce(approved_departure_time,requested_departure_time) else approved_departure_time end,
           reviewer_note=left(trim(coalesce(p_note,'')),500),
           reviewed_by=v_uid,reviewed_by_name=v_name,reviewed_at=now(),updated_at=now()
     where id=v_id and status='Pending';
    if found then v_count:=v_count+1; end if;
  end loop;
  return jsonb_build_object('decision',v_dec,'updated',v_count);
end $function$;

CREATE OR REPLACE FUNCTION public.v102_mark_gate_pass_event(p_ids uuid[], p_action text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_action text:=lower(trim(coalesce(p_action,'')));
  v_uid uuid:=auth.uid();
  v_delegate boolean:=public.ldm_v259_gate_pass_assigned() OR public.ldm_aw_present();
  v_id uuid;
  r public.v102_student_gate_pass%rowtype;
  v_count int:=0;
begin
 IF public.ldm_aw_present() THEN
PERFORM public.ldm_aw_require(ARRAY['master_gate_pass'],'edit');
 IF EXISTS(SELECT 1 FROM unnest(p_ids) k WHERE NOT EXISTS(SELECT 1 FROM public.v102_student_gate_pass aw_record WHERE aw_record.id=k AND public.ldm_aw_scope(public.ldm_aw_context(),to_jsonb(aw_record),'v102_student_gate_pass'))) THEN RAISE EXCEPTION 'Record outside assigned scope' USING ERRCODE='42501';END IF;
 END IF;

  if v_uid is null then raise exception 'Secure login required'; end if;
  if v_action not in ('left','returned') then raise exception 'Invalid gate action'; end if;
  if coalesce(array_length(p_ids,1),0)=0 then raise exception 'Gate pass select करें'; end if;
  if array_length(p_ids,1)>50 then raise exception 'Safe batch: अधिकतम 50'; end if;
  foreach v_id in array p_ids loop
    select * into r from public.v102_student_gate_pass where id=v_id for update;
    if r.id is null then continue; end if;
    if not public.v64_is_admin() and not v_delegate and not public.v64_teacher_has_class(r.class_name) then continue; end if;
    if v_action='left' and r.status='Approved' then
      update public.v102_student_gate_pass set status='Left School',left_at=now(),left_by=v_uid,updated_at=now() where id=v_id;
      v_count:=v_count+1;
    elsif v_action='returned' and r.status='Left School' then
      update public.v102_student_gate_pass set status='Returned',returned_at=now(),returned_by=v_uid,updated_at=now() where id=v_id;
      v_count:=v_count+1;
    end if;
  end loop;
  return jsonb_build_object('action',v_action,'updated',v_count);
end $function$;

CREATE OR REPLACE FUNCTION public.ldm_v259_gate_students()
 RETURNS TABLE(id text, student_name text, father_name text, admission_no text, class_name text, section text, phone text, status text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_uid uuid := auth.uid();
  v_admin boolean := public.v64_is_admin();
  v_delegate boolean := public.ldm_v259_gate_pass_assigned() OR public.ldm_aw_present();
  v_role text := '';
begin
 IF public.ldm_aw_present() THEN
PERFORM public.ldm_aw_require(ARRAY['master_gate_pass'],'read');
 END IF;

  if v_uid is null then raise exception 'Secure login required'; end if;

  select lower(coalesce(p.role,'')) into v_role
  from public.profiles p where p.id=v_uid;

  if not v_admin and v_role <> 'teacher' then
    raise exception 'Admin / Teacher only';
  end if;

  return query
  select
    s.id::text,
    s.student_name::text,
    s.father_name::text,
    s.admission_no::text,
    s.class_name::text,
    s.section::text,
    s.phone::text,
    s.status::text
  from public.students s
  where (NOT public.ldm_aw_present() OR public.ldm_aw_scope(public.ldm_aw_context(),to_jsonb(s),'students')) AND lower(coalesce(s.status,'active')) <> 'inactive'
    and (
      v_admin
      or v_delegate
      or public.v64_teacher_has_class(s.class_name)
    )
  order by s.student_name;
end;
$function$;

CREATE OR REPLACE FUNCTION public.ldm_aw_gate_assigned() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$ SELECT coalesce(public.ldm_aw_context()->>'route'='master_gate_pass',false) $$;

CREATE OR REPLACE FUNCTION public.v64_review_student_correction(p_id uuid, p_decision text, p_note text DEFAULT NULL::text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare r public.student_correction_requests%rowtype; s public.students%rowtype;
        v_dec text:=initcap(lower(trim(coalesce(p_decision,'')))); v_admin boolean:=(public.v64_is_admin() OR public.ldm_aw_present()); v_protected boolean;
begin
 IF public.ldm_aw_present() THEN
PERFORM public.ldm_aw_require(ARRAY['v91_parent_updates','v90_student_requests'],'approve');
 IF EXISTS(SELECT 1 FROM unnest(ARRAY[p_id]) k WHERE NOT EXISTS(SELECT 1 FROM public.student_correction_requests aw_record WHERE aw_record.id=k AND public.ldm_aw_scope(public.ldm_aw_context(),to_jsonb(aw_record),'student_correction_requests'))) THEN RAISE EXCEPTION 'Record outside assigned scope' USING ERRCODE='42501';END IF;
 IF EXISTS(SELECT 1 FROM public.student_correction_requests aw_record CROSS JOIN LATERAL jsonb_object_keys(aw_record.proposed_changes) k WHERE aw_record.id=p_id AND k NOT IN('student_name','father_name','mother_name','dob','address','guardian_name','roll_no')) THEN RAISE EXCEPTION 'Contact, login and other protected changes require Admin' USING ERRCODE='42501';END IF;

 END IF;

  select * into r from public.student_correction_requests where id=p_id for update;
  if r.id is null then raise exception 'Correction request not found'; end if;
  if not v_admin and not public.v64_teacher_has_class(r.class_name) then raise exception 'Not allowed'; end if;
  select exists(select 1 from jsonb_object_keys(r.proposed_changes) k where k in ('student_name','father_name','mother_name','dob')) into v_protected;
  if v_protected and not v_admin then raise exception 'Official fields require Admin/Principal approval'; end if;
  if v_dec not in ('Approved','Rejected') then raise exception 'Decision must be Approved or Rejected'; end if;
  if v_dec='Rejected' then
    update public.student_correction_requests set status='Rejected',reviewer_note=trim(coalesce(p_note,'')),reviewed_by=auth.uid(),reviewed_at=now(),updated_at=now() where id=p_id;
    return 'Rejected';
  end if;
  select * into s from public.students where admission_no=r.admission_no for update;
  if s.id is null then raise exception 'Student not found'; end if;

  update public.students set
    student_name=case when r.proposed_changes?'student_name' then r.proposed_changes->>'student_name' else student_name end,
    father_name=case when r.proposed_changes?'father_name' then r.proposed_changes->>'father_name' else father_name end,
    mother_name=case when r.proposed_changes?'mother_name' then r.proposed_changes->>'mother_name' else mother_name end,
    dob=case when r.proposed_changes?'dob' then (r.proposed_changes->>'dob')::date else dob end,
    phone=case when r.proposed_changes?'phone' then r.proposed_changes->>'phone' else phone end,
    address=case when r.proposed_changes?'address' then r.proposed_changes->>'address' else address end,
    guardian_name=case when r.proposed_changes?'guardian_name' then r.proposed_changes->>'guardian_name' else guardian_name end,
    emergency_phone=case when r.proposed_changes?'emergency_phone' then r.proposed_changes->>'emergency_phone' else emergency_phone end,
    roll_no=case when r.proposed_changes?'roll_no' then r.proposed_changes->>'roll_no' else roll_no end,
    updated_at=now()
  where admission_no=r.admission_no;

  if r.proposed_changes?'student_name' then
    update public.admissions set student_name=r.proposed_changes->>'student_name' where admission_no=r.admission_no;
    update public.attendance set student_name=r.proposed_changes->>'student_name' where admission_no=r.admission_no;
    update public.fees set student_name=r.proposed_changes->>'student_name' where admission_no=r.admission_no;
    update public.student_marks set student_name=r.proposed_changes->>'student_name' where admission_no=r.admission_no;
    update public.fee_payments set student_name=r.proposed_changes->>'student_name' where admission_no=r.admission_no;
    update public.exams set student_name=r.proposed_changes->>'student_name' where admission_no=r.admission_no;
  end if;
  if r.proposed_changes?'father_name' then update public.admissions set father_name=r.proposed_changes->>'father_name' where admission_no=r.admission_no; end if;
  if r.proposed_changes?'mother_name' then update public.admissions set mother_name=r.proposed_changes->>'mother_name' where admission_no=r.admission_no; end if;
  if r.proposed_changes?'dob' then update public.admissions set dob=(r.proposed_changes->>'dob')::date where admission_no=r.admission_no; end if;
  if r.proposed_changes?'phone' then
    update public.admissions set primary_phone=r.proposed_changes->>'phone' where admission_no=r.admission_no;
    update public.fees set phone=r.proposed_changes->>'phone' where admission_no=r.admission_no;
  end if;
  if r.proposed_changes?'address' then update public.admissions set address=r.proposed_changes->>'address' where admission_no=r.admission_no; end if;
  if r.proposed_changes?'guardian_name' then update public.admissions set guardian_name=r.proposed_changes->>'guardian_name' where admission_no=r.admission_no; end if;
  if r.proposed_changes?'roll_no' then update public.admissions set roll_no=r.proposed_changes->>'roll_no' where admission_no=r.admission_no; end if;

  insert into public.student_change_audit(admission_no,source_type,source_id,changes,changed_by)
  values(r.admission_no,'parent_correction',r.id,r.proposed_changes,auth.uid());
  update public.student_correction_requests set status='Approved',reviewer_note=trim(coalesce(p_note,'')),reviewed_by=auth.uid(),reviewed_at=now(),updated_at=now() where id=p_id;
  return 'Approved';
end $function$;

CREATE OR REPLACE FUNCTION public.v91_review_student_correction(p_id uuid, p_decision text, p_note text DEFAULT NULL::text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  r public.student_correction_requests%rowtype;
  s public.students%rowtype;
  v_result text;
begin
 IF public.ldm_aw_present() THEN
PERFORM public.ldm_aw_require(ARRAY['v91_parent_updates','v90_student_requests'],'approve');
 IF EXISTS(SELECT 1 FROM unnest(ARRAY[p_id]) k WHERE NOT EXISTS(SELECT 1 FROM public.student_correction_requests aw_record WHERE aw_record.id=k AND public.ldm_aw_scope(public.ldm_aw_context(),to_jsonb(aw_record),'student_correction_requests'))) THEN RAISE EXCEPTION 'Record outside assigned scope' USING ERRCODE='42501';END IF;
 IF EXISTS(SELECT 1 FROM public.student_correction_requests aw_record CROSS JOIN LATERAL jsonb_object_keys(aw_record.proposed_changes) k WHERE aw_record.id=p_id AND k NOT IN('student_name','father_name','mother_name','dob','address','guardian_name','roll_no')) THEN RAISE EXCEPTION 'Contact, login and other protected changes require Admin' USING ERRCODE='42501';END IF;

 RETURN public.v64_review_student_correction(p_id,p_decision,p_note);
 END IF;

  if not (public.v64_is_admin() OR public.ldm_aw_present()) then raise exception 'Admin/Principal only'; end if;
  select * into r from public.student_correction_requests where id=p_id;
  if r.id is null then raise exception 'Correction request not found'; end if;

  if to_regprocedure('public.v65_review_student_correction(uuid,text,text)') is not null then
    v_result:=public.v65_review_student_correction(p_id,p_decision,p_note);
  else
    v_result:=public.v64_review_student_correction(p_id,p_decision,p_note);
  end if;

  if v_result='Approved' then
    perform public.v64_propagate_student_master(r.admission_no);
    select * into s from public.students where admission_no=r.admission_no limit 1;
    -- Small current-data bridge for fields not present in the older propagation helper.
    if s.id is not null then
      update public.student_marks set roll_no=s.roll_no where admission_no=s.admission_no and coalesce(academic_session,'2026-27')='2026-27';
      update public.admissions set alternate_phone=s.emergency_phone where admission_no=s.admission_no;
    end if;
  end if;
  return v_result;
end $function$;

CREATE OR REPLACE FUNCTION public.v64_review_student_leave(p_id uuid, p_decision text, p_note text DEFAULT NULL::text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare r public.student_leave_requests%rowtype; v_dec text:=initcap(lower(trim(coalesce(p_decision,''))));
begin
 IF public.ldm_aw_present() THEN
PERFORM public.ldm_aw_require(ARRAY['v90_student_requests'],'approve');
 IF EXISTS(SELECT 1 FROM unnest(ARRAY[p_id]) k WHERE NOT EXISTS(SELECT 1 FROM public.student_leave_requests aw_record WHERE aw_record.id=k AND public.ldm_aw_scope(public.ldm_aw_context(),to_jsonb(aw_record),'student_leave_requests'))) THEN RAISE EXCEPTION 'Record outside assigned scope' USING ERRCODE='42501';END IF;
 END IF;

  select * into r from public.student_leave_requests where id=p_id for update;
  if r.id is null then raise exception 'Leave request not found'; end if;
  if not (public.v64_is_admin() OR public.ldm_aw_present()) and not public.v64_teacher_has_class(r.class_name) then raise exception 'Not allowed'; end if;
  if v_dec not in ('Approved','Rejected') then raise exception 'Decision must be Approved or Rejected'; end if;
  update public.student_leave_requests set status=v_dec,reviewer_note=trim(coalesce(p_note,'')),reviewed_by=auth.uid(),reviewed_at=now(),updated_at=now() where id=p_id;
  if v_dec='Approved' then
    insert into public.attendance(date,student_name,admission_no,class_name,section,status,remark)
    select d::date,s.student_name,s.admission_no,s.class_name,s.section,'Leave','Approved Parent Leave • '||p_id::text
    from public.students s cross join generate_series(r.from_date::timestamp,r.to_date::timestamp,interval '1 day') d
    where s.admission_no=r.admission_no and extract(isodow from d)<7
    on conflict(date,admission_no) do update set status='Leave',remark=excluded.remark,student_name=excluded.student_name,class_name=excluded.class_name,section=excluded.section;
  end if;
  return v_dec;
end $function$;

CREATE OR REPLACE FUNCTION public.ldm_v265_class_roster(p_class_name text, p_subject text, p_date date, p_period_no integer)
 RETURNS TABLE(admission_no text, student_name text, father_name text, roll_no text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
 IF public.ldm_aw_present() THEN
PERFORM public.ldm_aw_require(ARRAY['academic_monitor'],'read',jsonb_build_object('class_name',p_class_name,'subject',p_subject,'section',public.ldm_aw_context()->>'section'));
 END IF;

  if auth.uid() is null then raise exception 'Login Required / लॉगिन आवश्यक'; end if;
  if not (public.v64_is_admin() OR public.ldm_aw_present())
     and not public.ldm_v265_teacher_can_bell(p_date,p_period_no,p_class_name,p_subject)
     and not exists(
       select 1 from public.teaching_diary d
       where d.teacher_user_id=auth.uid()
         and d.teaching_date=p_date
         and coalesce(d.period_no,0)=coalesce(p_period_no,0)
         and public.ldm_v265_norm_class(d.class_name)=public.ldm_v265_norm_class(p_class_name)
         and lower(trim(coalesce(d.subject,'')))=lower(trim(coalesce(p_subject,'')))
     )
  then raise exception 'Teacher is not assigned to this class/subject/bell'; end if;

  return query
  select s.admission_no::text,s.student_name::text,s.father_name::text,s.roll_no::text
  from public.students s
  where (NOT public.ldm_aw_present() OR public.ldm_aw_scope(public.ldm_aw_context(),to_jsonb(s),'students')) AND public.ldm_v265_norm_class(s.class_name)=public.ldm_v265_norm_class(p_class_name)
    and lower(coalesce(s.status,'active')) not in ('inactive','deleted','trashed','left','withdrawn','archived')
  order by
    case when coalesce(s.roll_no::text,'') ~ '^[0-9]+$' then s.roll_no::text::integer else 999999 end,
    s.student_name;
end
$function$;

CREATE OR REPLACE FUNCTION public.ldm_v265_copy_check_save(p_academic_session text, p_teacher_user_id uuid, p_teaching_date date, p_period_no integer, p_class_name text, p_subject text, p_lesson_no integer, p_topic text, p_total_students integer, p_checked_students integer, p_checked_date date, p_learning_status text, p_remark text, p_pending_admission_nos text[])
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_actor uuid:=auth.uid();
  v_target uuid:=coalesce(p_teacher_user_id,auth.uid());
  v_name text;
  v_id uuid;
  v_learning text:=coalesce(nullif(trim(p_learning_status),''),'Not Verified');
begin
 IF public.ldm_aw_present() THEN
PERFORM public.ldm_aw_require(ARRAY['academic_monitor'],'write');PERFORM public.ldm_aw_require(ARRAY['academic_monitor'],'edit');
 IF NOT EXISTS(SELECT 1 FROM public.teaching_diary d WHERE d.teacher_user_id=p_teacher_user_id AND d.teaching_date=p_teaching_date AND d.period_no=p_period_no AND public.ldm_aw_scope(public.ldm_aw_context(),to_jsonb(d),'teaching_diary') AND public.ldm_v265_norm_class(d.class_name)=public.ldm_v265_norm_class(p_class_name) AND lower(trim(d.subject))=lower(trim(p_subject))) THEN RAISE EXCEPTION 'Teaching bell outside assigned scope' USING ERRCODE='42501';END IF;
 IF EXISTS(SELECT 1 FROM public.ldm_v265_copy_checks c WHERE c.teacher_user_id=p_teacher_user_id AND c.teaching_date=p_teaching_date AND c.period_no=p_period_no AND (public.ldm_v265_norm_class(c.class_name)<>public.ldm_v265_norm_class(p_class_name) OR lower(trim(c.subject))<>lower(trim(p_subject)))) THEN RAISE EXCEPTION 'Existing checking belongs to another bell scope' USING ERRCODE='42501';END IF;
PERFORM public.ldm_aw_require(ARRAY['academic_monitor'],'write');
 IF EXISTS(SELECT 1 FROM unnest(p_pending_admission_nos) a WHERE NOT EXISTS(SELECT 1 FROM public.students s WHERE s.admission_no=a AND public.ldm_aw_scope(public.ldm_aw_context(),to_jsonb(s),'students'))) THEN RAISE EXCEPTION 'Student outside assigned scope' USING ERRCODE='42501';END IF;
 END IF;

  if v_actor is null then raise exception 'Login Required / लॉगिन आवश्यक'; end if;
  if (public.v64_is_admin() OR public.ldm_aw_present()) and p_teacher_user_id is null then raise exception 'Teacher mapping required'; end if;
  if not (public.v64_is_admin() OR public.ldm_aw_present()) and v_target<>v_actor then raise exception 'Permission Denied / अनुमति नहीं है'; end if;
  if coalesce(p_total_students,0)<0 or coalesce(p_checked_students,0)<0 or coalesce(p_checked_students,0)>coalesce(p_total_students,0) then
    raise exception 'Invalid copy checking count';
  end if;
  if v_learning not in ('Not Verified','Verified','Revision Needed') then raise exception 'Invalid learning status'; end if;

  if not exists(
    select 1 from public.teaching_diary d
    where d.teacher_user_id=v_target
      and d.teaching_date=p_teaching_date
      and coalesce(d.period_no,0)=coalesce(p_period_no,0)
      and public.ldm_v265_norm_class(d.class_name)=public.ldm_v265_norm_class(p_class_name)
      and lower(trim(coalesce(d.subject,'')))=lower(trim(coalesce(p_subject,'')))
  ) then
    raise exception 'Daily Teaching record not found for this bell. Save teaching first.';
  end if;

  v_name:=public.ldm_v265_teacher_name(v_target);

  insert into public.ldm_v265_copy_checks(
    academic_session,teacher_user_id,teacher_name,teaching_date,period_no,class_name,subject,
    lesson_no,topic,total_students,checked_students,checked_date,learning_status,remark,
    pending_admission_nos,updated_by,updated_at
  ) values(
    coalesce(nullif(trim(p_academic_session),''),'2026-27'),v_target,v_name,p_teaching_date,p_period_no,trim(p_class_name),trim(p_subject),
    coalesce(p_lesson_no,0),left(trim(coalesce(p_topic,'')),300),
    coalesce(p_total_students,0),coalesce(p_checked_students,0),coalesce(p_checked_date,current_date),
    v_learning,left(trim(coalesce(p_remark,'')),800),coalesce(p_pending_admission_nos,'{}'::text[]),v_actor,now()
  )
  on conflict(teacher_user_id,teaching_date,period_no) do update set
    class_name=excluded.class_name,
    subject=excluded.subject,
    lesson_no=excluded.lesson_no,
    topic=excluded.topic,
    total_students=excluded.total_students,
    checked_students=excluded.checked_students,
    checked_date=excluded.checked_date,
    learning_status=excluded.learning_status,
    remark=excluded.remark,
    pending_admission_nos=excluded.pending_admission_nos,
    updated_by=v_actor,
    updated_at=now()
  returning id into v_id;

  return v_id;
end
$function$;

CREATE OR REPLACE FUNCTION public.ldm_v265_bell_test_save(p_academic_session text, p_teacher_user_id uuid, p_test_date date, p_period_no integer, p_class_name text, p_section text, p_subject text, p_teacher_name text, p_status text, p_test_type text, p_topic text, p_max_marks numeric, p_students_tested integer, p_remark text, p_rescheduled_date date)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_actor uuid:=auth.uid();
  v_target uuid:=coalesce(p_teacher_user_id,auth.uid());
  v_name text;
  v_status text:=initcap(lower(trim(coalesce(p_status,'Planned'))));
  v_type text:=initcap(lower(trim(coalesce(p_test_type,'Oral'))));
  v_id uuid;
begin
 IF public.ldm_aw_present() THEN
PERFORM public.ldm_aw_require(ARRAY['academic_monitor'],'write',jsonb_build_object('class_name',p_class_name,'section',p_section,'subject',p_subject));PERFORM public.ldm_aw_require(ARRAY['academic_monitor'],'edit');
 IF EXISTS(SELECT 1 FROM public.ldm_v265_bell_tests t WHERE t.teacher_user_id=p_teacher_user_id AND t.test_date=p_test_date AND t.period_no=p_period_no AND NOT public.ldm_aw_scope(public.ldm_aw_context(),to_jsonb(t),'ldm_v265_bell_tests')) THEN RAISE EXCEPTION 'Existing test outside assigned scope' USING ERRCODE='42501';END IF;

 END IF;

  if v_actor is null then raise exception 'Login Required / लॉगिन आवश्यक'; end if;
  if (public.v64_is_admin() OR public.ldm_aw_present()) and p_teacher_user_id is null then raise exception 'Teacher mapping required'; end if;
  if not (public.v64_is_admin() OR public.ldm_aw_present()) then
    if v_target<>v_actor then raise exception 'Permission Denied / अनुमति नहीं है'; end if;
    if not public.ldm_v265_teacher_can_bell(p_test_date,p_period_no,p_class_name,p_subject) then
      raise exception 'This class/subject/bell is not assigned to this Teacher';
    end if;
  end if;

  if v_status not in ('Planned','Taken','Not Taken','Rescheduled') then raise exception 'Invalid test status'; end if;
  if v_type not in ('Oral','Written','Quiz','Other') then raise exception 'Invalid test type'; end if;
  if v_status='Taken' and nullif(trim(coalesce(p_topic,'')),'') is null then raise exception 'Topic required for Taken test'; end if;
  if v_status='Rescheduled' and p_rescheduled_date is null then raise exception 'Rescheduled date required'; end if;
  if coalesce(p_max_marks,0)<0 or coalesce(p_students_tested,0)<0 then raise exception 'Invalid marks/student count'; end if;

  v_name:=coalesce(nullif(trim(p_teacher_name),''),public.ldm_v265_teacher_name(v_target));

  insert into public.ldm_v265_bell_tests(
    academic_session,teacher_user_id,teacher_name,test_date,period_no,class_name,section,subject,
    status,test_type,topic,max_marks,students_tested,remark,rescheduled_date,updated_by,updated_at
  ) values(
    coalesce(nullif(trim(p_academic_session),''),'2026-27'),v_target,v_name,p_test_date,p_period_no,trim(p_class_name),trim(coalesce(p_section,'')),trim(p_subject),
    v_status,v_type,left(trim(coalesce(p_topic,'')),300),coalesce(p_max_marks,0),coalesce(p_students_tested,0),
    left(trim(coalesce(p_remark,'')),800),p_rescheduled_date,v_actor,now()
  )
  on conflict(teacher_user_id,test_date,period_no) do update set
    teacher_name=excluded.teacher_name,
    class_name=excluded.class_name,
    section=excluded.section,
    subject=excluded.subject,
    status=excluded.status,
    test_type=excluded.test_type,
    topic=excluded.topic,
    max_marks=excluded.max_marks,
    students_tested=excluded.students_tested,
    remark=excluded.remark,
    rescheduled_date=excluded.rescheduled_date,
    updated_by=v_actor,
    updated_at=now()
  returning id into v_id;

  return v_id;
end
$function$;

CREATE OR REPLACE FUNCTION public.ldm_v265_principal_audit_save(p_academic_session text, p_class_name text, p_subject text, p_teacher_user_id uuid, p_teacher_name text, p_sample_admission_nos text[], p_rating text, p_remark text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v_id uuid;v_rating text:=coalesce(nullif(trim(p_rating),''),'Good');
begin
 IF public.ldm_aw_present() THEN
IF coalesce(public.ldm_aw_context()->>'section','')<>'' AND coalesce(cardinality(p_sample_admission_nos),0)=0 THEN RAISE EXCEPTION 'Select students from the assigned section for this audit' USING ERRCODE='42501';END IF;
PERFORM public.ldm_aw_require(ARRAY['academic_monitor'],'approve',jsonb_build_object('class_name',p_class_name,'subject',p_subject,'section',public.ldm_aw_context()->>'section'));PERFORM public.ldm_aw_require(ARRAY['academic_monitor'],'approve');
 IF EXISTS(SELECT 1 FROM unnest(p_sample_admission_nos) a WHERE NOT EXISTS(SELECT 1 FROM public.students s WHERE s.admission_no=a AND public.ldm_aw_scope(public.ldm_aw_context(),to_jsonb(s),'students'))) THEN RAISE EXCEPTION 'Student outside assigned scope' USING ERRCODE='42501';END IF;
 END IF;

  if auth.uid() is null then raise exception 'Login Required'; end if;
  if not (public.v64_is_admin() OR public.ldm_aw_present()) then raise exception 'Admin / Principal only'; end if;
  if v_rating not in ('Good','Needs Improvement','Recheck') then raise exception 'Invalid rating'; end if;

  insert into public.ldm_v265_principal_audits(
    audit_date,academic_session,class_name,subject,teacher_user_id,teacher_name,
    sample_admission_nos,rating,remark,audited_by
  ) values(
    current_date,coalesce(nullif(trim(p_academic_session),''),'2026-27'),trim(p_class_name),trim(p_subject),p_teacher_user_id,trim(coalesce(p_teacher_name,'')),
    coalesce(p_sample_admission_nos,'{}'::text[]),v_rating,left(trim(coalesce(p_remark,'')),1000),auth.uid()
  ) returning id into v_id;
  return v_id;
end
$function$;

CREATE OR REPLACE FUNCTION public.ldm_v267_teacher_academic_summary(p_days integer DEFAULT 30, p_session text DEFAULT '2026-27'::text)
 RETURNS TABLE(teacher_user_id uuid, teacher_name text, lessons_taught bigint, fully_checked bigint, partial_checked bigint, learning_verified bigint, checking_gap bigint, copy_check_rate integer, verify_rate integer, tests_taken bigint, tests_not_taken bigint, tests_planned bigint, test_coverage_rate integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
with params as (
  select greatest(1,least(coalesce(p_days,30),365))::int as days
),
active_teachers as (
  select tp.auth_user_id,
         coalesce(nullif(trim(tp.teacher_name),''),nullif(trim(tp.full_name),''),'Teacher') as teacher_name
  from public.teacher_profiles tp
  where tp.auth_user_id is not null
    and coalesce(tp.is_active,true)=true
    and lower(coalesce(tp.approval_status,''))='approved'
),
teach as (
  select d.teacher_user_id,
         count(distinct (coalesce(d.class_name,''),coalesce(d.subject,''),coalesce(d.lesson_no,0),coalesce(d.topic,'')))::bigint as taught
  from public.teaching_diary d, params p
  where (NOT public.ldm_aw_present() OR public.ldm_aw_scope(public.ldm_aw_context(),to_jsonb(d),'teaching_diary')) AND d.teaching_date >= current_date-(p.days-1)
  group by d.teacher_user_id
),
checks as (
  select c.teacher_user_id,
         count(distinct (coalesce(c.class_name,''),coalesce(c.subject,''),coalesce(c.lesson_no,0),coalesce(c.topic,'')))
           filter(where c.total_students>0 and c.checked_students>=c.total_students)::bigint as full_count,
         count(distinct (coalesce(c.class_name,''),coalesce(c.subject,''),coalesce(c.lesson_no,0),coalesce(c.topic,'')))
           filter(where c.checked_students>0 and (c.total_students=0 or c.checked_students<c.total_students))::bigint as partial_count,
         count(distinct (coalesce(c.class_name,''),coalesce(c.subject,''),coalesce(c.lesson_no,0),coalesce(c.topic,'')))
           filter(where lower(coalesce(c.learning_status,''))='verified')::bigint as verified_count
  from public.ldm_v265_copy_checks c, params p
  where (NOT public.ldm_aw_present() OR public.ldm_aw_scope(public.ldm_aw_context(),to_jsonb(c),'ldm_v265_copy_checks')) AND c.teaching_date >= current_date-(p.days-1)
    and (p_session is null or c.academic_session=p_session)
  group by c.teacher_user_id
),
tests as (
  select t.teacher_user_id,
         count(*) filter(where t.status='Taken')::bigint as taken_count,
         count(*) filter(where t.status='Not Taken')::bigint as not_taken_count,
         count(*) filter(where t.status in ('Planned','Rescheduled'))::bigint as planned_count
  from public.ldm_v265_bell_tests t, params p
  where (NOT public.ldm_aw_present() OR public.ldm_aw_scope(public.ldm_aw_context(),to_jsonb(t),'ldm_v265_bell_tests')) AND t.test_date >= current_date-(p.days-1)
    and (p_session is null or t.academic_session=p_session)
  group by t.teacher_user_id
)
select a.auth_user_id,
       a.teacher_name,
       coalesce(te.taught,0)::bigint,
       coalesce(ch.full_count,0)::bigint,
       coalesce(ch.partial_count,0)::bigint,
       coalesce(ch.verified_count,0)::bigint,
       greatest(coalesce(te.taught,0)-coalesce(ch.full_count,0),0)::bigint,
       case when coalesce(te.taught,0)>0 then least(100,round(coalesce(ch.full_count,0)::numeric*100/coalesce(te.taught,1))::int) else 0 end,
       case when coalesce(te.taught,0)>0 then least(100,round(coalesce(ch.verified_count,0)::numeric*100/coalesce(te.taught,1))::int) else 0 end,
       coalesce(ts.taken_count,0)::bigint,
       coalesce(ts.not_taken_count,0)::bigint,
       coalesce(ts.planned_count,0)::bigint,
       case when coalesce(ts.taken_count,0)+coalesce(ts.not_taken_count,0)+coalesce(ts.planned_count,0)>0
            then round(coalesce(ts.taken_count,0)::numeric*100/
                 (coalesce(ts.taken_count,0)+coalesce(ts.not_taken_count,0)+coalesce(ts.planned_count,0)))::int
            else 0 end
from active_teachers a
left join teach te on te.teacher_user_id=a.auth_user_id
left join checks ch on ch.teacher_user_id=a.auth_user_id
left join tests ts on ts.teacher_user_id=a.auth_user_id
where public.v64_is_admin() OR (public.ldm_aw_context()->>'route'='academic_monitor' AND (public.ldm_aw_context()->'permissions')?'read')
order by a.teacher_name;
$function$;

DO $aw$ DECLARE f record; BEGIN FOR f IN SELECT p.oid::regprocedure signature FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname LIKE 'ldm_aw_%' LOOP EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon',f.signature);EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated',f.signature);END LOOP;END $aw$;

ALTER POLICY "ldm_marks_secure_select" ON public.student_marks USING ((NOT public.ldm_aw_present() AND ((ldm_v497_marks_read_scope(academic_session, class_name, subject_name, admission_no) AND ((NOT (EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = auth.uid()) AND (lower(p.role) = 'teacher'::text))))) OR ldm_marks_row_teacher_allowed(academic_session, class_name, subject_name, admission_no))))) OR (public.ldm_aw_present() AND public.ldm_aw_row('student_marks',to_jsonb(student_marks.*),'read',(SELECT public.ldm_aw_context()))));
ALTER POLICY "ldm_v497_marks_scope_select" ON public.student_marks USING ((NOT public.ldm_aw_present() AND (ldm_v497_marks_read_scope(academic_session, class_name, subject_name, admission_no))) OR (public.ldm_aw_present() AND public.ldm_aw_row('student_marks',to_jsonb(student_marks.*),'read',(SELECT public.ldm_aw_context()))));
REVOKE ALL ON FUNCTION public.ldm_aw_scope(jsonb,jsonb,text) FROM authenticated;
NOTIFY pgrst, 'reload schema';
COMMIT;
