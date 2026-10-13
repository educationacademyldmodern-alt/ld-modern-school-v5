-- V304 combined collection: additive. Existing tables, functions and RLS remain unchanged.
-- Execute once in Supabase SQL Editor, after the school's existing fee schema is installed.
begin;
create table if not exists public.ldm_v304_receipts (
 receipt_no text primary key,
 actor uuid not null,
 request jsonb not null,
 result jsonb not null,
 created_at timestamptz not null default now()
);
alter table public.ldm_v304_receipts enable row level security;
revoke all on public.ldm_v304_receipts from anon, authenticated;
-- The narrow function below is the only write path for this new private receipt log.
create or replace function public.ldm_v304_collect_batch(
 p_receipt text,p_session text,p_date date,p_mode text,p_rows jsonb
) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare
 actor_id uuid:=auth.uid(); actor_role text; prior public.ldm_v304_receipts%rowtype;
 req jsonb; item jsonb; student public.students%rowtype; sched record;
 amount numeric; discount numeric; due numeric; remain numeric; used numeric;
 receipt text; result_rows jsonb:='[]'; result jsonb; expected numeric; snap jsonb;
begin
 select lower(role) into actor_role from public.profiles where id=actor_id
 and lower(coalesce(status,'active'))='active';
 if actor_id is null or actor_role is null or actor_role not in ('admin','super_admin','principal') then
  raise exception 'Active Admin / Principal required'; end if;
 if p_receipt is null or p_receipt !~ '^LDM-[a-f0-9-]{36}$' or length(coalesce(p_session,'')) not between 1 and 40
 or p_date is null or p_mode not in ('Cash','UPI','Bank','Cheque')
 or jsonb_typeof(p_rows) is distinct from 'array' then raise exception 'Invalid payment request'; end if;
 if jsonb_array_length(p_rows) not between 1 and 50 then raise exception 'Select 1 to 50 students'; end if;
 req:=jsonb_build_object('session',p_session,'date',p_date,'mode',p_mode,'rows',p_rows);
 perform pg_advisory_xact_lock(hashtextextended(p_receipt,304));
 select * into prior from public.ldm_v304_receipts where receipt_no=p_receipt;
 if found then
  if prior.actor<>actor_id or prior.request<>req then raise exception 'Receipt already used for another request'; end if;
  return prior.result;
 end if;
 if (select count(*) from jsonb_array_elements(p_rows))<>(select count(distinct x->>'admission_no') from jsonb_array_elements(p_rows) x)
 then raise exception 'Duplicate admission number'; end if;
 -- Lock students in stable order to serialize overlapping counters and avoid deadlocks.
 for item in select x from jsonb_array_elements(p_rows) x order by x->>'student_id' loop
  select * into student from public.students where id=(item->>'student_id')::uuid for update;
  if not found or student.admission_no is distinct from item->>'admission_no' then raise exception 'Student link mismatch'; end if;
  if lower(coalesce(student.status,'Active')) in ('inactive','deleted','trashed','recycled','left','withdrawn','archived') then raise exception 'Inactive student'; end if;
 end loop;
 for item in select x from jsonb_array_elements(p_rows) x loop
  select * into strict student from public.students where id=(item->>'student_id')::uuid;
  amount:=(item->>'amount')::numeric; discount:=(item->>'discount')::numeric; expected:=(item->>'expected_due')::numeric;
  if amount is null or discount is null or expected is null or amount::text in ('NaN','Infinity','-Infinity')
  or discount::text in ('NaN','Infinity','-Infinity') or expected::text in ('NaN','Infinity','-Infinity')
  or amount<0 or discount<0 or amount<>round(amount,2) or discount<>round(discount,2) then raise exception 'Invalid amount'; end if;
  -- Use the same central snapshot as Dashboard / Due Master; stale due cannot be collected blindly.
  select to_jsonb(x) into snap from public.ldm_fee_due_snapshot_v2(p_session=>p_session,p_admission_nos=>array[student.admission_no],p_until_month=>to_char(now() at time zone 'Asia/Kolkata','YYYY-MM')) x limit 1;
  if snap is null or snap->>'current_due' is null then raise exception 'Central due unavailable'; end if;
  due:=(snap->>'current_due')::numeric;
  if abs(due-expected)>0.01 then raise exception 'Fee balance changed for %. Remove and add this student again.',student.student_name; end if;
  if discount>greatest(0,due) or (discount>0 and length(trim(coalesce(item->>'reason','')))=0) then raise exception 'Invalid discount / reason'; end if;
  receipt:=p_receipt||'-'||student.admission_no;
  if discount>0 then
   perform public.v65_add_fee_adjustment(student.admission_no,'Waiver',discount,left(item->>'reason',200)||' • '||receipt);
  end if;
  if amount>0 then
   insert into public.fee_payments(admission_no,student_name,class_name,payment_date,amount,payment_mode,receipt_no,note)
   values(student.admission_no,student.student_name,student.class_name,p_date,amount,p_mode,receipt,'Combined counter '||p_receipt);
   remain:=amount;
   for sched in select * from public.student_fee_schedules where admission_no=student.admission_no
   and academic_session=p_session and lower(coalesce(status,''))<>'paid' order by due_date,id for update loop
    exit when remain<=0;
    used:=least(remain,greatest(0,coalesce(sched.amount,0)-coalesce(sched.paid_amount,0)));
    if used>0 then
     update public.student_fee_schedules set paid_amount=coalesce(paid_amount,0)+used,
      status=case when coalesce(paid_amount,0)+used>=sched.amount then 'Paid' else 'Partial' end,updated_at=now() where id=sched.id;
     remain:=remain-used;
    end if;
   end loop;
   insert into public.fees(date,receipt_no,student_name,admission_no,class_name,phone,total_fee,paid_amount,payment_status,payment_mode,note,due_amount)
   values(p_date,receipt,student.student_name,student.admission_no,student.class_name,coalesce(student.phone,''),amount,amount,'Paid',p_mode,'Combined counter '||p_receipt,0);
  end if;
  -- Refuse inconsistent legacy fee services: receipt must match the central persisted balance.
  select to_jsonb(x) into snap from public.ldm_fee_due_snapshot_v2(p_session=>p_session,p_admission_nos=>array[student.admission_no],p_until_month=>to_char(now() at time zone 'Asia/Kolkata','YYYY-MM')) x limit 1;
  if snap is null or snap->>'current_due' is null or abs((snap->>'current_due')::numeric-greatest(0,due-discount-amount))>0.01 then
   raise exception 'Central fee reconciliation failed for %. Entire batch rolled back; check existing fee service.',student.student_name;
  end if;
  result_rows:=result_rows||jsonb_build_array(jsonb_build_object('student_name',student.student_name,'admission_no',student.admission_no,
   'receipt_no',receipt,'due',due,'discount',discount,'amount',amount,'remaining',greatest(0,due-discount-amount),'advance',greatest(0,amount-(due-discount))));
 end loop;
 if not exists(select 1 from jsonb_array_elements(p_rows) x where (x->>'amount')::numeric>0 or (x->>'discount')::numeric>0) then raise exception 'No payment or discount'; end if;
 result:=jsonb_build_object('receipt_no',p_receipt,'payment_date',p_date,'mode',p_mode,'rows',result_rows);
 insert into public.ldm_v304_receipts(receipt_no,actor,request,result) values(p_receipt,actor_id,req,result);
 return result;
end $$;
revoke all on function public.ldm_v304_collect_batch(text,text,date,text,jsonb) from public,anon;
grant execute on function public.ldm_v304_collect_batch(text,text,date,text,jsonb) to authenticated;
commit;
