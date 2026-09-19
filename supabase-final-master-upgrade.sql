-- L D MODERN EDUCATION ACADEMY
-- FINAL MASTER SAFE UPGRADE (non-destructive / re-runnable)
-- Run in Supabase SQL Editor after taking a database backup.

create table if not exists public.school_number_counters(
  key text primary key,
  last_value bigint not null default 0,
  updated_at timestamptz not null default now()
);

create or replace function public.next_school_number(p_key text, p_prefix text, p_session text default null)
returns text
language plpgsql
security definer
set search_path=public
as $$
declare n bigint; s text;
begin
  perform pg_advisory_xact_lock(hashtext('ldmodern:'||coalesce(p_key,'')));
  insert into public.school_number_counters(key,last_value,updated_at)
  values(p_key,1,now())
  on conflict(key) do update set last_value=school_number_counters.last_value+1,updated_at=now()
  returning last_value into n;
  s:=coalesce(nullif(trim(p_session),''),to_char(current_date,'YYYY')||'-'||right(to_char(current_date + interval '1 year','YYYY'),2));
  return upper(p_prefix)||'/'||s||'/'||lpad(n::text,5,'0');
end $$;

alter table public.admissions add column if not exists registration_id text;
alter table public.admissions add column if not exists academic_session text;
alter table public.students add column if not exists registration_id text;
alter table public.students add column if not exists academic_session text;
alter table public.staff add column if not exists academic_session text;
alter table public.fees add column if not exists academic_session text;
alter table public.income add column if not exists voucher_no text;
alter table public.expenses add column if not exists voucher_no text;
alter table public.notices add column if not exists letter_no text;

create unique index if not exists admissions_registration_id_uq on public.admissions(registration_id) where registration_id is not null and registration_id<>'';
create unique index if not exists admissions_admission_no_safe_uq on public.admissions(admission_no) where admission_no is not null and admission_no<>'';
create unique index if not exists staff_employee_id_safe_uq on public.staff(employee_id) where employee_id is not null and employee_id<>'';
create unique index if not exists fees_receipt_no_safe_uq on public.fees(receipt_no) where receipt_no is not null and receipt_no<>'';
create unique index if not exists income_voucher_no_uq on public.income(voucher_no) where voucher_no is not null and voucher_no<>'';
create unique index if not exists expenses_voucher_no_uq on public.expenses(voucher_no) where voucher_no is not null and voucher_no<>'';
create unique index if not exists notices_letter_no_uq on public.notices(letter_no) where letter_no is not null and letter_no<>'';

create or replace function public.ld_auto_admission_numbers() returns trigger language plpgsql set search_path=public as $$
begin
  if new.registration_id is null or btrim(new.registration_id)='' then new.registration_id:=public.next_school_number('registration','REG',new.academic_session); end if;
  if new.admission_no is null or btrim(new.admission_no)='' then new.admission_no:=public.next_school_number('admission','ADM',new.academic_session); end if;
  return new;
end $$;
drop trigger if exists trg_ld_auto_admission_numbers on public.admissions;
create trigger trg_ld_auto_admission_numbers before insert on public.admissions for each row execute function public.ld_auto_admission_numbers();

create or replace function public.ld_auto_student_numbers() returns trigger language plpgsql set search_path=public as $$
begin
  if new.registration_id is null or btrim(new.registration_id)='' then new.registration_id:=public.next_school_number('student_registration','REG',new.academic_session); end if;
  if new.admission_no is null or btrim(new.admission_no)='' then new.admission_no:=public.next_school_number('student_admission','ADM',new.academic_session); end if;
  return new;
end $$;
drop trigger if exists trg_ld_auto_student_numbers on public.students;
create trigger trg_ld_auto_student_numbers before insert on public.students for each row execute function public.ld_auto_student_numbers();

create or replace function public.ld_auto_staff_number() returns trigger language plpgsql set search_path=public as $$
begin
 if new.employee_id is null or btrim(new.employee_id)='' then new.employee_id:=public.next_school_number('employee','EMP',new.academic_session); end if; return new;
end $$;
drop trigger if exists trg_ld_auto_staff_number on public.staff;
create trigger trg_ld_auto_staff_number before insert on public.staff for each row execute function public.ld_auto_staff_number();

create or replace function public.ld_auto_fee_receipt() returns trigger language plpgsql set search_path=public as $$
begin
 if new.receipt_no is null or btrim(new.receipt_no)='' then new.receipt_no:=public.next_school_number('fee_receipt','FEE',new.academic_session); end if; return new;
end $$;
drop trigger if exists trg_ld_auto_fee_receipt on public.fees;
create trigger trg_ld_auto_fee_receipt before insert on public.fees for each row execute function public.ld_auto_fee_receipt();

create or replace function public.ld_auto_income_voucher() returns trigger language plpgsql set search_path=public as $$
begin if new.voucher_no is null or btrim(new.voucher_no)='' then new.voucher_no:=public.next_school_number('income_voucher','INC',null); end if; return new; end $$;
drop trigger if exists trg_ld_auto_income_voucher on public.income;
create trigger trg_ld_auto_income_voucher before insert on public.income for each row execute function public.ld_auto_income_voucher();

create or replace function public.ld_auto_expense_voucher() returns trigger language plpgsql set search_path=public as $$
begin if new.voucher_no is null or btrim(new.voucher_no)='' then new.voucher_no:=public.next_school_number('expense_voucher','EXP',null); end if; return new; end $$;
drop trigger if exists trg_ld_auto_expense_voucher on public.expenses;
create trigger trg_ld_auto_expense_voucher before insert on public.expenses for each row execute function public.ld_auto_expense_voucher();

create or replace function public.ld_auto_notice_letter() returns trigger language plpgsql set search_path=public as $$
begin if new.letter_no is null or btrim(new.letter_no)='' then new.letter_no:=public.next_school_number('notice_letter','LDMEA',null); end if; return new; end $$;
drop trigger if exists trg_ld_auto_notice_letter on public.notices;
create trigger trg_ld_auto_notice_letter before insert on public.notices for each row execute function public.ld_auto_notice_letter();

-- Bell-wise teaching update: one teacher/class/date/period row, safe from duplicate submit.
create table if not exists public.teaching_updates(
 id uuid primary key default gen_random_uuid(),
 update_date date not null default current_date,
 teacher_id uuid,
 teacher_name text,
 class_name text not null,
 section text,
 subject text,
 period_no int,
 lesson_topic text,
 work_done text,
 homework text,
 worksheet_url text,
 created_by uuid,
 created_at timestamptz default now(),
 updated_at timestamptz default now()
);
create unique index if not exists teaching_updates_once_uq on public.teaching_updates(update_date,coalesce(teacher_name,''),class_name,coalesce(section,''),coalesce(period_no,0));
alter table public.teaching_updates enable row level security;
grant select,insert,update,delete on public.teaching_updates to authenticated;
do $$ begin
 drop policy if exists teaching_updates_read on public.teaching_updates;
 create policy teaching_updates_read on public.teaching_updates for select to authenticated using(public.my_role() is not null);
 drop policy if exists teaching_updates_write on public.teaching_updates;
 create policy teaching_updates_write on public.teaching_updates for all to authenticated using(public.role_in(array['super_admin','admin','principal','teacher'])) with check(public.role_in(array['super_admin','admin','principal','teacher']));
exception when others then raise notice 'Teaching update policy skipped: %',sqlerrm; end $$;

-- Lightweight official report audit: stores metadata only, never generated PDFs.
create table if not exists public.report_audit(
 id uuid primary key default gen_random_uuid(), report_type text not null, report_date date,
 date_from date, date_to date, generated_by uuid, generated_at timestamptz default now()
);
alter table public.report_audit enable row level security;
grant select,insert on public.report_audit to authenticated;
do $$ begin
 drop policy if exists report_audit_admin on public.report_audit;
 create policy report_audit_admin on public.report_audit for all to authenticated using(public.role_in(array['super_admin','admin','principal'])) with check(public.role_in(array['super_admin','admin','principal']));
exception when others then raise notice 'Report audit policy skipped: %',sqlerrm; end $$;
