-- V57 additive / idempotent / non-destructive
create extension if not exists pgcrypto;
create table if not exists public.v57_global_guidance(
 id uuid primary key default gen_random_uuid(), title text not null default 'School Guidance', message text not null,
 audience text not null default 'all' check (audience in ('all','public','teacher','parent')), is_active boolean not null default true,
 expires_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create index if not exists ix_v57_guidance_active on public.v57_global_guidance(is_active,audience,updated_at desc);
alter table if exists public.teacher_profiles add column if not exists relieved_at timestamptz;
alter table if exists public.teacher_profiles add column if not exists relieved_reason text;
alter table if exists public.staff add column if not exists dob date;
-- Student master remains the identity source. No DROP/DELETE/data reset in this migration.
