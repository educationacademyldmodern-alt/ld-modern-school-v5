BEGIN;
-- Resolve an existing issued Admit Card only for active authenticated staff.
-- Attendance continues to use the existing RLS / timetable save routines.
CREATE OR REPLACE FUNCTION public.ldm_v414_admit_resolve(p_token text) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE doc public.ldm_v345_documents; student jsonb; exam_id uuid; exam_count integer; student_count integer;
BEGIN
 IF auth.uid() IS NULL OR NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=auth.uid() AND lower(btrim(role)) IN('teacher','admin','principal','super_admin') AND lower(coalesce(status,'active'))='active') THEN RAISE EXCEPTION 'Active Teacher/Admin login required' USING ERRCODE='42501';END IF;
 IF p_token IS NULL OR p_token !~ '^[0-9a-f]{64}$' THEN RAISE EXCEPTION 'Invalid Admit Card QR';END IF;
 SELECT * INTO doc FROM public.ldm_v345_documents WHERE token=p_token;
 IF NOT FOUND THEN RAISE EXCEPTION 'Issued Admit Card नहीं मिला';END IF;
 IF doc.kind<>'admit' THEN RAISE EXCEPTION 'Attendance के लिए Admit Card या Desk Slip scan करें';END IF;
 IF doc.status<>'active' THEN RAISE EXCEPTION 'Admit Card revoked/superseded है; नया जारी कार्ड लाएँ';END IF;
 SELECT count(*) INTO student_count FROM public.students WHERE admission_no=doc.admission_no;
 IF student_count<>1 THEN RAISE EXCEPTION 'Student admission key unique नहीं है; Admin जाँचें';END IF;
 SELECT to_jsonb(s) INTO student FROM public.students s WHERE s.admission_no=doc.admission_no AND lower(coalesce(status,'active')) NOT IN('inactive','left','withdrawn','transferred','deleted','trashed','archived','recycled');
 IF student IS NULL THEN RAISE EXCEPTION 'Active student नहीं मिला';END IF;
 IF coalesce(student->>'academic_session','')<>'' AND replace(replace(student->>'academic_session','–','-'),'—','-')<>replace(replace(doc.academic_session,'–','-'),'—','-') THEN RAISE EXCEPTION 'Student session changed; current Admit Card required';END IF;
 SELECT count(*),min(e.id::text)::uuid INTO exam_count,exam_id FROM public.v69_exam_master e WHERE e.exam_name=doc.exam_name AND replace(replace(e.academic_session,'–','-'),'—','-')=replace(replace(doc.academic_session,'–','-'),'—','-') AND e.is_active IS DISTINCT FROM false;
 IF exam_count<>1 THEN RAISE EXCEPTION 'Admit Card की परीक्षा uniquely active नहीं मिली; Admin जाँचें';END IF;
 RETURN jsonb_build_object('ref','admit:'||doc.id::text,'source','admit','exam_id',exam_id,'exam_name',doc.exam_name,'session',doc.academic_session,'room','Admit Card','student',jsonb_build_object('id',student->>'id','admission_no',doc.admission_no,'student_name',student->>'student_name','class_name',student->>'class_name','section',student->>'section'));
END $$;
REVOKE ALL ON FUNCTION public.ldm_v414_admit_resolve(text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.ldm_v414_admit_resolve(text) TO authenticated;
COMMIT;
