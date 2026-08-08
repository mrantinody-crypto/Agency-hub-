-- ============================================================
-- Agency Hub — Database Schema (v2)
-- Run this once in Supabase → SQL Editor → New Query → Run
-- If you already ran v1, drop the old tables first (see bottom note).
-- ============================================================

create table profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  role text not null default 'client' check (role in ('admin', 'team', 'client', 'owner')),
  email text,
  created_at timestamptz default now()
);

-- Brands / clients — unlimited rows, no cap
create table clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  industry text,
  website text,
  instagram text,
  facebook text,
  linkedin text,
  other_links text,
  contact_name text,
  contact_email text,
  contact_phone text,
  login_notes text,
  status text default 'active' check (status in ('active', 'paused', 'archived')),
  created_at timestamptz default now()
);

-- Who can see which brand — works for both team members and clients
create table client_members (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  unique (client_id, user_id)
);

create table calendar_events (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade,
  title text not null,
  platform text,
  scheduled_date date not null,
  status text default 'planned' check (status in ('planned', 'in_progress', 'posted')),
  notes text,
  created_at timestamptz default now()
);

create table content_items (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade,
  title text not null,
  body text,
  content_type text default 'script' check (content_type in ('script', 'caption', 'copy', 'brief', 'other')),
  linked_event_id uuid references calendar_events(id) on delete set null,
  created_at timestamptz default now()
);

-- Google Docs / Sheets links per brand (manual-link section, see README for real sync path)
create table resources (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade,
  label text not null,
  url text not null,
  resource_type text default 'other' check (resource_type in ('google_doc', 'google_sheet', 'other')),
  created_at timestamptz default now()
);

create table tasks (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade,
  title text not null,
  description text,
  status text default 'pending' check (status in ('pending', 'in_progress', 'done')),
  due_date date,
  assigned_to uuid references profiles(id),
  created_at timestamptz default now()
);

create table projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  tagline text,
  description text,
  route text,
  access_code text,
  cover_color text,
  status text default 'draft' check (status in ('draft', 'live')),
  created_at timestamptz default now()
);

-- ============================================================
-- Row Level Security
-- ============================================================
alter table profiles enable row level security;
alter table clients enable row level security;
alter table client_members enable row level security;
alter table calendar_events enable row level security;
alter table content_items enable row level security;
alter table resources enable row level security;
alter table tasks enable row level security;
alter table projects enable row level security;

create or replace function is_admin() returns boolean as $$
  select exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'owner'));
$$ language sql security definer;

create or replace function is_client_member(cid uuid) returns boolean as $$
  select exists (select 1 from client_members where client_id = cid and user_id = auth.uid());
$$ language sql security definer;

-- Anyone signed in can see other profiles' names (needed for the Team/Access picker + assignee names)
create policy "profiles_select" on profiles for select using (true);
create policy "profiles_update_self" on profiles for update using (id = auth.uid());
create policy "profiles_admin_update" on profiles for update using (is_admin());

create policy "clients_admin_all" on clients for all using (is_admin()) with check (is_admin());
create policy "clients_member_select" on clients for select using (is_client_member(id));

create policy "client_members_admin_all" on client_members for all using (is_admin()) with check (is_admin());
create policy "client_members_self_select" on client_members for select using (user_id = auth.uid());

create policy "calendar_admin_all" on calendar_events for all using (is_admin()) with check (is_admin());
create policy "calendar_member_select" on calendar_events for select using (is_client_member(client_id));
create policy "calendar_member_write" on calendar_events for insert with check (is_client_member(client_id));
create policy "calendar_member_update" on calendar_events for update using (is_client_member(client_id));

create policy "content_admin_all" on content_items for all using (is_admin()) with check (is_admin());
create policy "content_member_select" on content_items for select using (is_client_member(client_id));
create policy "content_member_write" on content_items for insert with check (is_client_member(client_id));

create policy "resources_admin_all" on resources for all using (is_admin()) with check (is_admin());
create policy "resources_member_select" on resources for select using (is_client_member(client_id));
create policy "resources_member_write" on resources for insert with check (is_client_member(client_id));

create policy "tasks_admin_all" on tasks for all using (is_admin()) with check (is_admin());
create policy "tasks_member_select" on tasks for select using (is_client_member(client_id));
create policy "tasks_member_write" on tasks for insert with check (is_client_member(client_id));
create policy "tasks_member_update" on tasks for update using (is_client_member(client_id));

create policy "projects_select_public" on projects for select using (status = 'live');
create policy "projects_admin_all" on projects for all using (is_admin()) with check (is_admin());

-- Auto-create a profile row on signup
create or replace function handle_new_user() returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', 'client');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ============================================================
-- AFTER RUNNING THIS: make yourself admin (sign up in the app first, then run):
--   update profiles set role = 'admin' where email = 'you@example.com';
--
-- To make someone a Designer instead of a Client:
--   update profiles set role = 'team' where email = 'designer@example.com';
-- (Both roles use the same client_members table to control which brands they see.)
-- ============================================================
