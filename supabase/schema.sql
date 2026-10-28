-- ==============================================================================
-- S. VIDEO CREATION — PORTFOLIO MANAGEMENT SYSTEM V1
-- Supabase Postgres Database Schema & Row-Level Security (RLS) Policies
-- ==============================================================================
--
-- IDEMPOTENT MIGRATION SCRIPT:
-- This script is safe to run repeatedly in the Supabase SQL Editor.
-- It will not drop or erase existing portfolio items or employee records.
--
-- INSTRUCTIONS FOR SETUP:
-- 1. In your Supabase Dashboard, navigate to the "SQL Editor" section.
-- 2. Paste the entire content of this file and click "Run".
-- 3. To authorize your first employee / administrator:
--    a. In Supabase Dashboard, go to Authentication > Users > Add user.
--    b. Create the employee account with an email and secure password.
--    c. Copy their User UID from the Auth > Users table.
--    d. Run the INSERT query at the bottom of this file.
--
-- ==============================================================================

-- 1. Enable UUID Extension if not already enabled
create extension if not exists "uuid-ossp";

-- ==============================================================================
-- 2. Administrator Allowlist Table (`admin_users`)
-- ==============================================================================
-- Only users listed in this table are granted administrative permissions.
-- Having a registered Supabase Auth account is NOT sufficient; an explicit
-- row in this table is required to manage portfolio items.
--
-- Client-side writes to this table are intentionally NOT permitted.
-- Employee provisioning is performed strictly via Supabase Dashboard or SQL Editor.

create table if not exists public.admin_users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  role text not null default 'admin' check (role in ('admin', 'superadmin')),
  created_at timestamptz not null default now()
);

comment on table public.admin_users is 'Authorized employee allowlist for S. Video Creation dashboard.';

-- Enable Row Level Security (RLS) on admin_users
alter table public.admin_users enable row level security;

-- ==============================================================================
-- 3. Security Helper Function (`is_admin`)
-- ==============================================================================
-- Returns true if the requesting user (auth.uid()) exists in the admin_users table.
-- Hardened per Supabase security guidelines:
-- - Uses SECURITY DEFINER to evaluate permissions safely.
-- - Sets an empty search_path to prevent search-path injection attacks.
-- - Fully schema-qualifies all internal objects (auth.uid, public.admin_users).
-- - Function execution is revoked from PUBLIC/anon and granted only to authenticated.

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_users
    where id = (select auth.uid())
  );
$$;

-- Restrict function execution privileges
revoke all on function public.is_admin() from public;
revoke all on function public.is_admin() from anon;
grant execute on function public.is_admin() to authenticated;

-- ==============================================================================
-- 4. RLS Policies for `admin_users`
-- ==============================================================================
-- Drop previous policies to ensure clean idempotent re-execution
drop policy if exists "Users can check their own admin status or admins can list" on public.admin_users;
drop policy if exists "Admins with superadmin role can manage admin users" on public.admin_users;
drop policy if exists "Users can check their own admin status" on public.admin_users;

-- Authenticated users may ONLY read their own record (to check their authorization on login).
-- This avoids any circular self-queries on admin_users.
create policy "Users can check their own admin status"
  on public.admin_users
  for select
  to authenticated
  using ((select auth.uid()) = id);

-- Note: No INSERT, UPDATE, or DELETE policies exist for admin_users on the client.
-- Employee provisioning and role changes are managed via Supabase Dashboard or SQL.

-- ==============================================================================
-- 5. Portfolio Items Table (`portfolio_items`)
-- ==============================================================================

create table if not exists public.portfolio_items (
  id uuid primary key default gen_random_uuid(),
  youtube_video_id text not null check (youtube_video_id ~ '^[a-zA-Z0-9_-]{11}$'),
  youtube_url text not null,
  title_en text not null check (length(trim(title_en)) > 0 and length(title_en) <= 255),
  title_hi text check (title_hi is null or length(title_hi) <= 255),
  description_en text check (description_en is null or length(description_en) <= 2000),
  description_hi text check (description_hi is null or length(description_hi) <= 2000),
  category text not null check (category in ('editing', 'reels', 'wedding', 'mixing', 'other')),
  orientation text not null default 'landscape' check (orientation in ('landscape', 'portrait')),
  thumbnail_url text check (
    thumbnail_url is null or (
      length(thumbnail_url) <= 2048 and
      thumbnail_url ~* '^https://[^\s"''<>]+$'
    )
  ),
  is_featured boolean not null default false,
  status text not null default 'draft' check (status in ('draft', 'published')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint portfolio_items_youtube_url_canonical_check check (
    youtube_url = ('https://www.youtube.com/watch?v=' || youtube_video_id) or
    youtube_url = ('https://www.youtube.com/shorts/' || youtube_video_id)
  )
);

comment on table public.portfolio_items is 'S. Video Creation portfolio records displayed on public site and managed via /admin/.';

-- Idempotent constraint upgrade block for existing tables
do $$
declare
  v_invalid_video_ids integer;
  v_invalid_urls integer;
  v_invalid_thumbs integer;
  v_invalid_titles integer;
begin
  -- 1. Check for existing data violations and report detailed, visible errors if found
  select count(*) into v_invalid_video_ids
  from public.portfolio_items
  where youtube_video_id !~ '^[a-zA-Z0-9_-]{11}$';

  if v_invalid_video_ids > 0 then
    raise exception 'Migration failed: Found % record(s) in portfolio_items with invalid youtube_video_id (must be strictly 11 allowed characters: a-z, A-Z, 0-9, _, -). Please correct the records before rerunning this migration.', v_invalid_video_ids;
  end if;

  select count(*) into v_invalid_urls
  from public.portfolio_items
  where youtube_url != ('https://www.youtube.com/watch?v=' || youtube_video_id)
    and youtube_url != ('https://www.youtube.com/shorts/' || youtube_video_id);

  if v_invalid_urls > 0 then
    raise exception 'Migration failed: Found % record(s) in portfolio_items where youtube_url is not in canonical format matching youtube_video_id (https://www.youtube.com/watch?v=ID or https://www.youtube.com/shorts/ID). Please normalize these URLs before rerunning this migration.', v_invalid_urls;
  end if;

  select count(*) into v_invalid_thumbs
  from public.portfolio_items
  where thumbnail_url is not null
    and (length(thumbnail_url) > 2048 or thumbnail_url !~* '^https://[^\s"''<>]+$');

  if v_invalid_thumbs > 0 then
    raise exception 'Migration failed: Found % record(s) in portfolio_items with non-HTTPS or invalid thumbnail_url. Please correct these records before rerunning this migration.', v_invalid_thumbs;
  end if;

  select count(*) into v_invalid_titles
  from public.portfolio_items
  where length(trim(title_en)) = 0 or length(title_en) > 255;

  if v_invalid_titles > 0 then
    raise exception 'Migration failed: Found % record(s) in portfolio_items with empty or overlong title_en. Please correct these records before rerunning this migration.', v_invalid_titles;
  end if;

  -- 2. Drop legacy or outdated constraints idempotently
  alter table public.portfolio_items drop constraint if exists portfolio_items_youtube_video_id_check;
  alter table public.portfolio_items drop constraint if exists portfolio_items_youtube_url_check;
  alter table public.portfolio_items drop constraint if exists portfolio_items_youtube_url_match_check;
  alter table public.portfolio_items drop constraint if exists portfolio_items_youtube_url_canonical_check;
  alter table public.portfolio_items drop constraint if exists portfolio_items_thumbnail_url_check;
  alter table public.portfolio_items drop constraint if exists portfolio_items_title_en_check;

  -- 3. Apply the strengthened constraints
  alter table public.portfolio_items add constraint portfolio_items_youtube_video_id_check
    check (youtube_video_id ~ '^[a-zA-Z0-9_-]{11}$');

  alter table public.portfolio_items add constraint portfolio_items_youtube_url_canonical_check
    check (
      youtube_url = ('https://www.youtube.com/watch?v=' || youtube_video_id) or
      youtube_url = ('https://www.youtube.com/shorts/' || youtube_video_id)
    );

  alter table public.portfolio_items add constraint portfolio_items_thumbnail_url_check
    check (thumbnail_url is null or (length(thumbnail_url) <= 2048 and thumbnail_url ~* '^https://[^\s"''<>]+$'));

  alter table public.portfolio_items add constraint portfolio_items_title_en_check
    check (length(trim(title_en)) > 0 and length(title_en) <= 255);

  -- Note: Migration errors are not caught or suppressed; any SQL or data error halts execution and is visibly reported to the administrator.
end $$;

-- Create Indexes for fast querying & sorting
create index if not exists idx_portfolio_items_status_order
  on public.portfolio_items (status, sort_order asc, created_at desc);

create index if not exists idx_portfolio_items_featured
  on public.portfolio_items (is_featured, status);

create index if not exists idx_portfolio_items_category
  on public.portfolio_items (category, status);

-- Trigger for automatic updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trigger_portfolio_items_updated_at on public.portfolio_items;
create trigger trigger_portfolio_items_updated_at
  before update on public.portfolio_items
  for each row
  execute function public.handle_updated_at();

-- ==============================================================================
-- 6. Row Level Security (RLS) for `portfolio_items`
-- ==============================================================================
alter table public.portfolio_items enable row level security;

-- Clean drop of existing policies for idempotent re-runs
drop policy if exists "Public can view published portfolio items" on public.portfolio_items;
drop policy if exists "Admins can view all portfolio items" on public.portfolio_items;
drop policy if exists "Admins can insert portfolio items" on public.portfolio_items;
drop policy if exists "Admins can update portfolio items" on public.portfolio_items;
drop policy if exists "Admins can delete portfolio items" on public.portfolio_items;

-- Policy A: Public visitors (anonymous and authenticated) can ONLY READ published entries
create policy "Public can view published portfolio items"
  on public.portfolio_items
  for select
  using (status = 'published');

-- Policy B: Authorized administrators can READ all entries (including drafts)
create policy "Admins can view all portfolio items"
  on public.portfolio_items
  for select
  to authenticated
  using (public.is_admin());

-- Policy C: Only authorized administrators can INSERT new portfolio items
create policy "Admins can insert portfolio items"
  on public.portfolio_items
  for insert
  to authenticated
  with check (public.is_admin());

-- Policy D: Only authorized administrators can UPDATE portfolio items
create policy "Admins can update portfolio items"
  on public.portfolio_items
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Policy E: Only authorized administrators can DELETE portfolio items
create policy "Admins can delete portfolio items"
  on public.portfolio_items
  for delete
  to authenticated
  using (public.is_admin());

-- ==============================================================================
-- 7. EXPLICIT TABLE PRIVILEGES (LEAST PRIVILEGE ENFORCEMENT)
-- ==============================================================================
-- Explicitly revoke all default privileges from public, anon and authenticated.
-- This ensures ungranted operations like TRUNCATE or client schema modifications
-- are strictly blocked at the database privilege level, not merely by RLS.

revoke all on table public.admin_users from public, anon, authenticated;
revoke all on table public.portfolio_items from public, anon, authenticated;

-- Table: admin_users
-- Authenticated users only need SELECT (and RLS restricts them to their own row).
grant select on table public.admin_users to authenticated;

-- Table: portfolio_items
-- Anon (public site visitors) only need SELECT (and RLS restricts them to status = 'published').
grant select on table public.portfolio_items to anon;

-- Authenticated (employees) need SELECT, INSERT, UPDATE, DELETE (guarded by RLS is_admin policies).
grant select, insert, update, delete on table public.portfolio_items to authenticated;

-- ==============================================================================
-- 8. FIRST ADMINISTRATOR SETUP HELPER
-- ==============================================================================
-- Run this in the Supabase SQL editor after creating your initial user account
-- in Supabase Auth (Authentication > Users > Add User).
-- Replace the UUID and email below with your real administrator account values:
--
-- INSERT INTO public.admin_users (id, email, role)
-- VALUES (
--   '00000000-0000-0000-0000-000000000000', -- Replace with auth.users UID
--   'owner@svideocreation.com',              -- Replace with employee email
--   'superadmin'
-- )
-- ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role;
--
-- ==============================================================================
