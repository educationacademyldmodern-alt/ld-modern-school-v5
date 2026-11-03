BEGIN;
-- One row per scheduling change. The timetable ID remains the result key.
CREATE TABLE IF NOT EXISTS public.ldm_exam_date_events475 (
 event_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 paper_id uuid NOT NULL REFERENCES public.v69_exam_timetable(id),
 student_id uuid REFERENCES public.students(id),
 before_date date NOT NULL,
 actual_date date NOT NULL,
 reason text NOT NULL,
 actor uuid NOT NULL,
 recorded_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ldm_exam_date_events475_paper ON public.ldm_exam_date_events475(paper_id,student_id);
ALTER TABLE public.ldm_exam_date_events475 ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.ldm_exam_date_events475 FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.ldm_exam_date475(p_paper uuid,p_student uuid,p_before date,p_actual date,p_revision integer,p_reason text)
RETURNS date LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE who text; original date; sheet jsonb; pupil jsonb; response jsonb;
BEGIN
 SELECT lower(role) INTO who FROM public.profiles WHERE id=auth.uid() AND lower(coalesce(status,'active'))='active';
 IF who IS NULL OR who NOT IN ('admin','super_admin','principal','teacher') OR (who='teacher' AND p_student IS NULL)
 THEN RAISE EXCEPTION 'Exam permission required' USING ERRCODE='42501'; END IF;
 SELECT exam_date INTO STRICT original FROM public.v69_exam_timetable WHERE id=p_paper FOR UPDATE;
 IF length(trim(coalesce(p_reason,'')))<3 THEN RAISE EXCEPTION 'A reason is required'; END IF;
 IF original IS DISTINCT FROM p_before OR p_actual IS NULL OR p_actual<=original THEN RAISE EXCEPTION 'Reload the paper and choose a later date'; END IF;
 sheet:=CASE WHEN who='teacher' THEN public.ldm_teacher_load471(p_paper) ELSE public.ldm_v320_exam_load(p_paper) END;
 IF (sheet->>'revision')::int IS DISTINCT FROM p_revision THEN RAISE EXCEPTION 'Paper changed. Reload before saving'; END IF;
 IF who='teacher' AND sheet->>'published_at' IS NOT NULL THEN RAISE EXCEPTION 'Published attendance requires administrator review' USING ERRCODE='42501'; END IF;
 IF p_student IS NULL THEN
   IF sheet->>'published_at' IS NOT NULL OR EXISTS(SELECT FROM jsonb_array_elements(sheet->'rows') r WHERE r->>'attendance' IN ('Absent','Present') OR r->>'marks' IS NOT NULL)
   THEN RAISE EXCEPTION 'Review existing attendance or publication before changing this date'; END IF;
   UPDATE public.v69_exam_timetable SET exam_date=p_actual WHERE id=p_paper;
 ELSE
   SELECT r INTO STRICT pupil FROM jsonb_array_elements(sheet->'rows') r WHERE r->>'student_id'=p_student::text;
   IF p_actual>(now() AT TIME ZONE 'Asia/Kolkata')::date OR pupil->>'attendance' NOT IN ('Absent','Not Marked') OR pupil->>'marks' IS NOT NULL OR length(trim(coalesce(p_reason,'')))<3 THEN RAISE EXCEPTION 'Check exam date, missing attendance and reason'; END IF;
   response:=public.ldm_v320_exam_save(p_paper,'attendance',jsonb_build_array(jsonb_build_object('student_id',p_student,'attendance','Present','revision',pupil->'revision')),(sheet->>'max_marks')::numeric,p_revision,gen_random_uuid(),p_reason);
   IF NOT EXISTS(SELECT FROM jsonb_array_elements(response->'rows') r WHERE r->>'student_id'=p_student::text AND r->>'attendance'='Present') THEN RAISE EXCEPTION 'Attendance save unconfirmed'; END IF;
 END IF;
 INSERT INTO public.ldm_exam_date_events475(paper_id,student_id,before_date,actual_date,reason,actor) VALUES(p_paper,p_student,original,p_actual,p_reason,auth.uid());
 RETURN p_actual;
END $$;
REVOKE ALL ON FUNCTION public.ldm_exam_date475(uuid,uuid,date,date,integer,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.ldm_exam_date475(uuid,uuid,date,date,integer,text) TO authenticated;
-- Scope V320 operations to an assigned roster; the underlying RPC retains action permissions.
CREATE OR REPLACE FUNCTION public.ldm_teacher_exam_action475(p_paper uuid,p_action text,p_rows jsonb,p_max numeric,p_revision integer,p_request uuid,p_reason text)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog,public AS $$
DECLARE roster jsonb; sheet jsonb;
BEGIN
 IF p_action IS NULL OR p_action NOT IN ('attendance','setup','publish') OR jsonb_typeof(p_rows) IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'Invalid exam action'; END IF;
 roster:=public.ldm_teacher_load471(p_paper);
 IF jsonb_array_length(roster->'rows')=0 OR EXISTS(SELECT FROM jsonb_array_elements(p_rows) e WHERE NOT EXISTS(SELECT FROM jsonb_array_elements(roster->'rows') r WHERE r->>'student_id'=e->>'student_id')) THEN RAISE EXCEPTION 'Assigned students only' USING ERRCODE='42501'; END IF;
 IF p_action IN ('setup','publish') THEN
   sheet:=public.ldm_v320_exam_load(p_paper);
   IF jsonb_array_length(sheet->'rows')<>jsonb_array_length(roster->'rows') THEN RAISE EXCEPTION 'Whole-paper authority required' USING ERRCODE='42501'; END IF;
 END IF;
 PERFORM public.ldm_v320_exam_save(p_paper,p_action,p_rows,p_max,p_revision,p_request,p_reason);
 RETURN public.ldm_teacher_load471(p_paper);
END $$;
REVOKE ALL ON FUNCTION public.ldm_teacher_exam_action475(uuid,text,jsonb,numeric,integer,uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.ldm_teacher_exam_action475(uuid,text,jsonb,numeric,integer,uuid,text) TO authenticated;
COMMIT;
