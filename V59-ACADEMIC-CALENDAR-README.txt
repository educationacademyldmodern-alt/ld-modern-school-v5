V59 Academic Calendar Add-on
1. Run supabase-v59-academic-calendar.sql once in Supabase SQL Editor after earlier migrations.
2. Sunday is automatically treated as Weekly Holiday unless Admin adds that date as Working Day Override.
3. Admin can add school/festival/local/vacation holidays in Academic Calendar.
4. Smart Student Attendance blocks Present/Absent/Leave save on holiday dates.
5. Existing attendance rows are not deleted or reset.
6. Live RLS, teacher attendance, dashboard/report percentage and Parent views must be verified on Preview deployment against production schema before Production promotion.
