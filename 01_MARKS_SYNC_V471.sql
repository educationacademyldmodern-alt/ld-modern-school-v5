BEGIN;
-- Uses the installed V320 engine for attendance, row revisions, corrections and history.
CREATE OR REPLACE FUNCTION public.ldm_teacher_list471(p_session text)
RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path=pg_catalog,public AS $$
 SELECT coalesce(jsonb_agg(p ORDER BY ord),'[]') FROM jsonb_array_elements(public.ldm_v320_exam_list(p_session))
 WITH ORDINALITY e(p,ord) WHERE EXISTS(SELECT FROM public.ldm_teacher_bells460() b
 WHERE public.ldm_v307_class(b.class_name)=public.ldm_v307_class(p->>'class_name')
 AND lower(trim(b.subject))=lower(trim(p->>'subject_name'))
 AND (nullif(trim(b.section),'') IS NULL OR nullif(trim(p->>'section'),'') IS NULL OR lower(trim(b.section))=lower(trim(p->>'section'))))
$$;
CREATE OR REPLACE FUNCTION public.ldm_teacher_load471(p_paper uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog,public AS $$
DECLARE result jsonb; meta jsonb; roster jsonb;
BEGIN
 result:=public.ldm_v320_exam_load(p_paper);meta:=result->'paper';
 SELECT coalesce(jsonb_agg(r ORDER BY ord),'[]') INTO roster FROM jsonb_array_elements(result->'rows') WITH ORDINALITY e(r,ord)
 WHERE EXISTS(SELECT FROM public.ldm_teacher_bells460() b WHERE public.ldm_v307_class(b.class_name)=public.ldm_v307_class(meta->>'class_name')
 AND lower(trim(b.subject))=lower(trim(meta->>'subject_name')) AND (nullif(trim(b.section),'') IS NULL OR lower(trim(b.section))=lower(trim(r->>'section'))));
 RETURN jsonb_set(result,'{rows}',roster);
END $$;
CREATE TABLE IF NOT EXISTS public.ldm_marks_sync471_requests(id uuid PRIMARY KEY,actor uuid NOT NULL,request jsonb NOT NULL);
ALTER TABLE public.ldm_marks_sync471_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.ldm_marks_sync471_requests FROM PUBLIC,anon,authenticated;
CREATE OR REPLACE FUNCTION public.ldm_marks_sync471(p_paper uuid,p_action text,p_rows jsonb,p_max numeric,p_revision integer,p_request uuid,p_reason text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE role_name text; teacher boolean; prev public.ldm_marks_sync471_requests%ROWTYPE; signature jsonb; result jsonb;
 meta jsonb; row_out jsonb; edit jsonb; sess text; exam text; subj text; existing integer;
BEGIN
 SELECT lower(role) INTO role_name FROM public.profiles WHERE id=auth.uid() AND lower(coalesce(status,'active'))='active';
 IF role_name IS NULL OR role_name NOT IN ('teacher','admin','super_admin','principal') OR p_action IS DISTINCT FROM 'marks' OR p_request IS NULL OR jsonb_typeof(p_rows) IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'Authorized marks request required' USING ERRCODE='42501'; END IF;
 teacher:=role_name='teacher';signature:=jsonb_build_array(p_paper,p_rows,p_max,p_revision,p_reason);
 PERFORM pg_advisory_xact_lock(hashtextextended(p_request::text,471));
 result:=CASE WHEN teacher THEN public.ldm_teacher_load471(p_paper) ELSE public.ldm_v320_exam_load(p_paper) END;
 SELECT * INTO prev FROM public.ldm_marks_sync471_requests WHERE id=p_request;
 IF FOUND THEN IF prev.actor<>auth.uid() OR prev.request<>signature THEN RAISE EXCEPTION 'Request conflict';END IF;RETURN result;END IF;
 IF EXISTS(SELECT FROM jsonb_array_elements(p_rows) x WHERE NOT EXISTS(SELECT FROM jsonb_array_elements(result->'rows') r WHERE r->>'student_id'=x->>'student_id')) THEN RAISE EXCEPTION 'Student outside assigned section' USING ERRCODE='42501';END IF;
 meta:=result->'paper';sess:=meta->>'academic_session';exam:=meta->>'exam_name';subj:=meta->>'subject_name';
 IF nullif(sess,'') IS NULL OR nullif(exam,'') IS NULL OR nullif(subj,'') IS NULL THEN RAISE EXCEPTION 'Incomplete paper identity';END IF;
 IF EXISTS(SELECT FROM public.v69_exam_timetable t JOIN public.v69_exam_master m ON m.id=t.exam_id WHERE t.id<>p_paper AND public.ldm_v310_session(m.academic_session)=public.ldm_v310_session(sess) AND lower(trim(m.exam_name))=lower(trim(exam)) AND public.ldm_v307_class(t.class_name)=public.ldm_v307_class(meta->>'class_name') AND lower(trim(t.subject_name))=lower(trim(subj)) AND (nullif(trim(meta->>'section'),'') IS NULL OR nullif(trim(to_jsonb(t)->>'section'),'') IS NULL OR lower(trim(to_jsonb(t)->>'section'))=lower(trim(meta->>'section')))) THEN RAISE EXCEPTION 'Ambiguous exam/subject paper';END IF;
 IF EXISTS(SELECT FROM public.ldm_v320_exam_writes WHERE id=p_request) THEN RAISE EXCEPTION 'Earlier save exists; reload this paper before retrying';END IF;
 result:=public.ldm_v320_exam_save(p_paper,p_action,p_rows,p_max,p_revision,p_request,p_reason);
 FOR edit IN SELECT value FROM jsonb_array_elements(p_rows) ORDER BY value->>'student_id' LOOP
 SELECT r INTO STRICT row_out FROM jsonb_array_elements(result->'rows') r WHERE r->>'student_id'=edit->>'student_id';
 IF row_out->>'attendance' IS DISTINCT FROM 'Present' OR (row_out->>'marks')::numeric IS DISTINCT FROM (edit->>'marks')::numeric THEN RAISE EXCEPTION 'Marks reconciliation failed';END IF;
 SELECT count(*) INTO existing FROM public.student_marks m WHERE public.ldm_v310_session(m.academic_session)=public.ldm_v310_session(sess) AND lower(trim(m.exam_name))=lower(trim(exam)) AND lower(trim(m.subject_name))=lower(trim(subj)) AND m.admission_no=row_out->>'admission_no';
 IF existing>1 THEN RAISE EXCEPTION 'Duplicate result rows';END IF;
 IF existing=1 THEN UPDATE public.student_marks m SET obtained_marks=(row_out->>'marks')::numeric,max_marks=(result->>'max_marks')::numeric,grade='',updated_at=now()
 WHERE public.ldm_v310_session(m.academic_session)=public.ldm_v310_session(sess) AND lower(trim(m.exam_name))=lower(trim(exam)) AND lower(trim(m.subject_name))=lower(trim(subj)) AND m.admission_no=row_out->>'admission_no';
 ELSE INSERT INTO public.student_marks(academic_session,exam_name,admission_no,student_name,class_name,section,roll_no,subject_name,max_marks,obtained_marks,grade)
 VALUES(sess,exam,row_out->>'admission_no',row_out->>'student_name',row_out->>'class_name',row_out->>'section',row_out->>'roll_no',subj,(result->>'max_marks')::numeric,(row_out->>'marks')::numeric,''); END IF;
 END LOOP;
 INSERT INTO public.ldm_marks_sync471_requests VALUES(p_request,auth.uid(),signature);
 RETURN CASE WHEN teacher THEN public.ldm_teacher_load471(p_paper) ELSE result END;
END $$;
REVOKE ALL ON FUNCTION public.ldm_teacher_list471(text),public.ldm_teacher_load471(uuid),public.ldm_marks_sync471(uuid,text,jsonb,numeric,integer,uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.ldm_teacher_list471(text),public.ldm_teacher_load471(uuid),public.ldm_marks_sync471(uuid,text,jsonb,numeric,integer,uuid,text) TO authenticated;
COMMIT;
