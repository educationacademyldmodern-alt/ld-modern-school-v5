-- LDM ERP V278: ADDITIVE, IDEMPOTENT, ADMIN-ONLY LINK MANAGER
-- No existing tables or policies are deleted or modified. If V277 policies already exist, they stay unchanged.
-- Verify active admin permissions after installation; this migration never elevates non-admin.
-- Run once in the CURRENT production Supabase SQL Editor after backing up.
CREATE TABLE IF NOT EXISTS public.ldm_admin_shortcuts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(trim(name)) BETWEEN 1 AND 70),
  url text NOT NULL CHECK (url ~ '^https://[^ ]+$' AND char_length(url) <= 2000),
  description text NOT NULL DEFAULT '' CHECK (char_length(description) <= 150),
  sort_order integer NOT NULL DEFAULT 100,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ldm_admin_shortcuts ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ldm_admin_shortcuts TO authenticated;
CREATE INDEX IF NOT EXISTS ldm_admin_shortcuts_order_idx ON public.ldm_admin_shortcuts(sort_order,id);
-- Active, signed-in ERP administrators only, enforced in the database.
DO $policy$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='ldm_admin_shortcuts' AND policyname='ldm_shortcuts_admin_select') THEN
    CREATE POLICY ldm_shortcuts_admin_select ON public.ldm_admin_shortcuts FOR SELECT TO authenticated
      USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND lower(btrim(coalesce(p.role,''))) IN ('admin','super_admin','principal') AND lower(btrim(coalesce(p.status,'active')))='active'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='ldm_admin_shortcuts' AND policyname='ldm_shortcuts_admin_insert') THEN
    CREATE POLICY ldm_shortcuts_admin_insert ON public.ldm_admin_shortcuts FOR INSERT TO authenticated
      WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND lower(btrim(coalesce(p.role,''))) IN ('admin','super_admin','principal') AND lower(btrim(coalesce(p.status,'active')))='active'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='ldm_admin_shortcuts' AND policyname='ldm_shortcuts_admin_update') THEN
    CREATE POLICY ldm_shortcuts_admin_update ON public.ldm_admin_shortcuts FOR UPDATE TO authenticated
      USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND lower(btrim(coalesce(p.role,''))) IN ('admin','super_admin','principal') AND lower(btrim(coalesce(p.status,'active')))='active'))
      WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND lower(btrim(coalesce(p.role,''))) IN ('admin','super_admin','principal') AND lower(btrim(coalesce(p.status,'active')))='active'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='ldm_admin_shortcuts' AND policyname='ldm_shortcuts_admin_delete') THEN
    CREATE POLICY ldm_shortcuts_admin_delete ON public.ldm_admin_shortcuts FOR DELETE TO authenticated
      USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND lower(btrim(coalesce(p.role,''))) IN ('admin','super_admin','principal') AND lower(btrim(coalesce(p.status,'active')))='active'));
  END IF;
END $policy$;
