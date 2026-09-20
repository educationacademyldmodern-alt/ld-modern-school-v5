-- L D MODERN EDUCATION ACADEMY
-- V64.9 SAFE / IDEMPOTENT / NON-DESTRUCTIVE SQL
-- Run once in Supabase SQL Editor. Safe to re-run.

-- Central Principal/Director signature (kept from V64.6+)
alter table if exists public.school_settings
  add column if not exists principal_signature_url text;
alter table if exists public.school_settings
  add column if not exists principal_signature_path text;

-- Admin-controlled Teacher ID Card permission.
-- TRUE keeps the current requested workflow available by default.
alter table if exists public.school_settings
  add column if not exists teacher_id_card_enabled boolean not null default true;

comment on column public.school_settings.principal_signature_url is
  'Central Principal/Director signature URL used by authorized school documents.';
comment on column public.school_settings.principal_signature_path is
  'Storage path for the central Principal/Director signature.';
comment on column public.school_settings.teacher_id_card_enabled is
  'Admin global permission: teachers may view/generate/preview/print ID cards only for assigned classes.';
