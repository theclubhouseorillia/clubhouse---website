-- =============================================================================
-- Starting content. Run once, after schema.sql.
-- Each block only inserts if that table is still empty, so re-running is safe.
-- Everything here can be changed later in the admin dashboard.
-- Text in [square brackets] is a placeholder for you to replace.
-- =============================================================================

-- Site settings --------------------------------------------------------------
insert into public.site_settings (
  id, business_name, hero_subheadline, slogan, show_slogan,
  bar_heading, bar_text, highlights, packages_note,
  street_address, city, province, postal_code,
  seo_description, pricing_season_label, pricing_note, hours_season_label
) values (
  1,
  '[Business Name]',
  '[Secondary headline, e.g. your city''s premier indoor golf & entertainment destination]',
  '[Marketing slogan]',
  true,
  'A sports bar worth staying for',
  'Catch the game on large 4K screens, order from the full-service bar and kitchen, and rack up a game of pool between tee times. Karaoke, live DJs and live music keep the nights going.',
  array[
    'Four golf simulator bays: open, semi-private and private',
    'Full-service bar and food menu',
    'Premium Bose sound and multiple large 4K TVs',
    'Premium pool table',
    'Karaoke nights, live DJs and live music',
    'Rental clubs for left-handed, right-handed and women''s golfers',
    'About 5,000 sq ft of entertainment space'
  ],
  'Contact us for pricing and availability. We''ll tailor a package to your group and date.',
  '[Street address]', '[City]', '[Province]', '[Postal code]',
  '[One or two sentences describing your business for Google search results.]',
  'Winter pricing',
  'All prices are hourly and before applicable taxes.',
  'Winter hours'
)
on conflict (id) do nothing;

-- Simulator bay types ----------------------------------------------------------
insert into public.bay_types (name, summary, details, sort_order)
select * from (values
  ('Open Bays',
   'Two bays located near the sports bar and lounge, ideal for social golf and groups.',
   array['Steps from the bar, lounge and big screens', 'Great for groups and casual rounds', 'Rental clubs available'],
   1),
  ('Semi-Private Bay',
   'A more secluded simulator experience, set apart from the main lounge.',
   array['A quieter, more focused setting', 'Great for small groups and practice'],
   2),
  ('Private Bay',
   'Our premium private simulator space with a Bose sound system and a 75-inch television.',
   array['Fully private room', 'Bose sound system', '75-inch television', 'Up to eight golfers'],
   3)
) as v(name, summary, details, sort_order)
where not exists (select 1 from public.bay_types);

-- Simulator pricing ----------------------------------------------------------
insert into public.pricing_rates (label, open_bay, semi_private, private_bay, sort_order)
select * from (values
  ('Monday–Thursday, 11 AM–4 PM', 45::numeric, 55::numeric, 65::numeric, 1),
  ('Monday–Thursday, 4 PM–10 PM', 60, 70, 85, 2),
  ('Friday before 4 PM',          50, 60, 75, 3),
  ('Friday after 4 PM',           65, 75, 90, 4),
  ('Saturday',                    65, 75, 90, 5),
  ('Sunday',                      60, 70, 85, 6)
) as v(label, open_bay, semi_private, private_bay, sort_order)
where not exists (select 1 from public.pricing_rates);

-- Private event packages -----------------------------------------------------
insert into public.event_packages (name, price_label, price_note, description, features, featured, sort_order)
select * from (values
  ('Private Simulator Experience',
   'Inquire for pricing',
   null,
   'Your group''s own private simulator room.',
   array['Private simulator bay', 'Up to eight golfers', 'Bose sound system', '75-inch television', 'Premium golf experience'],
   false, 1),
  ('Group Golf Experience',
   'Inquire for pricing',
   null,
   'Three simulator bays plus the lounge and pool table for your group.',
   array['Two open simulator bays', 'One semi-private simulator bay', 'Lounge area', 'Pool table',
         'Premium Bose sound system', 'Televisions', 'Complimentary soft drinks',
         'Rental golf clubs, including left-handed, right-handed and women''s sets'],
   true, 2),
  ('Full Facility Private Event',
   'Inquire for pricing',
   null,
   'Exclusive use of the entire venue.',
   array['Exclusive use of our approximately 5,000 sq ft facility', 'All four golf simulator bays', 'Full lounge area',
         'Pool table', 'Premium Bose sound system', 'Televisions', 'Rental golf clubs',
         'Complimentary soft drinks and fries'],
   false, 3)
) as v(name, price_label, price_note, description, features, featured, sort_order)
where not exists (select 1 from public.event_packages);

-- Menu categories with one clearly labelled placeholder item each ------------
do $$
declare
  cat record;
  cat_id uuid;
begin
  if exists (select 1 from public.menu_categories) then
    return;
  end if;

  for cat in
    select * from (values
      ('Appetizers',            '[Appetizer name]',  1),
      ('Wings',                 '[Wing flavour]',     2),
      ('Main Dishes',           '[Main dish name]',   3),
      ('Beer',                  '[Beer name]',        4),
      ('Cocktails',             '[Cocktail name]',    5),
      ('Spirits',               '[Spirit name]',      6),
      ('Non-Alcoholic Drinks',  '[Drink name]',       7)
    ) as v(name, placeholder, sort_order)
  loop
    insert into public.menu_categories (name, sort_order)
    values (cat.name, cat.sort_order)
    returning id into cat_id;

    insert into public.menu_items (category_id, name, description, price, sort_order)
    values (cat_id, cat.placeholder, '[Placeholder: replace in Admin → Menu items]', null, 1);
  end loop;
end $$;

-- Opening hours (winter) -----------------------------------------------------
insert into public.business_hours (id, day_name, opens, closes, closed) values
  (1, 'Monday',    '11:00', '22:00', false),
  (2, 'Tuesday',   '11:00', '22:00', false),
  (3, 'Wednesday', '11:00', '22:00', false),
  (4, 'Thursday',  '11:00', '22:00', false),
  (5, 'Friday',    '11:00', '23:00', false),
  (6, 'Saturday',  '11:00', '23:00', false),
  (7, 'Sunday',    '12:00', '21:00', false)
on conflict (id) do nothing;

-- Announcement banner --------------------------------------------------------
insert into public.announcements (message, link_url, link_label, enabled, sort_order)
select * from (values
  ('Karaoke nights, live DJs and live music: see what''s coming up', '/events', 'See events', true, 1),
  ('Planning a holiday party or corporate event? We can host your whole group', '/private-events', 'Plan an event', true, 2),
  ('Winter simulator rates are now in effect', '/pricing', 'View pricing', true, 3)
) as v(message, link_url, link_label, enabled, sort_order)
where not exists (select 1 from public.announcements);

-- One unpublished sample event, so you can see how events are set up --------
insert into public.events (title, description, event_date, start_time, end_time, repeats_weekly, admission, published)
select '[Sample] Karaoke Night',
       'This is a sample to show how events work. Edit it with your real details and switch on "Published", or delete it.',
       current_date, '21:00'::time, '01:00'::time, true, 'Free entry', false
where not exists (select 1 from public.events);

-- Winter golf league page (fill in the [placeholders] in Admin → Winter league) --
insert into public.league_settings (id, title, intro, season, schedule, highlights, note)
values (
  1,
  'Winter Golf League',
  'Keep your game sharp all winter. Play weekly rounds on our Trackman iO simulators, compete on the leaderboard and enjoy the bar with your league mates.',
  '[Season dates, e.g. January to March]',
  '[League night and time, e.g. Tuesdays at 7 PM]',
  array[
    '[Format, e.g. 9 holes per week on world-famous courses]',
    '[What''s included, e.g. weekly prizes and an end-of-season party]',
    'All skill levels welcome'
  ],
  'Spots are limited. Email us to reserve yours.'
)
on conflict (id) do nothing;

insert into public.league_options (name, price_label, price_note, description, features, featured, sort_order)
select * from (values
  ('[League option, e.g. Individual]', '[Price]', '[e.g. per player, per season]',
   '[Short description]', array['[What''s included]'], false, 1),
  ('[League option, e.g. Two-person team]', '[Price]', '[e.g. per team, per season]',
   '[Short description]', array['[What''s included]'], true, 2)
) as v(name, price_label, price_note, description, features, featured, sort_order)
where not exists (select 1 from public.league_options);

-- Pool table -------------------------------------------------------------------
insert into public.pool_table (id, title, description, price_label, price_note, features)
values (
  1,
  'Premium Pool Table',
  'Rack ''em up between rounds or make a night of it. Grab a drink from the bar and challenge your crew on our premium pool table.',
  '$20',
  'per hour',
  array['Premium pool table', 'Book online in seconds']
)
on conflict (id) do nothing;

-- =============================================================================
-- MAKE YOURSELF AN ADMIN
-- 1. Supabase → Authentication → Users → Add user → Create new user
--    (enter your email + a strong password, tick "Auto confirm user").
-- 2. Replace the email below with that address, then run just these lines:
--
-- insert into public.admin_users (user_id)
-- select id from auth.users where email = 'you@example.com'
-- on conflict do nothing;
-- =============================================================================
