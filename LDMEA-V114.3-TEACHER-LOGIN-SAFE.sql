-- L D MODERN EDUCATION ACADEMY
-- V114.3 Teacher Login Safe Migration — 2026-09-23
-- IDEMPOTENT / NON-DESTRUCTIVE: no DELETE, TRUNCATE, DROP TABLE, or data reset.

CREATE INDEX IF NOT EXISTS idx_v1143_teacher_profiles_auth_user_id
  ON public.teacher_profiles(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_v1143_teacher_class_active
  ON public.teacher_class_assignments(teacher_profile_id,is_active);
CREATE INDEX IF NOT EXISTS idx_v1143_teacher_subject_active
  ON public.teacher_subject_assignments(teacher_profile_id,is_active);

-- Authenticated teacher gets only their own profile + active assignments.
-- SECURITY DEFINER prevents recursive/contradictory table RLS from breaking login context.
CREATE OR REPLACE FUNCTION public.v1143_my_teacher_context()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_tp public.teacher_profiles%ROWTYPE;
  v_classes jsonb := '[]'::jsonb;
  v_subjects jsonb := '[]'::jsonb;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Login required' USING ERRCODE='42501';
  END IF;

  SELECT * INTO v_tp
  FROM public.teacher_profiles
  WHERE auth_user_id = v_uid
  ORDER BY updated_at DESC NULLS LAST
  LIMIT 1;

  IF v_tp.id IS NULL THEN
    RETURN jsonb_build_object('teacher',NULL,'classes','[]'::jsonb,'subjects','[]'::jsonb);
  END IF;

  SELECT COALESCE(jsonb_agg(to_jsonb(x) ORDER BY x.class_name),'[]'::jsonb)
    INTO v_classes
  FROM public.teacher_class_assignments x
  WHERE x.teacher_profile_id=v_tp.id AND COALESCE(x.is_active,true)=true;

  SELECT COALESCE(jsonb_agg(to_jsonb(x) ORDER BY x.class_name,x.subject_name),'[]'::jsonb)
    INTO v_subjects
  FROM public.teacher_subject_assignments x
  WHERE x.teacher_profile_id=v_tp.id AND COALESCE(x.is_active,true)=true;

  RETURN jsonb_build_object('teacher',to_jsonb(v_tp),'classes',v_classes,'subjects',v_subjects);
END;
$$;

REVOKE ALL ON FUNCTION public.v1143_my_teacher_context() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.v1143_my_teacher_context() TO authenticated;

NOTIFY pgrst, 'reload schema';
SELECT 'V114.3 Teacher Login migration applied safely' AS status;
