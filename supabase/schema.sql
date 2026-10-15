-- =============================================================================
-- Website database schema
-- Run this whole file once in Supabase → SQL Editor → New query → Run.
-- It is safe to run again: it only creates what is missing and resets policies.
-- Then run seed.sql to load your starting content.
-- =============================================================================

create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- Admin accounts
-- Only users listed here can change the website. Signing in is not enough.
-- -----------------------------------------------------------------------------
create table if not exists public.admin_users (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid());
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- -----------------------------------------------------------------------------
-- Site settings (one row)
-- -----------------------------------------------------------------------------
create table if not exists public.site_settings (
  id                   int primary key default 1 check (id = 1),
  business_name        text not null default '[Business Name]',
  logo_url             text,
  hero_headline        text,
  hero_subheadline     text,
  slogan               text,
  show_slogan          boolean not null default true,
  hero_image_url       text,
  bar_heading          text,
  bar_text             text,
  highlights           text[] not null default '{}',
  packages_note        text,
  street_address       text,
  city                 text,
  province             text,
  postal_code          text,
  phone                text,
  public_email         text,
  website_url          text,
  booking_url          text,
  inquiry_email        text,
  facebook_url         text,
  instagram_url        text,
  tiktok_url           text,
  seo_description      text,
  pricing_season_label text,
  pricing_note         text,
  hours_season_label   text,
  updated_at           timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Announcement banner
-- -----------------------------------------------------------------------------
create table if not exists public.announcements (
  id         uuid primary key default gen_random_uuid(),
  message    text not null,
  link_url   text,
  link_label text,
  enabled    boolean not null default true,
  starts_at  timestamptz,
  ends_at    timestamptz,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Events (one-off or repeating weekly)
-- -----------------------------------------------------------------------------
create table if not exists public.events (
  id             uuid primary key default gen_random_uuid(),
  title          text not null,
  description    text,
  event_date     date not null,
  start_time     time,
  end_time       time,
  repeats_weekly boolean not null default false,
  repeat_until   date,
  image_url      text,
  admission      text,
  button_label   text,
  button_url     text,
  featured       boolean not null default false,
  published      boolean not null default true,
  created_at     timestamptz not null default now()
);
create index if not exists events_date_idx on public.events (event_date);

-- -----------------------------------------------------------------------------
-- Golf simulators
-- -----------------------------------------------------------------------------
create table if not exists public.bay_types (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  summary    text,
  details    text[] not null default '{}',
  sort_order int not null default 0
);

create table if not exists public.pricing_rates (
  id           uuid primary key default gen_random_uuid(),
  label        text not null,
  open_bay     numeric(8, 2),
  semi_private numeric(8, 2),
  private_bay  numeric(8, 2),
  sort_order   int not null default 0
);

-- -----------------------------------------------------------------------------
-- Private event packages
-- -----------------------------------------------------------------------------
create table if not exists public.event_packages (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  price_label text not null,
  price_note  text,
  description text,
  features    text[] not null default '{}',
  featured    boolean not null default false,
  sort_order  int not null default 0
);

-- -----------------------------------------------------------------------------
-- Food & drink menu
-- -----------------------------------------------------------------------------
create table if not exists public.menu_categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  sort_order  int not null default 0
);

create table if not exists public.menu_items (
  id          uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.menu_categories (id) on delete cascade,
  name        text not null,
  description text,
  price       numeric(8, 2),
  image_url   text,
  available   boolean not null default true,
  sort_order  int not null default 0
);
create index if not exists menu_items_category_idx on public.menu_items (category_id);

-- -----------------------------------------------------------------------------
-- Opening hours (id 1 = Monday … 7 = Sunday) and holiday / special hours
-- -----------------------------------------------------------------------------
create table if not exists public.business_hours (
  id       int primary key check (id between 1 and 7),
  day_name text not null,
  opens    time,
  closes   time,
  closed   boolean not null default false
);

create table if not exists public.special_hours (
  id     uuid primary key default gen_random_uuid(),
  date   date not null,
  label  text not null,
  closed boolean not null default true,
  opens  time,
  closes time
);
create index if not exists special_hours_date_idx on public.special_hours (date);

-- -----------------------------------------------------------------------------
-- Photo gallery
-- -----------------------------------------------------------------------------
create table if not exists public.gallery_images (
  id         uuid primary key default gen_random_uuid(),
  image_url  text not null,
  alt_text   text not null,
  caption    text,
  category   text not null default 'Golf simulator bays',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Form submissions (private events + contact)
-- Written only by the website server; readable only by admins.
-- -----------------------------------------------------------------------------
create table if not exists public.inquiries (
  id             uuid primary key default gen_random_uuid(),
  kind           text not null check (kind in ('event', 'contact')),
  name           text not null,
  email          text not null,
  phone          text,
  preferred_date date,
  guest_count    int,
  package        text,
  message        text,
  ip_hash        text,
  email_sent     boolean not null default false,
  handled        boolean not null default false,
  created_at     timestamptz not null default now()
);
create index if not exists inquiries_ip_idx on public.inquiries (ip_hash, created_at);
create index if not exists inquiries_created_idx on public.inquiries (created_at desc);

-- =============================================================================
-- Row-level security
-- =============================================================================

alter table public.admin_users enable row level security;
drop policy if exists "Admins can see their own row" on public.admin_users;
create policy "Admins can see their own row" on public.admin_users
  for select to authenticated using (user_id = auth.uid());

-- Content anyone can read; only admins can change.
do $$
declare
  t text;
begin
  foreach t in array array[
    'site_settings', 'bay_types', 'pricing_rates', 'event_packages',
    'menu_categories', 'menu_items', 'business_hours', 'special_hours', 'gallery_images'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "Public read" on public.%I', t);
    execute format('create policy "Public read" on public.%I for select to anon, authenticated using (true)', t);
    execute format('drop policy if exists "Admins manage" on public.%I', t);
    execute format(
      'create policy "Admins manage" on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())',
      t
    );
    execute format('grant select on public.%I to anon, authenticated', t);
    execute format('grant insert, update, delete on public.%I to authenticated', t);
  end loop;
end $$;

-- Visitors may read every settings column except the private inquiry email.
revoke select on public.site_settings from anon;
grant select (
  id, business_name, logo_url, hero_headline, hero_subheadline, slogan, show_slogan,
  hero_image_url, bar_heading, bar_text, highlights, packages_note, street_address, city, province,
  postal_code, phone, public_email, website_url, booking_url, facebook_url, instagram_url,
  tiktok_url, seo_description, pricing_season_label, pricing_note, hours_season_label, updated_at
) on public.site_settings to anon;

-- Announcements: the public only sees enabled ones.
alter table public.announcements enable row level security;
drop policy if exists "Public read enabled" on public.announcements;
create policy "Public read enabled" on public.announcements
  for select to anon, authenticated using (enabled = true);
drop policy if exists "Admins manage" on public.announcements;
create policy "Admins manage" on public.announcements
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
grant select on public.announcements to anon, authenticated;
grant insert, update, delete on public.announcements to authenticated;

-- Events: the public only sees published ones.
alter table public.events enable row level security;
drop policy if exists "Public read published" on public.events;
create policy "Public read published" on public.events
  for select to anon, authenticated using (published = true);
drop policy if exists "Admins manage" on public.events;
create policy "Admins manage" on public.events
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
grant select on public.events to anon, authenticated;
grant insert, update, delete on public.events to authenticated;

-- Inquiries: admins can read, update (mark handled) and delete. No public access.
alter table public.inquiries enable row level security;
drop policy if exists "Admins manage" on public.inquiries;
create policy "Admins manage" on public.inquiries
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
revoke all on public.inquiries from anon;
grant select, update, delete on public.inquiries to authenticated;

grant select on public.admin_users to authenticated;

-- =============================================================================
-- Photo storage bucket ("media"): public to view, admins to upload/change
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media', 'media', true, 10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Photos are served through public URLs, which don't need a policy. Only admins
-- can list the bucket (so unpublished uploads such as draft flyers stay private).
drop policy if exists "Public can view media" on storage.objects;
drop policy if exists "Admins can read media" on storage.objects;
create policy "Admins can read media" on storage.objects
  for select to authenticated using (bucket_id = 'media' and public.is_admin());

drop policy if exists "Admins can upload media" on storage.objects;
create policy "Admins can upload media" on storage.objects
  for insert to authenticated with check (bucket_id = 'media' and public.is_admin());

drop policy if exists "Admins can update media" on storage.objects;
create policy "Admins can update media" on storage.objects
  for update to authenticated using (bucket_id = 'media' and public.is_admin());

drop policy if exists "Admins can delete media" on storage.objects;
create policy "Admins can delete media" on storage.objects
  for delete to authenticated using (bucket_id = 'media' and public.is_admin());

-- =============================================================================
-- Form submissions: saved through a function that only the website server can
-- call (it must send the secret stored below, which you copy into Vercel as
-- FORM_SECRET). Also applies the spam rate limit: 3 per visitor per 10 minutes.
-- =============================================================================

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
create table if not exists private.app_config (
  key   text primary key,
  value text not null
);
insert into private.app_config (key, value)
values ('form_secret', encode(gen_random_bytes(24), 'hex'))
on conflict (key) do nothing;

create or replace function public.submit_inquiry(
  p_secret text,
  p_kind text,
  p_name text,
  p_email text,
  p_phone text default null,
  p_preferred_date date default null,
  p_guest_count int default null,
  p_package text default null,
  p_message text default null,
  p_ip_hash text default null
)
returns json
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_expected  text;
  v_recent    int;
  v_id        uuid;
  v_recipient text;
begin
  select value into v_expected from private.app_config where key = 'form_secret';
  if v_expected is null or p_secret is distinct from v_expected then
    raise exception 'Not allowed' using errcode = '42501';
  end if;

  if p_ip_hash is not null then
    select count(*) into v_recent
    from public.inquiries
    where ip_hash = p_ip_hash and created_at > now() - interval '10 minutes';
    if v_recent >= 3 then
      return json_build_object('status', 'rate_limited');
    end if;
  end if;

  insert into public.inquiries (kind, name, email, phone, preferred_date, guest_count, package, message, ip_hash)
  values (p_kind, p_name, p_email, p_phone, p_preferred_date, p_guest_count, p_package, p_message, p_ip_hash)
  returning id into v_id;

  select inquiry_email into v_recipient from public.site_settings where id = 1;
  return json_build_object('status', 'ok', 'id', v_id, 'recipient', v_recipient);
end;
$$;

create or replace function public.mark_inquiry_emailed(p_secret text, p_id uuid)
returns void
language plpgsql
security definer
set search_path = public, private
as $$
begin
  if p_secret is distinct from (select value from private.app_config where key = 'form_secret') then
    raise exception 'Not allowed' using errcode = '42501';
  end if;
  update public.inquiries set email_sent = true where id = p_id;
end;
$$;

revoke all on function public.submit_inquiry(text, text, text, text, text, date, int, text, text, text) from public;
grant execute on function public.submit_inquiry(text, text, text, text, text, date, int, text, text, text) to anon, authenticated;
revoke all on function public.mark_inquiry_emailed(text, uuid) from public;
grant execute on function public.mark_inquiry_emailed(text, uuid) to anon, authenticated;

-- =============================================================================
-- Winter golf league page: settings (one row) and pricing options
-- =============================================================================

create table if not exists public.league_settings (
  id            int primary key default 1 check (id = 1),
  enabled       boolean not null default true,
  title         text not null default 'Winter Golf League',
  intro         text,
  season        text,
  schedule      text,
  highlights    text[] not null default '{}',
  email         text,
  email_subject text default 'Winter Golf League inquiry',
  note          text,
  updated_at    timestamptz not null default now()
);

create table if not exists public.league_options (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  price_label text not null,
  price_note  text,
  description text,
  features    text[] not null default '{}',
  featured    boolean not null default false,
  sort_order  int not null default 0
);

do $$
declare
  t text;
begin
  foreach t in array array['league_settings', 'league_options'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "Public read" on public.%I', t);
    execute format('create policy "Public read" on public.%I for select to anon, authenticated using (true)', t);
    execute format('drop policy if exists "Admins manage" on public.%I', t);
    execute format(
      'create policy "Admins manage" on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())',
      t
    );
    execute format('grant select on public.%I to anon, authenticated', t);
    execute format('grant insert, update, delete on public.%I to authenticated', t);
  end loop;
end $$;

-- Photo for each simulator bay (shown on the homepage and pricing page)
alter table public.bay_types add column if not exists image_url text;

-- Several photos per simulator bay (swipeable on the homepage and pricing page)
alter table public.bay_types add column if not exists photos text[] not null default '{}';

-- =============================================================================
-- Homepage photo sets (one row) and photos on packages / league options
-- =============================================================================

create table if not exists public.homepage_photos (
  id            int primary key default 1 check (id = 1),
  hero_photos   text[] not null default '{}',
  bar_photos    text[] not null default '{}',
  events_photos text[] not null default '{}',
  league_photos text[] not null default '{}',
  visit_photos  text[] not null default '{}',
  updated_at    timestamptz not null default now()
);
alter table public.homepage_photos enable row level security;
drop policy if exists "Public read" on public.homepage_photos;
create policy "Public read" on public.homepage_photos for select to anon, authenticated using (true);
drop policy if exists "Admins manage" on public.homepage_photos;
create policy "Admins manage" on public.homepage_photos
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
grant select on public.homepage_photos to anon, authenticated;
grant insert, update, delete on public.homepage_photos to authenticated;
insert into public.homepage_photos (id) values (1) on conflict (id) do nothing;

alter table public.event_packages add column if not exists photos text[] not null default '{}';
alter table public.league_options add column if not exists photos text[] not null default '{}';

-- =============================================================================
-- Pool table (one row): photos, price and booking link
-- =============================================================================

create table if not exists public.pool_table (
  id          int primary key default 1 check (id = 1),
  enabled     boolean not null default true,
  title       text not null default 'Pool Table',
  description text,
  price_label text not null default '$20',
  price_note  text default 'per hour',
  features    text[] not null default '{}',
  photos      text[] not null default '{}',
  booking_url text,
  updated_at  timestamptz not null default now()
);
alter table public.pool_table enable row level security;
drop policy if exists "Public read" on public.pool_table;
create policy "Public read" on public.pool_table for select to anon, authenticated using (true);
drop policy if exists "Admins manage" on public.pool_table;
create policy "Admins manage" on public.pool_table
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
grant select on public.pool_table to anon, authenticated;
grant insert, update, delete on public.pool_table to authenticated;

-- Which pricing column each bay's price range comes from
alter table public.bay_types add column if not exists price_column text
  check (price_column in ('open_bay', 'semi_private', 'private_bay'));

-- =============================================================================
-- Meet the Owners: section settings (one row) and each owner
-- =============================================================================

create table if not exists public.owners_section (
  id         int primary key default 1 check (id = 1),
  enabled    boolean not null default true,
  heading    text not null default 'Meet the Owners',
  intro      text,
  photo_url  text,             -- one group photo of the owners
  updated_at timestamptz not null default now()
);

create table if not exists public.owners (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  role       text,
  bio        text,
  photo_url  text,
  sort_order int not null default 0
);

do $$
declare
  t text;
begin
  foreach t in array array['owners_section', 'owners'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "Public read" on public.%I', t);
    execute format('create policy "Public read" on public.%I for select to anon, authenticated using (true)', t);
    execute format('drop policy if exists "Admins manage" on public.%I', t);
    execute format(
      'create policy "Admins manage" on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())',
      t
    );
    execute format('grant select on public.%I to anon, authenticated', t);
    execute format('grant insert, update, delete on public.%I to authenticated', t);
  end loop;
end $$;
insert into public.owners_section (id) values (1) on conflict (id) do nothing;
-- (earlier versions had a "photos" list here; the group photo now lives in photo_url)
alter table public.owners_section add column if not exists photo_url text;

-- =============================================================================
-- Google reviews: rating + buttons (one row) and the reviews you choose to show
-- =============================================================================

create table if not exists public.reviews_section (
  id               int primary key default 1 check (id = 1),
  enabled          boolean not null default true,
  heading          text not null default 'What our guests are saying',
  rating           numeric(2,1) check (rating is null or (rating >= 1 and rating <= 5)),
  review_count     int check (review_count is null or review_count >= 0),
  google_url       text,       -- "Read all reviews on Google" button
  write_review_url text,       -- "Leave us a review" button
  updated_at       timestamptz not null default now()
);

create table if not exists public.reviews (
  id          uuid primary key default gen_random_uuid(),
  author      text not null,
  rating      int not null default 5 check (rating between 1 and 5),
  quote       text not null,
  review_date date,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

do $$
declare
  t text;
begin
  foreach t in array array['reviews_section', 'reviews'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "Public read" on public.%I', t);
    execute format('create policy "Public read" on public.%I for select to anon, authenticated using (true)', t);
    execute format('drop policy if exists "Admins manage" on public.%I', t);
    execute format(
      'create policy "Admins manage" on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())',
      t
    );
    execute format('grant select on public.%I to anon, authenticated', t);
    execute format('grant insert, update, delete on public.%I to authenticated', t);
  end loop;
end $$;
insert into public.reviews_section (id) values (1) on conflict (id) do nothing;
-- Tip: in the dashboard, set the two links using your Google place ID:
--   https://www.google.com/maps/place/?q=place_id:YOUR_PLACE_ID
--   https://search.google.com/local/writereview?placeid=YOUR_PLACE_ID

-- =============================================================================
-- Gift cards page (one row), FAQ, and privacy policy (one row)
-- =============================================================================

create table if not exists public.gift_cards (
  id           int primary key default 1 check (id = 1),
  enabled      boolean not null default true,
  heading      text not null default 'Gift Cards',
  intro        text,
  how_to_order text,
  amounts      text[] not null default '{}',
  highlights   text[] not null default '{}',
  photo_url    text,
  updated_at   timestamptz not null default now()
);

create table if not exists public.faqs (
  id         uuid primary key default gen_random_uuid(),
  question   text not null,
  answer     text not null default '',   -- answers still in [brackets] are hidden on the site
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.privacy_policy (
  id         int primary key default 1 check (id = 1),
  content    text not null default '',   -- "## " headings, "- " bullets, {business_name}/{email}/{phone}/{address}
  updated_on date not null default current_date,
  updated_at timestamptz not null default now()
);

do $$
declare
  t text;
begin
  foreach t in array array['gift_cards', 'faqs', 'privacy_policy'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "Public read" on public.%I', t);
    execute format('create policy "Public read" on public.%I for select to anon, authenticated using (true)', t);
    execute format('drop policy if exists "Admins manage" on public.%I', t);
    execute format(
      'create policy "Admins manage" on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())',
      t
    );
    execute format('grant select on public.%I to anon, authenticated', t);
    execute format('grant insert, update, delete on public.%I to authenticated', t);
  end loop;
end $$;

-- =============================================================================
-- Menu (one row): the menu PDF and a picture of each page for the Food & Drink page.
-- (The older menu_categories / menu_items tables are no longer shown on the site.)
-- =============================================================================

create table if not exists public.menu_settings (
  id          int primary key default 1 check (id = 1),
  heading     text not null default 'Our Menu',
  intro       text,
  pdf_url     text,
  page_images text[] not null default '{}',
  updated_at  timestamptz not null default now()
);

alter table public.menu_settings enable row level security;
drop policy if exists "Public read" on public.menu_settings;
create policy "Public read" on public.menu_settings for select to anon, authenticated using (true);
drop policy if exists "Admins manage" on public.menu_settings;
create policy "Admins manage" on public.menu_settings for all to authenticated using (public.is_admin()) with check (public.is_admin());
grant select on public.menu_settings to anon, authenticated;
grant insert, update, delete on public.menu_settings to authenticated;

-- The dashboard uploads menu PDFs to the media bucket.
update storage.buckets
   set allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'application/pdf']
 where id = 'media';

-- Online sign-up link for the Winter Golf League (e.g. a Trackman league page).
alter table public.league_settings add column if not exists signup_url text;

-- "How to sign up & pay" steps on the Winter Golf League page.
create table if not exists public.league_steps (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text not null default '',
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);
alter table public.league_steps enable row level security;
drop policy if exists "Public read" on public.league_steps;
create policy "Public read" on public.league_steps for select to anon, authenticated using (true);
drop policy if exists "Admins manage" on public.league_steps;
create policy "Admins manage" on public.league_steps for all to authenticated using (public.is_admin()) with check (public.is_admin());
grant select on public.league_steps to anon, authenticated;
grant insert, update, delete on public.league_steps to authenticated;

-- Longer league description (format, tee times, rules, registration) under "How it works".
alter table public.league_settings add column if not exists details text;

-- =============================================================================
-- "Watch the game here" schedule, memberships & hour packs, course showcase,
-- kids' party packages, and the Instagram strip's feed link.
-- =============================================================================

create table if not exists public.sports_games (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  sport      text,
  game_date  date not null,
  start_time time,
  note       text,
  featured   boolean not null default false,
  published  boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.membership_plans (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  price_label text not null default '',   -- plans still in [brackets] stay hidden on the site
  price_note  text,
  description text,
  features    text[] not null default '{}',
  featured    boolean not null default false,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists public.courses (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  location    text,
  description text,
  image_url   text,
  published   boolean not null default true,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

-- (No longer shown on the site: kids' parties are now a private event package.)
create table if not exists public.kids_packages (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  price_label text not null default '',   -- packages still in [brackets] stay hidden on the site
  price_note  text,
  description text,
  features    text[] not null default '{}',
  featured    boolean not null default false,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

do $$
declare
  t text;
begin
  foreach t in array array['sports_games', 'membership_plans', 'courses', 'kids_packages'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "Public read" on public.%I', t);
    execute format('drop policy if exists "Public read published" on public.%I', t);
    if t in ('sports_games', 'courses') then
      -- Admins see hidden rows through "Admins manage" below (visitors can't call is_admin()).
      execute format('create policy "Public read published" on public.%I for select to anon, authenticated using (published = true)', t);
    else
      execute format('create policy "Public read" on public.%I for select to anon, authenticated using (true)', t);
    end if;
    execute format('drop policy if exists "Admins manage" on public.%I', t);
    execute format(
      'create policy "Admins manage" on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())',
      t
    );
    execute format('grant select on public.%I to anon, authenticated', t);
    execute format('grant insert, update, delete on public.%I to authenticated', t);
  end loop;
end $$;

-- Behold.so JSON feed link for the homepage Instagram strip (public, like the other social links).
alter table public.site_settings add column if not exists instagram_feed_url text;
grant select (instagram_feed_url) on public.site_settings to anon;

-- Rental Clubs section on the homepage (one row).
create table if not exists public.rental_clubs (
  id          int primary key default 1 check (id = 1),
  enabled     boolean not null default true,
  title       text not null default 'Rental Clubs',
  description text,
  price_label text,   -- optional; hidden while blank or in [brackets]
  price_note  text,
  features    text[] not null default '{}',
  photos      text[] not null default '{}',
  updated_at  timestamptz not null default now()
);
alter table public.rental_clubs enable row level security;
drop policy if exists "Public read" on public.rental_clubs;
create policy "Public read" on public.rental_clubs for select to anon, authenticated using (true);
drop policy if exists "Admins manage" on public.rental_clubs;
create policy "Admins manage" on public.rental_clubs for all to authenticated using (public.is_admin()) with check (public.is_admin());
grant select on public.rental_clubs to anon, authenticated;
grant insert, update, delete on public.rental_clubs to authenticated;

-- Gift cards: online shop link (e.g. Toast eGift cards) and its QR code.
alter table public.gift_cards add column if not exists buy_url text;
alter table public.gift_cards add column if not exists qr_image_url text;

-- Memberships: online checkout (Stripe Payment Link) per plan, plus the Stripe
-- customer portal link members use to update their card or cancel.
alter table public.membership_plans add column if not exists buy_url text;
alter table public.membership_plans add column if not exists buy_label text;
alter table public.site_settings add column if not exists membership_portal_url text;
grant select (membership_portal_url) on public.site_settings to anon;
