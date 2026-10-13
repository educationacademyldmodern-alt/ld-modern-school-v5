-- V309: allocation audit, controlled reversal and separate other-income collection.
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
 receipt text; allocations jsonb; discount_ids jsonb; result_rows jsonb:='[]'; result jsonb; expected numeric; snap jsonb;
begin
 select lower(role) into actor_role from public.profiles where id=actor_id
 and lower(coalesce(status,'active'))='active';
 if actor_id is null or actor_role is null or actor_role not in ('admin','super_admin','principal') then
  raise exception 'Active Admin / Principal required'; end if;
 if p_receipt is null or p_receipt !~ '^LDM-[a-f0-9-]{36}$' or length(coalesce(p_session,'')) not between 1 and 40
 or p_date is null or (p_mode is null or p_mode not in ('Cash','UPI','Bank','Cheque'))
 or jsonb_typeof(p_rows) is distinct from 'array' then raise exception 'Invalid payment request'; end if;
 if jsonb_array_length(p_rows) not between 1 and 50 then raise exception 'Select 1 to 50 students'; end if;
 req:=jsonb_build_object('session',p_session,'date',p_date,'mode',p_mode,'rows',p_rows);
 perform pg_advisory_xact_lock(hashtextextended(p_receipt,304));
 select * into prior from public.ldm_v304_receipts where receipt_no=p_receipt;
 if found then
  if exists(select 1 from public.ldm_v309_corrections where receipt_no=p_receipt) then raise exception 'Receipt already reversed';end if;
  if prior.actor<>actor_id or prior.request<>req then raise exception 'Receipt already used for another request'; end if;
  return prior.result;
 end if;
 if (select count(*) from jsonb_array_elements(p_rows))<>(select count(distinct x->>'admission_no') from jsonb_array_elements(p_rows) x)
 then raise exception 'Duplicate admission number'; end if;
 -- Lock students in stable order to serialize overlapping counters and avoid deadlocks.
 for item in select x from jsonb_array_elements(p_rows) x order by x->>'admission_no' loop
  perform pg_advisory_xact_lock(hashtextextended(item->>'admission_no',309));
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
  receipt:=p_receipt||'-'||student.admission_no;allocations:='[]';discount_ids:='[]';
  if discount>0 then
   perform public.v65_add_fee_adjustment(student.admission_no,'Waiver',discount,left(item->>'reason',200)||' • '||receipt);
  end if;
  if discount>0 and to_regclass('public.v65_fee_adjustments') is not null then
   execute 'select coalesce(jsonb_agg(to_jsonb(a)->>''id''),''[]''::jsonb) from public.v65_fee_adjustments a where admission_no=$1 and is_active=true and (coalesce(to_jsonb(a)->>''reason'',to_jsonb(a)->>''note'','''') like ''%''||$2||''%'')' into discount_ids using student.admission_no,receipt;
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
     allocations:=allocations||jsonb_build_array(jsonb_build_object('id',sched.id,'amount',used));remain:=remain-used;
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
   'receipt_no',receipt,'due',due,'discount',discount,'amount',amount,'remaining',greatest(0,due-discount-amount),'advance',greatest(0,amount-(due-discount)),'allocations',allocations,'discount_ids',discount_ids));
 end loop;
 if not exists(select 1 from jsonb_array_elements(p_rows) x where (x->>'amount')::numeric>0 or (x->>'discount')::numeric>0) then raise exception 'No payment or discount'; end if;
 result:=jsonb_build_object('receipt_no',p_receipt,'payment_date',p_date,'mode',p_mode,'rows',result_rows);
 insert into public.ldm_v304_receipts(receipt_no,actor,request,result) values(p_receipt,actor_id,req,result);
 return result;
end $$;
revoke all on function public.ldm_v304_collect_batch(text,text,date,text,jsonb) from public,anon;
grant execute on function public.ldm_v304_collect_batch(text,text,date,text,jsonb) to authenticated;


create table if not exists public.ldm_v309_corrections(id uuid primary key,receipt_no text not null unique,actor uuid not null,reason text not null,original jsonb not null,created_at timestamptz not null default now());
alter table public.ldm_v309_corrections enable row level security;
revoke all on public.ldm_v309_corrections from anon,authenticated;
create or replace function public.ldm_v309_reverse_fee(p_receipt text,p_reason text,p_request uuid)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare prior ldm_v304_receipts%rowtype; log ldm_v309_corrections%rowtype; row_data jsonb; allocation jsonb; original_rows jsonb:='[]'; restored jsonb; count_rows integer; key text; v_role text; v_before numeric; v_raw numeric; v_after numeric; v_credit numeric; v_current_alloc numeric; v_after_credit numeric;
begin
 select lower(role) into v_role from profiles where id=auth.uid() and lower(coalesce(status,'active'))='active';
 if v_role is null or v_role not in ('admin','super_admin','principal') then raise exception 'Active Admin required' using errcode='42501';end if;
 if length(btrim(coalesce(p_reason,'')))<5 or length(p_reason)>500 or p_request is null then raise exception 'Correction reason (5-500 characters) required';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_receipt,304));
 select * into log from ldm_v309_corrections where receipt_no=p_receipt;
 if found then
  if log.id<>p_request or log.reason<>p_reason or log.actor<>auth.uid() then raise exception 'Receipt already corrected';end if;
  return jsonb_build_object('id',log.id,'receipt_no',p_receipt,'status','Reversed');
 end if;
 select * into strict prior from ldm_v304_receipts where receipt_no=p_receipt for update;
 -- Old receipts without allocation audit must be reviewed; never guess schedule changes.
 for row_data in select value from jsonb_array_elements(prior.result->'rows') order by value->>'admission_no' loop
  perform pg_advisory_xact_lock(hashtextextended(row_data->>'admission_no',309));
  perform 1 from students where admission_no=row_data->>'admission_no' for update;
  if not(row_data ? 'allocations') then raise exception 'Legacy receipt has no allocation audit; automatic reversal is unavailable';end if;
  select to_jsonb(x) into restored from ldm_fee_due_snapshot_v2(prior.request->>'session',array[row_data->>'admission_no'],to_char(now() at time zone 'Asia/Kolkata','YYYY-MM')) x limit 1;
  v_before:=(restored->>'current_due')::numeric;v_credit:=coalesce((restored->>'unallocated_credit')::numeric,0);
  v_raw:=case when restored ? 'scheduled_due' and restored ? 'adjustment_due' then coalesce((restored->>'scheduled_due')::numeric,0)+coalesce((restored->>'adjustment_due')::numeric,0)+coalesce((restored->>'correction_amount')::numeric,0)-v_credit when v_before>0 then v_before else -v_credit end;
  v_current_alloc:=0;key:=row_data->>'receipt_no';
  original_rows:=original_rows||jsonb_build_array(jsonb_build_object('payment_rows',(select coalesce(jsonb_agg(to_jsonb(p)),'[]') from fee_payments p where p.receipt_no=key),'fee_rows',(select coalesce(jsonb_agg(to_jsonb(f)),'[]') from fees f where f.receipt_no=key),'schedules',(select coalesce(jsonb_agg(to_jsonb(s)),'[]') from student_fee_schedules s where s.id in (select (x->>'id')::uuid from jsonb_array_elements(row_data->'allocations') x))));
  if (row_data->>'amount')::numeric>0 then
   select count(*) into count_rows from fee_payments where receipt_no=key and admission_no=row_data->>'admission_no' and amount=(row_data->>'amount')::numeric;
   if count_rows<>1 then raise exception 'Payment ledger changed; correction requires review';end if;
  end if;
  for allocation in select value from jsonb_array_elements(row_data->'allocations') loop
   if exists(select 1 from student_fee_schedules where id=(allocation->>'id')::uuid and (due_date is null or due_date<(date_trunc('month',now() at time zone 'Asia/Kolkata')+interval '1 month')::date)) then v_current_alloc:=v_current_alloc+(allocation->>'amount')::numeric;end if;
   update student_fee_schedules set paid_amount=paid_amount-(allocation->>'amount')::numeric,status=case when paid_amount-(allocation->>'amount')::numeric>=amount then 'Paid' when paid_amount-(allocation->>'amount')::numeric<=0 then 'Due' else 'Partial' end,updated_at=now()
    where id=(allocation->>'id')::uuid and admission_no=row_data->>'admission_no' and paid_amount>=(allocation->>'amount')::numeric;
   if not found then raise exception 'Schedule allocation changed; correction requires review';end if;
  end loop;
  if (row_data->>'discount')::numeric>0 then
   if jsonb_array_length(coalesce(row_data->'discount_ids','[]'))<>1 then raise exception 'Discount audit unavailable; correction requires review';end if;
   execute 'update public.v65_fee_adjustments set is_active=false where id=$1 and admission_no=$2 and is_active=true and amount=$3' using (row_data->'discount_ids'->>0)::uuid,row_data->>'admission_no',(row_data->>'discount')::numeric;
   get diagnostics count_rows=row_count;if count_rows<>1 then raise exception 'Discount adjustment changed; correction requires review';end if;
  end if;
  update fee_payments set amount=0,note=coalesce(note,'')||' • REVERSED '||p_request::text||' • '||p_reason where receipt_no=key and admission_no=row_data->>'admission_no';
  update fees set paid_amount=0,total_fee=0,payment_status='Reversed',note=coalesce(note,'')||' • REVERSED '||p_request::text||' • '||p_reason where receipt_no=key and admission_no=row_data->>'admission_no';
  select to_jsonb(x) into restored from ldm_fee_due_snapshot_v2(prior.request->>'session',array[row_data->>'admission_no'],to_char(now() at time zone 'Asia/Kolkata','YYYY-MM')) x limit 1;
  v_after:=(restored->>'current_due')::numeric;v_after_credit:=coalesce((restored->>'unallocated_credit')::numeric,0);
  if v_after is null or abs(v_after-case when coalesce((restored->>'is_free')::boolean,false) then 0 else greatest(0,v_raw+v_current_alloc+(row_data->>'discount')::numeric+v_credit-v_after_credit) end)>0.01 then raise exception 'Correction reconciliation failed; entire transaction rolled back';end if;
 end loop;
 insert into ldm_v309_corrections values(p_request,p_receipt,auth.uid(),p_reason,jsonb_build_object('receipt',to_jsonb(prior),'last_payment_rows',original_rows),now());
 return jsonb_build_object('id',p_request,'receipt_no',p_receipt,'status','Reversed');
end $$;
create table if not exists public.ldm_v309_other_receipts(id uuid primary key,actor uuid not null,request jsonb not null,result jsonb not null,created_at timestamptz default now());
alter table public.ldm_v309_other_receipts enable row level security;
revoke all on public.ldm_v309_other_receipts from anon,authenticated;
create or replace function public.ldm_v309_collect_other(p_student uuid,p_head text,p_amount numeric,p_mode text,p_date date,p_note text,p_request uuid)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare s students%rowtype; prior ldm_v309_other_receipts%rowtype; req jsonb; result jsonb; v_role text; v_income uuid;
begin
 select lower(role) into v_role from profiles where id=auth.uid() and lower(coalesce(status,'active'))='active';
 if v_role is null or v_role not in ('admin','super_admin','principal') then raise exception 'Active Admin required' using errcode='42501';end if;
 if p_request is null or length(trim(coalesce(p_head,''))) not between 1 and 80 or p_amount is null or p_amount::text in ('NaN','Infinity','-Infinity') or p_amount<=0 or p_amount<>round(p_amount,2) or (p_mode is null or p_mode not in ('Cash','UPI','Bank','Cheque')) or p_date is null or length(coalesce(p_note,''))>500 then raise exception 'Valid item/head, amount, mode and date required';end if;
 req:=jsonb_build_object('student',p_student,'head',p_head,'amount',p_amount,'mode',p_mode,'date',p_date,'note',p_note);
 perform pg_advisory_xact_lock(hashtextextended(p_request::text,309));select * into prior from ldm_v309_other_receipts where id=p_request;
 if found then if exists(select 1 from ldm_v309_corrections where receipt_no=prior.result->>'receipt_no') then raise exception 'Receipt already reversed';end if;if prior.actor<>auth.uid() or prior.request<>req then raise exception 'Request already used';end if;return prior.result;end if;
 select * into strict s from students where id=p_student and lower(coalesce(status,'Active')) not in ('inactive','deleted','trashed','archived','transferred','left') for update;
 result:=jsonb_build_object('receipt_no','OTHER-'||p_request,'payment_date',p_date,'mode',p_mode,'head',p_head,'rows',jsonb_build_array(jsonb_build_object('student_name',s.student_name,'admission_no',s.admission_no,'due',0,'discount',0,'amount',p_amount,'remaining',0,'advance',0)));
 insert into income(date,source,amount,payment_mode,note) values(p_date,p_head,p_amount,p_mode,'OTHER-'||p_request||' • '||s.admission_no||' • '||s.student_name||' • '||coalesce(p_note,'')) returning id into v_income;result:=result||jsonb_build_object('income_id',v_income);
 insert into ldm_v309_other_receipts(id,actor,request,result) values(p_request,auth.uid(),req,result);return result;
end $$;
revoke all on function public.ldm_v309_reverse_fee(text,text,uuid),public.ldm_v309_collect_other(uuid,text,numeric,text,date,text,uuid) from public,anon;
grant execute on function public.ldm_v309_reverse_fee(text,text,uuid),public.ldm_v309_collect_other(uuid,text,numeric,text,date,text,uuid) to authenticated;

create or replace function public.ldm_v309_reverse_other(p_receipt text,p_reason text,p_request uuid)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare log ldm_v309_corrections%rowtype; receipt ldm_v309_other_receipts%rowtype; original_income jsonb; role_key text;
begin
 select lower(role) into role_key from profiles where id=auth.uid() and lower(coalesce(status,'active'))='active';
 if role_key is null or role_key not in ('admin','super_admin','principal') then raise exception 'Active Admin required' using errcode='42501';end if;
 if p_request is null or length(btrim(coalesce(p_reason,'')))<5 or length(p_reason)>500 then raise exception 'Correction reason required';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_receipt,309));select * into log from ldm_v309_corrections where receipt_no=p_receipt;
 if found then if log.id<>p_request or log.actor<>auth.uid() or log.reason<>p_reason then raise exception 'Receipt already corrected';end if;return jsonb_build_object('id',log.id,'status','Reversed','receipt_no',p_receipt);end if;
 select * into strict receipt from ldm_v309_other_receipts where result->>'receipt_no'=p_receipt for update;
 select to_jsonb(i) into original_income from income i where id=(receipt.result->>'income_id')::uuid and amount=(receipt.request->>'amount')::numeric for update;
 if original_income is null then raise exception 'Income record changed; correction requires review';end if;
 update income set amount=0,note=coalesce(note,'')||' • REVERSED '||p_request::text||' • '||p_reason where id=(receipt.result->>'income_id')::uuid;
 insert into ldm_v309_corrections values(p_request,p_receipt,auth.uid(),p_reason,jsonb_build_object('receipt',to_jsonb(receipt),'income',original_income),now());
 return jsonb_build_object('id',p_request,'receipt_no',p_receipt,'status','Reversed');
end $$;
create or replace function public.ldm_v309_receipt_lookup(p_receipt text)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare role_key text; result jsonb;
begin
 select lower(role) into role_key from profiles where id=auth.uid() and lower(coalesce(status,'active'))='active';
 if role_key is null or role_key not in ('admin','super_admin','principal') then raise exception 'Active Admin required' using errcode='42501';end if;
 select r.result into result from ldm_v304_receipts r where receipt_no=p_receipt;
 if result is null then select r.result into result from ldm_v309_other_receipts r where r.result->>'receipt_no'=p_receipt;end if;
 if result is null then raise exception 'Receipt not found in combined/other counter';end if;
 return result||jsonb_build_object('status',case when exists(select 1 from ldm_v309_corrections where receipt_no=p_receipt) then 'Reversed' else 'Paid' end);
end $$;
revoke all on function public.ldm_v309_reverse_other(text,text,uuid),public.ldm_v309_receipt_lookup(text) from public,anon;
grant execute on function public.ldm_v309_reverse_other(text,text,uuid),public.ldm_v309_receipt_lookup(text) to authenticated;
commit;
notify pgrst,'reload schema';
