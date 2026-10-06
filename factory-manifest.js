/* LDM ERP Factory Pro V252 • canonical manifest engine • static/no-network */
(()=>{'use strict';
const C=window.LDM_FACTORY_CATALOG;
const f=(k,l,t='text',x={})=>({k,l,t,...x});
const S={
 student_master:[f('name','Student Name','text',{required:true}),f('admission_no','Admission No.'),f('class','Class'),f('section','Section'),f('father','Father/Guardian'),f('mobile','Mobile','tel'),f('status','Status','select',{options:['Active','Left','Alumni']})],
 admission:[f('applicant','Applicant Name','text',{required:true}),f('application_no','Application No.'),f('class','Applied Class'),f('date','Application Date','date'),f('status','Status','select',{options:['Pending','Approved','Rejected','Admitted']}),f('notes','Notes','textarea')],
 attendance:[f('person','Student/Employee','text',{required:true}),f('date','Date','date',{required:true}),f('status','Attendance','select',{options:['Present','Absent','Leave','Holiday']}),f('in_time','In Time','time'),f('out_time','Out Time','time'),f('notes','Notes','textarea')],
 fees:[f('party','Student/Party','text',{required:true}),f('fee_head','Fee Head'),f('due_date','Due Date','date'),f('due','Due Amount','number'),f('paid','Paid Amount','number'),f('status','Status','select',{options:['Due','Part Paid','Paid','Waived']})],
 product_master:[f('name','Product/Item Name','text',{required:true}),f('sku','SKU/Code'),f('category','Category'),f('unit','Unit'),f('price','Sale Price','number'),f('stock','Opening Stock','number'),f('status','Status','select',{options:['Active','Inactive']})],
 inventory:[f('item','Item/Product','text',{required:true}),f('movement','Movement','select',{options:['IN','OUT','ADJUSTMENT']}),f('qty','Quantity','number',{required:true}),f('date','Date','date'),f('reference','Reference'),f('notes','Notes','textarea')],
 sales:[f('invoice_no','Invoice No.'),f('customer','Customer','text',{required:true}),f('date','Date','date'),f('amount','Amount','number'),f('paid','Paid','number'),f('status','Status','select',{options:['Draft','Due','Part Paid','Paid','Cancelled']})],
 purchase:[f('bill_no','Bill No.'),f('supplier','Supplier','text',{required:true}),f('date','Date','date'),f('amount','Amount','number'),f('paid','Paid','number'),f('status','Status','select',{options:['Draft','Due','Part Paid','Paid','Cancelled']})],
 billing:[f('invoice_no','Invoice No.'),f('party','Party/Customer','text',{required:true}),f('date','Date','date'),f('subtotal','Subtotal','number'),f('tax','Tax','number'),f('total','Total','number'),f('status','Status','select',{options:['Draft','Issued','Paid','Cancelled']})],
 customers:[f('name','Customer Name','text',{required:true}),f('mobile','Mobile','tel'),f('email','Email','email'),f('address','Address','textarea'),f('status','Status','select',{options:['Active','Inactive']})],
 suppliers:[f('name','Supplier Name','text',{required:true}),f('mobile','Mobile','tel'),f('gstin','GSTIN'),f('address','Address','textarea'),f('status','Status','select',{options:['Active','Inactive']})],
 patient_master:[f('name','Patient Name','text',{required:true}),f('age','Age','number'),f('gender','Gender','select',{options:['Male','Female','Other']}),f('mobile','Mobile','tel'),f('blood_group','Blood Group'),f('notes','Clinical Notes','textarea')],
 appointments:[f('patient','Patient/Client','text',{required:true}),f('date','Date','date',{required:true}),f('time','Time','time'),f('provider','Doctor/Provider'),f('status','Status','select',{options:['Booked','Arrived','Completed','Cancelled']}),f('notes','Notes','textarea')],
 prescription:[f('patient','Patient','text',{required:true}),f('date','Date','date'),f('doctor','Doctor'),f('medicines','Medicines / Advice','textarea',{required:true}),f('followup','Follow-up Date','date')],
 client_master:[f('name','Client Name','text',{required:true}),f('mobile','Mobile','tel'),f('email','Email','email'),f('address','Address','textarea'),f('status','Status','select',{options:['Active','Inactive']})],
 case_master:[f('title','Case / Matter','text',{required:true}),f('case_no','Case No.'),f('cnr','CNR'),f('court','Court'),f('next_date','Next Hearing','date'),f('status','Status','select',{options:['Open','Pending','Disposed']}),f('notes','Notes','textarea')],
 hearings:[f('case','Case/Matter','text',{required:true}),f('date','Hearing Date','date',{required:true}),f('court','Court'),f('purpose','Purpose'),f('result','Order/Result','textarea'),f('next_date','Next Date','date')],
 staff:[f('name','Employee/Staff Name','text',{required:true}),f('employee_id','Employee ID'),f('role','Role'),f('mobile','Mobile','tel'),f('join_date','Joining Date','date'),f('status','Status','select',{options:['Active','Inactive']})],
 hrms:[f('employee','Employee','text',{required:true}),f('event','HR Event'),f('date','Date','date'),f('status','Status','select',{options:['Open','Approved','Closed']}),f('notes','Notes','textarea')],
 payroll:[f('employee','Employee','text',{required:true}),f('month','Month'),f('gross','Gross','number'),f('deduction','Deduction','number'),f('net','Net Salary','number'),f('status','Status','select',{options:['Pending','Paid','Hold']})],
 vehicles:[f('vehicle_no','Vehicle No.','text',{required:true}),f('type','Vehicle Type'),f('driver','Driver'),f('capacity','Capacity','number'),f('status','Status','select',{options:['Active','Maintenance','Inactive']})],
 drivers:[f('name','Driver Name','text',{required:true}),f('mobile','Mobile','tel'),f('license_no','License No.'),f('valid_till','License Valid Till','date'),f('status','Status','select',{options:['Active','Inactive']})],
 routes:[f('name','Route Name','text',{required:true}),f('start','Start Point'),f('end','End Point'),f('vehicle','Vehicle'),f('driver','Driver'),f('status','Status','select',{options:['Active','Inactive']})],
 rooms:[f('room_no','Room No.','text',{required:true}),f('type','Room Type'),f('capacity','Capacity','number'),f('rate','Rate','number'),f('status','Status','select',{options:['Available','Occupied','Maintenance']})],
 booking:[f('guest','Guest/Customer','text',{required:true}),f('resource','Room/Service'),f('from_date','From','date'),f('to_date','To','date'),f('amount','Amount','number'),f('status','Status','select',{options:['Reserved','Confirmed','Completed','Cancelled']})],
 properties:[f('title','Property','text',{required:true}),f('type','Type'),f('location','Location'),f('price','Price','number'),f('owner','Owner'),f('status','Status','select',{options:['Available','Booked','Sold','Rented']})],
 leads:[f('name','Lead Name','text',{required:true}),f('mobile','Mobile','tel'),f('source','Source'),f('value','Expected Value','number'),f('next_followup','Next Follow-up','date'),f('status','Status','select',{options:['New','Contacted','Qualified','Won','Lost']})],
 crm:[f('party','Customer/Lead','text',{required:true}),f('stage','Stage','select',{options:['Lead','Qualified','Proposal','Negotiation','Won','Lost']}),f('value','Value','number'),f('next_action','Next Action'),f('due_date','Due Date','date'),f('notes','Notes','textarea')],
 projects:[f('title','Project Name','text',{required:true}),f('client','Client'),f('start_date','Start Date','date'),f('due_date','Due Date','date'),f('budget','Budget','number'),f('status','Status','select',{options:['Planned','Active','On Hold','Completed','Cancelled']})],
 tasks:[f('title','Task','text',{required:true}),f('assignee','Assignee'),f('due_date','Due Date','date'),f('priority','Priority','select',{options:['Low','Normal','High','Critical']}),f('status','Status','select',{options:['Open','Working','Blocked','Done']})],
 applications:[f('applicant','Applicant','text',{required:true}),f('application_no','Application No.'),f('type','Application Type'),f('date','Date','date'),f('status','Status','select',{options:['Received','In Process','Approved','Rejected','Closed']}),f('notes','Notes','textarea')],
 events:[f('title','Event / Program','text',{required:true}),f('date','Date','date'),f('venue','Venue'),f('budget','Budget','number'),f('status','Status','select',{options:['Planned','Confirmed','Completed','Cancelled']}),f('notes','Notes','textarea')],
 membership:[f('member','Member Name','text',{required:true}),f('member_no','Member No.'),f('plan','Plan'),f('from_date','From','date'),f('to_date','Valid Till','date'),f('status','Status','select',{options:['Active','Expired','Suspended']})],
 members:[f('name','Member Name','text',{required:true}),f('member_no','Member No.'),f('mobile','Mobile','tel'),f('join_date','Join Date','date'),f('status','Status','select',{options:['Active','Inactive']})],
 donations:[f('donor','Donor','text',{required:true}),f('date','Date','date'),f('amount','Amount','number',{required:true}),f('mode','Mode'),f('purpose','Purpose'),f('receipt_no','Receipt No.')],
 beneficiaries:[f('name','Beneficiary','text',{required:true}),f('mobile','Mobile','tel'),f('scheme','Program/Scheme'),f('date','Date','date'),f('status','Status','select',{options:['Active','Completed','Inactive']})],
 production:[f('batch','Batch/Job No.','text',{required:true}),f('product','Product'),f('date','Date','date'),f('qty','Quantity','number'),f('status','Status','select',{options:['Planned','In Production','QC','Completed','Rejected']}),f('notes','Notes','textarea')],
 quality:[f('batch','Batch/Item','text',{required:true}),f('date','QC Date','date'),f('inspector','Inspector'),f('result','Result','select',{options:['Pass','Fail','Hold']}),f('notes','Observations','textarea')]
};
const finance=new Set(['accounts','ledger','receipts','payments','collection','collections','expenses','dues','gst']);
const schedule=new Set(['calendar','timetable','followup','reminders','site_visits','trips','maintenance']);
const docs=new Set(['documents','certificates','id_cards','drafting','legal_books','research_links','reports','audit']);
const comms=new Set(['communication','contact','support','sms_ready']);
const content=new Set(['website','pages','gallery','seo','catalog','online_catalog','menu']);
const service=new Set(['services','doctors','lab','pharmacy','kitchen','tables','online_booking']);
const commerce=new Set(['orders','vendors','barcode','loyalty']);
const workflow=new Set(['approvals','status_tracking','deals','lead_management']);
function generic(k){
 if(finance.has(k)) return [f('party','Party / Head','text',{required:true}),f('date','Date','date'),f('reference','Reference'),f('amount','Amount','number'),f('mode','Mode'),f('status','Status','select',{options:['Pending','Part Paid','Paid','Closed']}),f('notes','Notes','textarea')];
 if(schedule.has(k)) return [f('title','Title','text',{required:true}),f('date','Date','date',{required:true}),f('time','Time','time'),f('person','Person/Resource'),f('status','Status','select',{options:['Planned','Confirmed','Completed','Cancelled']}),f('notes','Notes','textarea')];
 if(docs.has(k)) return [f('title','Title / Document','text',{required:true}),f('reference','Reference No.'),f('date','Date','date'),f('status','Status','select',{options:['Draft','Issued','Verified','Archived']}),f('notes','Details / Notes','textarea')];
 if(comms.has(k)) return [f('subject','Subject','text',{required:true}),f('recipient','Recipient'),f('date','Date','date'),f('channel','Channel'),f('status','Status','select',{options:['Draft','Sent','Pending','Closed']}),f('message','Message / Notes','textarea')];
 if(content.has(k)) return [f('title','Title','text',{required:true}),f('slug','Slug / Code'),f('category','Category'),f('status','Status','select',{options:['Draft','Published','Hidden']}),f('content','Content / Notes','textarea')];
 if(service.has(k)) return [f('name','Name / Service','text',{required:true}),f('date','Date','date'),f('resource','Provider/Resource'),f('amount','Amount','number'),f('status','Status','select',{options:['Active','Booked','Completed','Inactive']}),f('notes','Notes','textarea')];
 if(commerce.has(k)) return [f('party','Party / Customer','text',{required:true}),f('reference','Reference'),f('date','Date','date'),f('qty','Quantity','number'),f('amount','Amount','number'),f('status','Status','select',{options:['Open','Confirmed','Completed','Cancelled']})];
 if(workflow.has(k)) return [f('title','Title','text',{required:true}),f('owner','Owner/Assignee'),f('stage','Stage'),f('due_date','Due Date','date'),f('status','Status','select',{options:['Open','Working','Approved','Rejected','Closed']}),f('notes','Notes','textarea')];
 return [f('title','Name / Title','text',{required:true}),f('reference','Reference'),f('date','Date','date'),f('amount','Amount','number'),f('mobile','Mobile','tel'),f('status','Status','select',{options:['Active','Pending','Completed','Closed']}),f('notes','Notes','textarea')];
}
const specialized=new Set(Object.keys(S));
function one(k){const meta=C.features[k]||{title:k,desc:'',price:0};return {key:k,title:meta.title||k,description:meta.desc||'',fields:S[k]||generic(k),engine:'record-v1',capability:specialized.has(k)?'READY':'CONFIGURABLE',version:1};}
function build(model,selected){const requested=[...new Set((selected||[]).filter(Boolean))];const allowed=new Set(model?.features||[]);const keys=requested.filter(k=>allowed.has(k));return keys.map(one);}
function validate(manifest){const errs=[];if(!manifest||typeof manifest!=='object')errs.push('MANIFEST_OBJECT_REQUIRED');const mods=manifest?.modules;if(!Array.isArray(mods)||!mods.length)errs.push('MODULES_REQUIRED');const seen=new Set();for(const m of mods||[]){if(!m.key||seen.has(m.key))errs.push('MODULE_KEY_INVALID_OR_DUPLICATE');seen.add(m.key);if(!Array.isArray(m.fields)||!m.fields.length)errs.push('FIELDS_REQUIRED:'+String(m.key||''));}return {ok:errs.length===0,errors:errs};}
window.LDM_FACTORY_MANIFEST={build,one,validate,schemaVersion:1,specialized:[...specialized]};
})();
