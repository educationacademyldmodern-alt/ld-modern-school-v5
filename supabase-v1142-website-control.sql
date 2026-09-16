-- V114.2 Website Control
-- Safe / additive / re-runnable. No DROP, TRUNCATE or destructive change.

alter table public.school_settings
  add column if not exists latest_information text;

alter table public.school_settings
  add column if not exists email text;

insert into public.school_settings
  (id,email,phone,latest_information)
values
  (
    1,
    'educationacademyldmodern@gmail.com',
    '9625688873',
    'Admissions Open for Session 2026-27 (Nursery to Class 10) | Quality Education for a Better Tomorrow | Building Character, Creating Brighter Futures | Welcome to L D Modern Education Academy'
  )
on conflict (id) do update set
  email = coalesce(nullif(public.school_settings.email,''),excluded.email),
  phone = coalesce(nullif(public.school_settings.phone,''),excluded.phone),
  latest_information =
    coalesce(nullif(public.school_settings.latest_information,''),excluded.latest_information);
