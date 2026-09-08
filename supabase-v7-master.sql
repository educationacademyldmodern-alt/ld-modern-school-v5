-- L D MODERN EDUCATION ACADEMY - V5 MASTER REPAIR / UPGRADE SQL
-- Safe intent: create missing tables/columns and refresh RLS policies without deleting business data.

create extension if not exists pgcrypto;

-- ---------- USERS / ROLES ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role text default 'viewer',
  status text default 'active',
  linked_admission_no text,
  created_at timestamptz default now()
);
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists role text default 'viewer';
alter table public.profiles add column if not exists status text default 'active';
alter table public.profiles add column if not exists linked_admission_no text;
alter table public.profiles add column if not exists created_at timestamptz default now();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare n int;
begin
  select count(*) into n from public.profiles;
  insert into public.profiles(id,email,full_name,role,status)
  values(
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name',new.email),
    case when n=0 then 'super_admin' else 'viewer' end,
    'active'
  )
  on conflict(id) do nothing;
  return new;
end
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.my_role()
returns text language sql stable security definer set search_path=public
as $$select role from public.profiles where id=auth.uid() and status='active'$$;

create or replace function public.role_in(r text[])
returns boolean language sql stable security definer set search_path=public
as $$select coalesce(public.my_role()=any(r),false)$$;

-- ---------- SCHOOL SETTINGS ----------
create table if not exists public.school_settings(id int primary key default 1);
alter table public.school_settings add column if not exists school_name text;
alter table public.school_settings add column if not exists tagline text;
alter table public.school_settings add column if not exists logo_url text;
alter table public.school_settings add column if not exists hero_image_url text;
alter table public.school_settings add column if not exists hero_title text;
alter table public.school_settings add column if not exists hero_text text;
alter table public.school_settings add column if not exists about_text text;
alter table public.school_settings add column if not exists principal_message text;
alter table public.school_settings add column if not exists phone text;
alter table public.school_settings add column if not exists address text;
insert into public.school_settings(id,school_name)
values(1,'L D MODERN EDUCATION ACADEMY')
on conflict(id) do nothing;

-- ---------- ADMISSIONS ----------
create table if not exists public.admissions(id uuid primary key default gen_random_uuid());
alter table public.admissions add column if not exists admission_no text;
alter table public.admissions add column if not exists admission_date date;
alter table public.admissions add column if not exists academic_session text;
alter table public.admissions add column if not exists student_name text;
alter table public.admissions add column if not exists class_name text;
alter table public.admissions add column if not exists section text;
alter table public.admissions add column if not exists roll_no text;
alter table public.admissions add column if not exists dob date;
alter table public.admissions add column if not exists gender text;
alter table public.admissions add column if not exists pen_no text;
alter table public.admissions add column if not exists apaar_id text;
alter table public.admissions add column if not exists udise_student_id text;
alter table public.admissions add column if not exists father_name text;
alter table public.admissions add column if not exists mother_name text;
alter table public.admissions add column if not exists guardian_name text;
alter table public.admissions add column if not exists primary_phone text;
alter table public.admissions add column if not exists email text;
alter table public.admissions add column if not exists parent_email text;
alter table public.admissions add column if not exists address text;
alter table public.admissions add column if not exists district text;
alter table public.admissions add column if not exists state text;
alter table public.admissions add column if not exists pincode text;
alter table public.admissions add column if not exists document_status text;
alter table public.admissions add column if not exists tc_no text;
alter table public.admissions add column if not exists admission_status text;
alter table public.admissions add column if not exists created_at timestamptz default now();

-- ---------- STUDENTS ----------
create table if not exists public.students(id uuid primary key default gen_random_uuid());
alter table public.students add column if not exists student_name text;
alter table public.students add column if not exists admission_no text;
alter table public.students add column if not exists student_id text;
alter table public.students add column if not exists roll_no text;
alter table public.students add column if not exists class_name text;
alter table public.students add column if not exists section text;
alter table public.students add column if not exists father_name text;
alter table public.students add column if not exists mother_name text;
alter table public.students add column if not exists phone text;
alter table public.students add column if not exists student_email text;
alter table public.students add column if not exists parent_email text;
alter table public.students add column if not exists address text;
alter table public.students add column if not exists status text default 'Active';
alter table public.students add column if not exists created_at timestamptz default now();

-- ---------- ACADEMICS ----------
create table if not exists public.academics(id uuid primary key default gen_random_uuid());
alter table public.academics add column if not exists academic_session text;
alter table public.academics add column if not exists class_name text;
alter table public.academics add column if not exists section text;
alter table public.academics add column if not exists subject text;
alter table public.academics add column if not exists teacher_name text;
alter table public.academics add column if not exists assignment_note text;
alter table public.academics add column if not exists created_at timestamptz default now();

-- ---------- ATTENDANCE ----------
create table if not exists public.attendance(id uuid primary key default gen_random_uuid());
alter table public.attendance add column if not exists date date;
alter table public.attendance add column if not exists student_name text;
alter table public.attendance add column if not exists admission_no text;
alter table public.attendance add column if not exists class_name text;
alter table public.attendance add column if not exists section text;
alter table public.attendance add column if not exists status text;
alter table public.attendance add column if not exists remark text;
alter table public.attendance add column if not exists created_at timestamptz default now();
create unique index if not exists attendance_date_admission_no_uq on public.attendance(date,admission_no);

-- ---------- STAFF ATTENDANCE ----------
create table if not exists public.staff_attendance(id uuid primary key default gen_random_uuid());
alter table public.staff_attendance add column if not exists date date;
alter table public.staff_attendance add column if not exists staff_name text;
alter table public.staff_attendance add column if not exists employee_id text;
alter table public.staff_attendance add column if not exists status text;
alter table public.staff_attendance add column if not exists remark text;
alter table public.staff_attendance add column if not exists created_at timestamptz default now();

-- ---------- FEES ----------
create table if not exists public.fees(id uuid primary key default gen_random_uuid());
alter table public.fees add column if not exists date date;
alter table public.fees add column if not exists receipt_no text;
alter table public.fees add column if not exists student_name text;
alter table public.fees add column if not exists admission_no text;
alter table public.fees add column if not exists class_name text;
alter table public.fees add column if not exists phone text;
alter table public.fees add column if not exists fee_type text;
alter table public.fees add column if not exists installment text;
alter table public.fees add column if not exists total_fee numeric default 0;
alter table public.fees add column if not exists discount numeric default 0;
alter table public.fees add column if not exists paid_amount numeric default 0;
alter table public.fees add column if not exists due_amount numeric default 0;
alter table public.fees add column if not exists payment_mode text;
alter table public.fees add column if not exists due_date date;
alter table public.fees add column if not exists note text;
alter table public.fees add column if not exists created_at timestamptz default now();

-- ---------- EXAMS / RESULTS ----------
create table if not exists public.exams(id uuid primary key default gen_random_uuid());
alter table public.exams add column if not exists exam_name text;
alter table public.exams add column if not exists exam_date date;
alter table public.exams add column if not exists student_name text;
alter table public.exams add column if not exists admission_no text;
alter table public.exams add column if not exists class_name text;
alter table public.exams add column if not exists subject text;
alter table public.exams add column if not exists internal_marks numeric default 0;
alter table public.exams add column if not exists external_marks numeric default 0;
alter table public.exams add column if not exists max_marks numeric default 0;
alter table public.exams add column if not exists total_marks numeric default 0;
alter table public.exams add column if not exists percentage numeric default 0;
alter table public.exams add column if not exists grade text;
alter table public.exams add column if not exists result_status text;
alter table public.exams add column if not exists created_at timestamptz default now();
create index if not exists exams_admission_status_idx on public.exams(admission_no,result_status);

-- ---------- STAFF ----------
create table if not exists public.staff(id uuid primary key default gen_random_uuid());
alter table public.staff add column if not exists employee_id text;
alter table public.staff add column if not exists staff_name text;
alter table public.staff add column if not exists staff_type text;
alter table public.staff add column if not exists designation text;
alter table public.staff add column if not exists subject text;
alter table public.staff add column if not exists phone text;
alter table public.staff add column if not exists email text;
alter table public.staff add column if not exists joining_date date;
alter table public.staff add column if not exists salary numeric default 0;
alter table public.staff add column if not exists status text default 'Active';
alter table public.staff add column if not exists created_at timestamptz default now();

-- ---------- STAFF LEAVE ----------
create table if not exists public.leave(id uuid primary key default gen_random_uuid());
alter table public.leave add column if not exists staff_name text;
alter table public.leave add column if not exists employee_id text;
alter table public.leave add column if not exists from_date date;
alter table public.leave add column if not exists to_date date;
alter table public.leave add column if not exists leave_type text;
alter table public.leave add column if not exists reason text;
alter table public.leave add column if not exists status text;
alter table public.leave add column if not exists created_at timestamptz default now();

-- ---------- PAYROLL ----------
create table if not exists public.payroll(id uuid primary key default gen_random_uuid());
alter table public.payroll add column if not exists month text;
alter table public.payroll add column if not exists employee_id text;
alter table public.payroll add column if not exists staff_name text;
alter table public.payroll add column if not exists basic_salary numeric default 0;
alter table public.payroll add column if not exists allowance numeric default 0;
alter table public.payroll add column if not exists deduction numeric default 0;
alter table public.payroll add column if not exists net_salary numeric default 0;
alter table public.payroll add column if not exists payment_date date;
alter table public.payroll add column if not exists payment_mode text;
alter table public.payroll add column if not exists status text;
alter table public.payroll add column if not exists created_at timestamptz default now();

-- ---------- TIMETABLE ----------
create table if not exists public.timetable(id uuid primary key default gen_random_uuid());
alter table public.timetable add column if not exists class_name text;
alter table public.timetable add column if not exists section text;
alter table public.timetable add column if not exists day_name text;
alter table public.timetable add column if not exists period_no int;
alter table public.timetable add column if not exists start_time time;
alter table public.timetable add column if not exists end_time time;
alter table public.timetable add column if not exists subject text;
alter table public.timetable add column if not exists teacher_name text;
alter table public.timetable add column if not exists created_at timestamptz default now();

-- ---------- HOMEWORK ----------
create table if not exists public.homework(id uuid primary key default gen_random_uuid());
alter table public.homework add column if not exists date date;
alter table public.homework add column if not exists class_name text;
alter table public.homework add column if not exists section text;
alter table public.homework add column if not exists subject text;
alter table public.homework add column if not exists title text;
alter table public.homework add column if not exists description text;
alter table public.homework add column if not exists due_date date;
alter table public.homework add column if not exists teacher_name text;
alter table public.homework add column if not exists created_at timestamptz default now();

-- ---------- EVENTS ----------
create table if not exists public.events(id uuid primary key default gen_random_uuid());
alter table public.events add column if not exists event_date date;
alter table public.events add column if not exists title text;
alter table public.events add column if not exists event_type text;
alter table public.events add column if not exists description text;
alter table public.events add column if not exists audience text;
alter table public.events add column if not exists reminder text;
alter table public.events add column if not exists created_at timestamptz default now();

-- ---------- NOTICES ----------
create table if not exists public.notices(id uuid primary key default gen_random_uuid());
alter table public.notices add column if not exists date date;
alter table public.notices add column if not exists title text;
alter table public.notices add column if not exists audience text;
alter table public.notices add column if not exists message text;
alter table public.notices add column if not exists download_url text;
alter table public.notices add column if not exists created_at timestamptz default now();

-- ---------- GALLERY ----------
create table if not exists public.gallery(id uuid primary key default gen_random_uuid());
alter table public.gallery add column if not exists title text;
alter table public.gallery add column if not exists media_type text;
alter table public.gallery add column if not exists media_url text;
alter table public.gallery add column if not exists event_date date;
alter table public.gallery add column if not exists created_at timestamptz default now();

-- ---------- ENQUIRIES ----------
create table if not exists public.enquiries(id uuid primary key default gen_random_uuid());
alter table public.enquiries add column if not exists name text;
alter table public.enquiries add column if not exists phone text;
alter table public.enquiries add column if not exists email text;
alter table public.enquiries add column if not exists message text;
alter table public.enquiries add column if not exists status text default 'New';
alter table public.enquiries add column if not exists created_at timestamptz default now();

-- ---------- TRANSPORT ----------
create table if not exists public.transport(id uuid primary key default gen_random_uuid());
alter table public.transport add column if not exists route_name text;
alter table public.transport add column if not exists vehicle_no text;
alter table public.transport add column if not exists driver_name text;
alter table public.transport add column if not exists driver_phone text;
alter table public.transport add column if not exists student_name text;
alter table public.transport add column if not exists pickup_point text;
alter table public.transport add column if not exists monthly_fee numeric default 0;
alter table public.transport add column if not exists created_at timestamptz default now();

-- ---------- LIBRARY ----------
create table if not exists public.library(id uuid primary key default gen_random_uuid());
alter table public.library add column if not exists book_code text;
alter table public.library add column if not exists book_title text;
alter table public.library add column if not exists author text;
alter table public.library add column if not exists student_name text;
alter table public.library add column if not exists issue_date date;
alter table public.library add column if not exists due_date date;
alter table public.library add column if not exists status text;
alter table public.library add column if not exists created_at timestamptz default now();

-- ---------- INCOME ----------
create table if not exists public.income(id uuid primary key default gen_random_uuid());
alter table public.income add column if not exists date date;
alter table public.income add column if not exists source text;
alter table public.income add column if not exists amount numeric default 0;
alter table public.income add column if not exists payment_mode text;
alter table public.income add column if not exists note text;
alter table public.income add column if not exists created_at timestamptz default now();

-- ---------- EXPENSES ----------
create table if not exists public.expenses(id uuid primary key default gen_random_uuid());
alter table public.expenses add column if not exists date date;
alter table public.expenses add column if not exists category text;
alter table public.expenses add column if not exists vendor text;
alter table public.expenses add column if not exists amount numeric default 0;
alter table public.expenses add column if not exists payment_mode text;
alter table public.expenses add column if not exists note text;
alter table public.expenses add column if not exists created_at timestamptz default now();

-- ---------- RLS ----------
alter table public.profiles enable row level security;
alter table public.school_settings enable row level security;
do $$
declare t text;
begin
  foreach t in array array[
    'admissions','students','academics','attendance','staff_attendance','fees','exams','staff','leave','payroll',
    'timetable','homework','events','notices','gallery','enquiries','transport','library','income','expenses'
  ] loop
    execute format('alter table public.%I enable row level security',t);
  end loop;
end$$;

-- ---------- GRANTS ----------
grant usage on schema public to anon, authenticated;
grant select on public.school_settings, public.staff, public.events, public.notices, public.gallery to anon, authenticated;
grant insert on public.admissions, public.enquiries to anon, authenticated;
grant select on public.exams to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;

-- ---------- PROFILE POLICIES ----------
drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles for select to authenticated
using(id=auth.uid() or public.role_in(array['super_admin','admin','principal']));

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update to authenticated
using(public.role_in(array['super_admin','admin']))
with check(public.role_in(array['super_admin','admin']));

-- ---------- SCHOOL SETTINGS POLICIES ----------
drop policy if exists school_public on public.school_settings;
drop policy if exists school_settings_public_read on public.school_settings;
create policy school_public on public.school_settings for select to anon,authenticated using(true);

drop policy if exists school_write on public.school_settings;
drop policy if exists school_settings_admin_write on public.school_settings;
create policy school_write on public.school_settings for all to authenticated
using(public.role_in(array['super_admin','admin','principal']))
with check(public.role_in(array['super_admin','admin','principal']));

-- ---------- PUBLIC READ POLICIES ----------
do $$
declare t text;
begin
  foreach t in array array['staff','events','notices','gallery'] loop
    execute format('drop policy if exists public_read on public.%I',t);
    execute format('create policy public_read on public.%I for select to anon,authenticated using(true)',t);
  end loop;
end$$;

-- ---------- PUBLIC FORM POLICIES ----------
drop policy if exists public_admission on public.admissions;
drop policy if exists public_admission_authenticated on public.admissions;
create policy public_admission on public.admissions for insert to anon,authenticated
with check(admission_status='Applied');

drop policy if exists public_enquiry on public.enquiries;
drop policy if exists public_insert_enquiries on public.enquiries;
drop policy if exists enquiries_insert on public.enquiries;
create policy public_enquiry on public.enquiries for insert to anon,authenticated with check(true);

drop policy if exists public_result on public.exams;
create policy public_result on public.exams for select to anon,authenticated
using(result_status='Published');

-- ---------- AUTHENTICATED READ ----------
do $$
declare t text;
begin
  foreach t in array array[
    'admissions','students','academics','attendance','staff_attendance','fees','exams','staff','leave','payroll',
    'timetable','homework','events','notices','gallery','enquiries','transport','library','income','expenses'
  ] loop
    execute format('drop policy if exists auth_read on public.%I',t);
    execute format('create policy auth_read on public.%I for select to authenticated using(public.my_role() is not null)',t);
  end loop;
end$$;

-- ---------- ROLE-BASED WRITES ----------
do $$
declare t text;
begin
  foreach t in array array['admissions','students','enquiries'] loop
    execute format('drop policy if exists admission_write on public.%I',t);
    execute format('create policy admission_write on public.%I for all to authenticated using(public.role_in(array[''super_admin'',''admin'',''principal'',''admission''])) with check(public.role_in(array[''super_admin'',''admin'',''principal'',''admission'']))',t);
  end loop;
end$$;

do $$
declare t text;
begin
  foreach t in array array['academics','staff_attendance','staff','leave','gallery'] loop
    execute format('drop policy if exists principal_write on public.%I',t);
    execute format('create policy principal_write on public.%I for all to authenticated using(public.role_in(array[''super_admin'',''admin'',''principal''])) with check(public.role_in(array[''super_admin'',''admin'',''principal'']))',t);
  end loop;
end$$;

do $$
declare t text;
begin
  foreach t in array array['attendance','exams','timetable','homework','events','notices'] loop
    execute format('drop policy if exists teacher_write on public.%I',t);
    execute format('create policy teacher_write on public.%I for all to authenticated using(public.role_in(array[''super_admin'',''admin'',''principal'',''teacher''])) with check(public.role_in(array[''super_admin'',''admin'',''principal'',''teacher'']))',t);
  end loop;
end$$;

do $$
declare t text;
begin
  foreach t in array array['fees','payroll','income','expenses'] loop
    execute format('drop policy if exists account_write on public.%I',t);
    execute format('create policy account_write on public.%I for all to authenticated using(public.role_in(array[''super_admin'',''admin'',''principal'',''accountant''])) with check(public.role_in(array[''super_admin'',''admin'',''principal'',''accountant'']))',t);
  end loop;
end$$;

drop policy if exists transport_write on public.transport;
create policy transport_write on public.transport for all to authenticated
using(public.role_in(array['super_admin','admin','principal','transport']))
with check(public.role_in(array['super_admin','admin','principal','transport']));

drop policy if exists library_write on public.library;
create policy library_write on public.library for all to authenticated
using(public.role_in(array['super_admin','admin','principal','librarian']))
with check(public.role_in(array['super_admin','admin','principal','librarian']));

-- ---------- DONE ----------
select 'V5 MASTER REPAIR COMPLETE' as status;


-- =====================================================================
-- V5 PLUS UPGRADE: UNIVERSAL ADD/EDIT/DELETE + MEDIA + FLEXIBLE FEES
-- Safe/idempotent additions. Existing business data is preserved.
-- =====================================================================

-- ---------- COMMON AUDIT COLUMNS ----------
do $$
declare t text;
begin
  foreach t in array array[
    'admissions','students','academics','attendance','staff_attendance','fees','exams','staff','leave','payroll',
    'timetable','homework','events','notices','gallery','enquiries','transport','library','income','expenses'
  ] loop
    execute format('alter table public.%I add column if not exists updated_at timestamptz default now()',t);
    execute format('alter table public.%I add column if not exists is_active boolean default true',t);
  end loop;
end$$;

-- ---------- ADMISSION PHOTO / CAMERA / DOCUMENT SUPPORT ----------
alter table public.admissions add column if not exists photo_url text;
alter table public.admissions add column if not exists photo_path text;
alter table public.admissions add column if not exists photo_source text; -- upload / camera
alter table public.admissions add column if not exists photo_taken_at timestamptz;
alter table public.admissions add column if not exists birth_certificate_url text;
alter table public.admissions add column if not exists aadhaar_url text;
alter table public.admissions add column if not exists tc_url text;
alter table public.admissions add column if not exists other_documents jsonb default '{}'::jsonb;
alter table public.admissions add column if not exists remarks text;

-- ---------- STUDENT PHOTO / CAMERA / DOCUMENT SUPPORT ----------
alter table public.students add column if not exists dob date;
alter table public.students add column if not exists gender text;
alter table public.students add column if not exists photo_url text;
alter table public.students add column if not exists photo_path text;
alter table public.students add column if not exists photo_source text; -- upload / camera
alter table public.students add column if not exists photo_taken_at timestamptz;
alter table public.students add column if not exists guardian_name text;
alter table public.students add column if not exists emergency_phone text;
alter table public.students add column if not exists documents jsonb default '{}'::jsonb;
alter table public.students add column if not exists remarks text;
create unique index if not exists students_admission_no_uq on public.students(admission_no) where admission_no is not null;

-- ---------- GALLERY: IMAGE + VIDEO UPLOAD SUPPORT ----------
alter table public.gallery add column if not exists caption text;
alter table public.gallery add column if not exists media_type text; -- image / video
alter table public.gallery add column if not exists media_url text;
alter table public.gallery add column if not exists storage_path text;
alter table public.gallery add column if not exists thumbnail_url text;
alter table public.gallery add column if not exists file_name text;
alter table public.gallery add column if not exists mime_type text;
alter table public.gallery add column if not exists file_size bigint;
alter table public.gallery add column if not exists event_date date;
alter table public.gallery add column if not exists display_order int default 0;
alter table public.gallery add column if not exists status text default 'Published';

-- ---------- FLEXIBLE FEE STRUCTURE ----------
create table if not exists public.fee_structures(
  id uuid primary key default gen_random_uuid(),
  academic_session text,
  class_name text,
  plan_name text,
  plan_type text default 'Monthly', -- Monthly / Installment / Custom / One Time
  total_amount numeric default 0,
  admission_fee numeric default 0,
  annual_charge numeric default 0,
  transport_fee numeric default 0,
  discount_allowed boolean default true,
  notes text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.fee_installments(
  id uuid primary key default gen_random_uuid(),
  fee_structure_id uuid references public.fee_structures(id) on delete cascade,
  installment_name text,
  month_name text,
  due_date date,
  amount numeric default 0,
  late_fee numeric default 0,
  sort_order int default 0,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.fee_heads(
  id uuid primary key default gen_random_uuid(),
  fee_structure_id uuid references public.fee_structures(id) on delete cascade,
  head_name text,
  amount numeric default 0,
  recurring boolean default false,
  frequency text, -- Monthly / Quarterly / Yearly / Custom
  sort_order int default 0,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.fees add column if not exists fee_structure_id uuid;
alter table public.fees add column if not exists installment_id uuid;
alter table public.fees add column if not exists fee_month text;
alter table public.fees add column if not exists custom_installment_label text;
alter table public.fees add column if not exists fee_head text;
alter table public.fees add column if not exists late_fee numeric default 0;
alter table public.fees add column if not exists concession_reason text;
alter table public.fees add column if not exists transaction_ref text;
alter table public.fees add column if not exists payment_status text default 'Pending';
create index if not exists fees_admission_no_idx on public.fees(admission_no);
create index if not exists fee_installments_structure_idx on public.fee_installments(fee_structure_id);

-- ---------- EXTRA EDITABLE MASTER DATA ----------
create table if not exists public.classes(
  id uuid primary key default gen_random_uuid(),
  class_name text not null,
  display_order int default 0,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.sections(
  id uuid primary key default gen_random_uuid(),
  class_name text,
  section_name text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.subjects(
  id uuid primary key default gen_random_uuid(),
  class_name text,
  subject_name text,
  subject_code text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ---------- UPDATED_AT TRIGGER ----------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end$$;

do $$
declare t text;
begin
  foreach t in array array[
    'admissions','students','academics','attendance','staff_attendance','fees','exams','staff','leave','payroll',
    'timetable','homework','events','notices','gallery','enquiries','transport','library','income','expenses',
    'fee_structures','fee_installments','fee_heads','classes','sections','subjects'
  ] loop
    execute format('drop trigger if exists trg_%I_updated_at on public.%I',t,t);
    execute format('create trigger trg_%I_updated_at before update on public.%I for each row execute function public.set_updated_at()',t,t);
  end loop;
end$$;

-- ---------- RLS FOR NEW TABLES ----------
alter table public.fee_structures enable row level security;
alter table public.fee_installments enable row level security;
alter table public.fee_heads enable row level security;
alter table public.classes enable row level security;
alter table public.sections enable row level security;
alter table public.subjects enable row level security;

grant select,insert,update,delete on public.fee_structures,public.fee_installments,public.fee_heads to authenticated;
grant select,insert,update,delete on public.classes,public.sections,public.subjects to authenticated;
grant select on public.classes,public.sections,public.subjects to anon;

-- Public can read active class/section/subject masters.
drop policy if exists public_read_classes on public.classes;
create policy public_read_classes on public.classes for select to anon,authenticated using(is_active=true);
drop policy if exists public_read_sections on public.sections;
create policy public_read_sections on public.sections for select to anon,authenticated using(is_active=true);
drop policy if exists public_read_subjects on public.subjects;
create policy public_read_subjects on public.subjects for select to anon,authenticated using(is_active=true);

-- Admin/principal can add/edit/delete class/section/subject master data.
do $$
declare t text;
begin
  foreach t in array array['classes','sections','subjects'] loop
    execute format('drop policy if exists master_write on public.%I',t);
    execute format('create policy master_write on public.%I for all to authenticated using(public.role_in(array[''super_admin'',''admin'',''principal''])) with check(public.role_in(array[''super_admin'',''admin'',''principal'']))',t);
  end loop;
end$$;

-- Fee structures/installments/heads: owner/admin/principal/accountant full CRUD.
do $$
declare t text;
begin
  foreach t in array array['fee_structures','fee_installments','fee_heads'] loop
    execute format('drop policy if exists fee_master_read on public.%I',t);
    execute format('create policy fee_master_read on public.%I for select to authenticated using(public.my_role() is not null)',t);
    execute format('drop policy if exists fee_master_write on public.%I',t);
    execute format('create policy fee_master_write on public.%I for all to authenticated using(public.role_in(array[''super_admin'',''admin'',''principal'',''accountant''])) with check(public.role_in(array[''super_admin'',''admin'',''principal'',''accountant'']))',t);
  end loop;
end$$;

-- ---------- UNIVERSAL CRUD REINFORCEMENT FOR EXISTING MODULES ----------
-- These policies make Add/Edit/Delete available to authorized ERP roles.
do $$
declare t text;
begin
  foreach t in array array['admissions','students','enquiries'] loop
    execute format('drop policy if exists module_crud on public.%I',t);
    execute format('create policy module_crud on public.%I for all to authenticated using(public.role_in(array[''super_admin'',''admin'',''principal'',''admission''])) with check(public.role_in(array[''super_admin'',''admin'',''principal'',''admission'']))',t);
  end loop;

  foreach t in array array['academics','staff','staff_attendance','leave','gallery'] loop
    execute format('drop policy if exists module_crud on public.%I',t);
    execute format('create policy module_crud on public.%I for all to authenticated using(public.role_in(array[''super_admin'',''admin'',''principal''])) with check(public.role_in(array[''super_admin'',''admin'',''principal'']))',t);
  end loop;

  foreach t in array array['attendance','exams','timetable','homework','events','notices'] loop
    execute format('drop policy if exists module_crud on public.%I',t);
    execute format('create policy module_crud on public.%I for all to authenticated using(public.role_in(array[''super_admin'',''admin'',''principal'',''teacher''])) with check(public.role_in(array[''super_admin'',''admin'',''principal'',''teacher'']))',t);
  end loop;

  foreach t in array array['fees','payroll','income','expenses'] loop
    execute format('drop policy if exists module_crud on public.%I',t);
    execute format('create policy module_crud on public.%I for all to authenticated using(public.role_in(array[''super_admin'',''admin'',''principal'',''accountant''])) with check(public.role_in(array[''super_admin'',''admin'',''principal'',''accountant'']))',t);
  end loop;
end$$;

-- ---------- SUPABASE STORAGE BUCKETS ----------
-- gallery-media: public website media (image/video)
-- student-media: private student/admission photos & documents
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values(
  'gallery-media','gallery-media',true,52428800,array['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm','video/quicktime']
)
on conflict(id) do update set
  public=excluded.public,
  file_size_limit=excluded.file_size_limit,
  allowed_mime_types=excluded.allowed_mime_types;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values(
  'student-media','student-media',false,10485760,array['image/jpeg','image/png','image/webp','application/pdf']
)
on conflict(id) do update set
  public=excluded.public,
  file_size_limit=excluded.file_size_limit,
  allowed_mime_types=excluded.allowed_mime_types;

-- Gallery public read.
drop policy if exists gallery_media_public_read on storage.objects;
create policy gallery_media_public_read on storage.objects
for select to anon,authenticated
using(bucket_id='gallery-media');

-- Gallery upload/edit/delete by school management.
drop policy if exists gallery_media_insert on storage.objects;
create policy gallery_media_insert on storage.objects
for insert to authenticated
with check(bucket_id='gallery-media' and public.role_in(array['super_admin','admin','principal']));

drop policy if exists gallery_media_update on storage.objects;
create policy gallery_media_update on storage.objects
for update to authenticated
using(bucket_id='gallery-media' and public.role_in(array['super_admin','admin','principal']))
with check(bucket_id='gallery-media' and public.role_in(array['super_admin','admin','principal']));

drop policy if exists gallery_media_delete on storage.objects;
create policy gallery_media_delete on storage.objects
for delete to authenticated
using(bucket_id='gallery-media' and public.role_in(array['super_admin','admin','principal']));

-- Student/admission media: private read/write for authorized ERP roles.
drop policy if exists student_media_read on storage.objects;
create policy student_media_read on storage.objects
for select to authenticated
using(bucket_id='student-media' and public.role_in(array['super_admin','admin','principal','admission','teacher']));

drop policy if exists student_media_insert_auth on storage.objects;
create policy student_media_insert_auth on storage.objects
for insert to authenticated
with check(bucket_id='student-media' and public.role_in(array['super_admin','admin','principal','admission']));

drop policy if exists student_media_update on storage.objects;
create policy student_media_update on storage.objects
for update to authenticated
using(bucket_id='student-media' and public.role_in(array['super_admin','admin','principal','admission']))
with check(bucket_id='student-media' and public.role_in(array['super_admin','admin','principal','admission']));

drop policy if exists student_media_delete on storage.objects;
create policy student_media_delete on storage.objects
for delete to authenticated
using(bucket_id='student-media' and public.role_in(array['super_admin','admin','principal','admission']));

-- Optional public admission photo upload into a restricted folder prefix "public-admission/".
-- This permits upload only; files remain private and are not publicly readable.
drop policy if exists admission_media_public_insert on storage.objects;
create policy admission_media_public_insert on storage.objects
for insert to anon
with check(bucket_id='student-media' and (storage.foldername(name))[1]='public-admission');

-- ---------- DEFAULT CLASS MASTER (SAFE INSERTS) ----------
insert into public.classes(class_name,display_order)
select x.class_name,x.ord
from (values
 ('Nursery',1),('LKG',2),('UKG',3),('Class 1',4),('Class 2',5),('Class 3',6),('Class 4',7),('Class 5',8),
 ('Class 6',9),('Class 7',10),('Class 8',11),('Class 9',12),('Class 10',13)
) as x(class_name,ord)
where not exists (select 1 from public.classes c where lower(c.class_name)=lower(x.class_name));

-- ---------- FINAL STATUS ----------
select 'V5 PLUS MASTER UPGRADE COMPLETE' as status;

-- =========================================================
-- V7 ENQUIRY + UNIVERSAL CRUD UPGRADE
-- =========================================================
alter table public.enquiries add column if not exists enquiry_date date default current_date;
alter table public.enquiries add column if not exists source text default 'Website';
alter table public.enquiries add column if not exists follow_up_date date;
alter table public.enquiries add column if not exists assigned_to text;
alter table public.enquiries add column if not exists admin_note text;
alter table public.enquiries add column if not exists converted_admission_no text;

alter table public.enquiries enable row level security;
grant select,insert,update,delete on public.enquiries to authenticated;
grant insert on public.enquiries to anon;

drop policy if exists public_enquiry on public.enquiries;
drop policy if exists public_insert_enquiries on public.enquiries;
drop policy if exists enquiries_insert on public.enquiries;
create policy enquiries_public_insert on public.enquiries
for insert to anon, authenticated with check (true);

drop policy if exists enquiries_staff_read on public.enquiries;
create policy enquiries_staff_read on public.enquiries
for select to authenticated
using (public.role_in(array['super_admin','admin','principal','admission']));

drop policy if exists enquiries_staff_update on public.enquiries;
create policy enquiries_staff_update on public.enquiries
for update to authenticated
using (public.role_in(array['super_admin','admin','principal','admission']))
with check (public.role_in(array['super_admin','admin','principal','admission']));

drop policy if exists enquiries_staff_delete on public.enquiries;
create policy enquiries_staff_delete on public.enquiries
for delete to authenticated
using (public.role_in(array['super_admin','admin','principal','admission']));

select 'V7 UPGRADE COMPLETE' as status;
