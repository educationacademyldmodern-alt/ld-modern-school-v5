-- V54 FINAL INTEGRATION — additive, idempotent, non-destructive
alter table if exists public.profiles add column if not exists must_change_password boolean not null default false;
alter table if exists public.profiles add column if not exists password_changed_at timestamptz;
create index if not exists ix_profiles_must_change_password on public.profiles(must_change_password) where must_change_password=true;
-- Mark a Teacher/Parent account TRUE when Admin issues/resets its temporary password.
-- Do not mass-force existing production users here.
