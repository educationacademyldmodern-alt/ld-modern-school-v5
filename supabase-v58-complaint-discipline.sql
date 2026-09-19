-- V58 Complaint / Discipline & Grievance Center
-- Additive and idempotent migration; preserves existing user records.
create extension if not exists pgcrypto;

create table if not exists public.school_complaints(
  id uuid primary key default gen_random_uuid(),
  complaint_no text unique,
  category text not null default 'Other',
  subject text not null,
  description text not null,
  source text not null default 'admin',
  complainant_name text,
  complainant_phone text,
  student_id uuid,
  teacher_profile_id uuid,
  class_name text,
  priority text not null default 'Normal',
  is_confidential boolean not null default true,
  status text not null default 'New',
  admin_note text,
  action_taken text,
  submitted_by uuid,
  reviewed_by uuid,
  reviewed_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.school_complaints add column if not exists complaint_no text;
alter table public.school_complaints add column if not exists student_id uuid;
alter table public.school_complaints add column if not exists teacher_profile_id uuid;
alter table public.school_complaints add column if not exists class_name text;
alter table public.school_complaints add column if not exists admin_note text;
alter table public.school_complaints add column if not exists action_taken text;
alter table public.school_complaints add column if not exists submitted_by uuid;
alter table public.school_complaints add column if not exists reviewed_by uuid;
alter table public.school_complaints add column if not exists reviewed_at timestamptz;
alter table public.school_complaints add column if not exists closed_at timestamptz;
create unique index if not exists ux_school_complaint_no on public.school_complaints(complaint_no) where complaint_no is not null;
create index if not exists ix_school_complaints_status on public.school_complaints(status,created_at desc);
create index if not exists ix_school_complaints_student on public.school_complaints(student_id,created_at desc);
create index if not exists ix_school_complaints_teacher on public.school_complaints(teacher_profile_id,created_at desc);

create table if not exists public.discipline_actions(
  id uuid primary key default gen_random_uuid(),
  complaint_id uuid references public.school_complaints(id) on delete restrict,
  student_id uuid,
  teacher_profile_id uuid,
  action_type text not null,
  action_note text not null,
  action_date date not null default current_date,
  verified_by uuid,
  created_at timestamptz not null default now()
);
create index if not exists ix_discipline_student on public.discipline_actions(student_id,action_date desc);
create index if not exists ix_discipline_teacher on public.discipline_actions(teacher_profile_id,action_date desc);

create or replace function public.v58_complaint_number()
returns trigger language plpgsql as $$
begin
  if new.complaint_no is null or btrim(new.complaint_no)='' then
    new.complaint_no := 'CMP-' || to_char(current_date,'YYYYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,6));
  end if;
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists trg_v58_complaint_number on public.school_complaints;
create trigger trg_v58_complaint_number before insert or update on public.school_complaints for each row execute function public.v58_complaint_number();

alter table public.school_complaints enable row level security;
alter table public.discipline_actions enable row level security;

do $$ begin
 if not exists(select 1 from pg_policies where schemaname='public' and tablename='school_complaints' and policyname='v58_public_complaint_insert') then
  create policy v58_public_complaint_insert on public.school_complaints for insert to anon with check(source='public' and status='New');
 end if;
 if not exists(select 1 from pg_policies where schemaname='public' and tablename='school_complaints' and policyname='v58_authenticated_complaint_insert') then
  create policy v58_authenticated_complaint_insert on public.school_complaints for insert to authenticated with check(submitted_by is null or submitted_by=auth.uid());
 end if;
 if not exists(select 1 from pg_policies where schemaname='public' and tablename='school_complaints' and policyname='v58_admin_complaints_all') then
  create policy v58_admin_complaints_all on public.school_complaints for all to authenticated using(public.role_in(array['super_admin','admin','principal'])) with check(public.role_in(array['super_admin','admin','principal']));
 end if;
 if not exists(select 1 from pg_policies where schemaname='public' and tablename='school_complaints' and policyname='v58_own_complaint_read') then
  create policy v58_own_complaint_read on public.school_complaints for select to authenticated using(submitted_by=auth.uid());
 end if;
 if not exists(select 1 from pg_policies where schemaname='public' and tablename='discipline_actions' and policyname='v58_admin_discipline_all') then
  create policy v58_admin_discipline_all on public.discipline_actions for all to authenticated using(public.role_in(array['super_admin','admin','principal'])) with check(public.role_in(array['super_admin','admin','principal']));
 end if;
end $$;
