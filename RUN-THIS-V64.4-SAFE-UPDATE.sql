-- L D MODERN EDUCATION ACADEMY — V64.4 SAFE UPDATE
-- Additive/non-destructive companion SQL. Run AFTER the V64.3 safe update.
-- V64.4 UI fixes require no new tables and intentionally do not alter live data.
-- Keep the recursion-safe role helpers from V64.3; verify they still exist.
do $$
begin
  if to_regprocedure('public.v643_current_role()') is null then
    raise notice 'V64.3 recursion-safe role helper not found. Run RUN-THIS-V64.3-SAFE-UPDATE.sql first.';
  end if;
  if to_regprocedure('public.v643_teacher_preflight(uuid)') is null then
    raise notice 'V64.3 teacher preflight helper not found. Run RUN-THIS-V64.3-SAFE-UPDATE.sql first.';
  end if;
end $$;
-- No DROP, DELETE, TRUNCATE, trigger-disable, RLS-disable, or stack-limit change is performed here.
