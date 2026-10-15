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

-- Link each bay to its pricing column (shows "$50 – $65 per hour" on its card)
update public.bay_types set price_column = 'open_bay'     where price_column is null and name ilike 'open%';
update public.bay_types set price_column = 'semi_private' where price_column is null and name ilike 'semi%';
update public.bay_types set price_column = 'private_bay'  where price_column is null and name ilike 'private%';

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

insert into public.league_steps (title, description, sort_order)
select * from (values
  ('Get the Trackman Golf app', 'Download the free Trackman Golf app from the App Store or Google Play. Sign in, or create your free Trackman account.', 1),
  ('Open our league link', 'On your phone, tap “Sign up now” on this page. It opens The Clubhouse Winter League in the Trackman Golf app.', 2),
  ('Tap “Join”', 'Tap Join to enter this season of the league.', 3),
  ('Pay your league fee', 'Trackman takes you straight to a secure payment page. Pay your entry fee there to lock in your spot.', 4),
  ('You’re in!', 'After you pay, you’re taken back to the season page. Scroll down to see the league schedule, formats and rules. Sign in to your Trackman account on the simulator when you play, so your league rounds count.', 5)
) as v(title, description, sort_order)
where not exists (select 1 from public.league_steps);

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

-- Gift cards page ---------------------------------------------------------------
insert into public.gift_cards (id, intro, how_to_order)
values (
  1,
  'The perfect gift for the golfer in your life, or anyone who loves a great night out.',
  'To order a gift card, give us a call or send us an email. Let us know the amount and who it''s for, and we''ll take care of the rest.'
)
on conflict (id) do nothing;

insert into public.announcements (message, link_url, link_label, enabled, sort_order)
select 'Gift cards are available: call or email us to order', '/gift-cards', 'Gift cards', true, 4
where not exists (select 1 from public.announcements where link_url = '/gift-cards');

-- FAQ (answers in [square brackets] stay hidden until you fill them in) -----------
insert into public.faqs (question, answer, sort_order)
select * from (values
  ('Do I need to bring my own golf clubs?',
   'No. We have rental clubs for left-handed, right-handed and women''s golfers. You''re welcome to bring your own set too.', 1),
  ('I''ve never golfed before. Is this for me?',
   'Absolutely. Our simulators are fun for every skill level, from first-timers to seasoned golfers. Just ask and we''ll get you set up.', 2),
  ('How do I book a simulator?',
   'Book online with the Book a Simulator button at the top of any page, or give us a call.', 3),
  ('How many people can play in one bay?',
   '[How many golfers fit in each bay, e.g. Up to six per bay, and up to eight in our private bay.]', 4),
  ('How long does a round of golf take?',
   'As a rough guide, 18 holes takes about an hour per player and 9 holes about half that. A group of four playing 18 holes should book around three to four hours.', 5),
  ('Do you take walk-ins?',
   '[e.g. Yes, whenever a bay is free. We recommend booking ahead for evenings and weekends.]', 6),
  ('Can we eat and drink while we play?',
   'Yes. We have a full-service bar and food menu, and you can order while you play.', 7),
  ('Can I book the pool table?',
   'Yes. The pool table is $20 an hour and you can book it online.', 8),
  ('Are kids allowed?',
   '[Your policy for guests under 19, e.g. Minors are welcome with an adult until 8 PM.]', 9),
  ('What should I wear?',
   '[e.g. Whatever you''re comfortable swinging in. Please no golf spikes.]', 10),
  ('What is your cancellation policy?',
   '[Your cancellation or rescheduling policy.]', 11),
  ('Do you host private parties and corporate events?',
   'Yes. We host birthdays, holiday parties, corporate events and more, from a private bay for a small group to the whole venue. Visit our Private Events page to send us an inquiry.', 12),
  ('Do you sell gift cards?',
   'Yes. Call or email us to order one. See our Gift Cards page for details.', 13),
  ('Do you have a winter golf league?',
   'Yes. See our Winter League page for details and how to join.', 14)
) as v(question, answer, sort_order)
where not exists (select 1 from public.faqs);

-- Privacy policy (a plain-language starting point; not legal advice) -------------
insert into public.privacy_policy (id, content)
values (1, $policy${business_name} ("we" or "us") respects your privacy. This page explains what personal information we collect through this website, how we use it, and the choices you have.

## What we collect
When you send us a message or a private event inquiry, we collect the details you enter: your name, email address, phone number, event date, group size and message.

To block spam, our forms also record a scrambled code made from your internet address. The code can't be turned back into your address, and we only use it to limit repeated submissions.

When you browse the site, we collect anonymous visitor statistics, such as which pages are viewed, the type of device and browser, and the country a visit comes from. These statistics don't use cookies and don't identify you personally.

## How we use it
- To reply to your questions and plan your event
- To keep a record of the inquiries we receive
- To understand which pages are useful so we can improve the site

We don't sell or rent your personal information, and we don't use it for advertising.

## Who we share it with
We use trusted service providers to run this website: Vercel (website hosting and visitor statistics), Supabase (database) and an email delivery service that forwards inquiries to us. They handle your information only to provide these services to us. These providers may store or process information outside Canada, including in the United States, where it may be subject to the laws of that country.

Online simulator and pool table bookings are handled by our booking provider, YourGolfBooking, on its own website and under its own privacy policy. The map on our Contact page is provided by Google.

## How long we keep it
We keep inquiries for as long as we need them to respond and for our business records, and then delete them.

## Cookies
This website doesn't use advertising or tracking cookies. Cookies are only used to keep our staff signed in to the website's admin area.

## Your choices
You can ask to see the personal information we hold about you, ask us to correct it, or ask us to delete it. You can also withdraw your consent at any time. Contact us using the details below and we'll respond within 30 days.

## Contact us
If you have questions about this policy or your information, contact {business_name}:
{address}
Email: {email}
Phone: {phone}

## Changes to this policy
We may update this policy from time to time. The date at the top of this page shows when it was last updated.$policy$)
on conflict (id) do nothing;

-- Menu PDF and page pictures (files ship with the site in public/menu-files) ------
insert into public.menu_settings (id, intro, pdf_url, page_images)
values (
  1,
  'Scroll through our full food and drink menu below, or download it to keep on your phone.',
  '/menu-files/the-clubhouse-menu.pdf',
  array['/menu-files/menu-page-1.jpg', '/menu-files/menu-page-2.jpg', '/menu-files/menu-page-3.jpg', '/menu-files/menu-page-4.jpg', '/menu-files/menu-page-5.jpg']
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

-- Memberships & hour packs: fill in the [brackets] in Admin to show them ----------
insert into public.membership_plans (name, price_label, price_note, description, features, featured, sort_order)
select * from (values
  ('Hour Pack', '[Price]', '[e.g. 10 hours of simulator time]', '[Short description, e.g. Prepaid simulator hours at a discount. Use them any time.]', array['[What''s included]'], false, 1),
  ('Monthly Membership', '[Price per month]', '[e.g. per month]', '[Short description, e.g. A set number of hours every month, plus member perks.]', array['[What''s included]'], true, 2)
) as v(name, price_label, price_note, description, features, featured, sort_order)
where not exists (select 1 from public.membership_plans);

-- Kids' party packages: fill in the [brackets] in Admin to show them ---------------
insert into public.kids_packages (name, price_label, price_note, description, features, featured, sort_order)
select * from (values
  ('Kids'' Birthday Party', '[Price]', '[e.g. up to 10 kids · 2 hours]', '[Short description]', array['[What''s included, e.g. private simulator bay]'], false, 1)
) as v(name, price_label, price_note, description, features, featured, sort_order)
where not exists (select 1 from public.kids_packages);

-- Course showcase: only list courses your Trackman simulators actually have ---------
insert into public.courses (name, location, description, sort_order)
select * from (values
  ('St Andrews (Old Course)', 'St Andrews, Scotland', 'The Home of Golf. Play the most famous links in the world, from the Swilcan Bridge to the Road Hole.', 1),
  ('Royal Troon', 'Troon, Scotland', 'Open Championship links on Scotland’s west coast, home of the famous “Postage Stamp” par 3.', 2),
  ('Royal Portrush', 'Portrush, Northern Ireland', 'Dramatic links on the Antrim coast and host of The Open in 2019 and 2025.', 3),
  ('Royal Birkdale', 'Southport, England', 'Classic links among the sand dunes of England’s northwest coast and a regular host of The Open.', 4),
  ('Pebble Beach Golf Links', 'Pebble Beach, California', 'America’s most famous public course, with cliff-top holes along the Pacific Ocean.', 5),
  ('Pinehurst No. 2', 'Pinehurst, North Carolina', 'Donald Ross’s masterpiece, known for its crowned greens and a regular U.S. Open host.', 6),
  ('Muirfield Village', 'Dublin, Ohio', 'Jack Nicklaus’s course and home of the Memorial Tournament.', 7),
  ('Quail Hollow', 'Charlotte, North Carolina', 'A Tour favourite with the famous “Green Mile” finish and host of the 2025 PGA Championship.', 8),
  ('Valderrama', 'Sotogrande, Spain', 'Host of the 1997 Ryder Cup, the first played in continental Europe.', 9),
  ('PGA National (Champion)', 'Palm Beach Gardens, Florida', 'Take on the “Bear Trap,” the notorious stretch of holes 15 to 17.', 10),
  ('Liberty National', 'Jersey City, New Jersey', 'Skyline views of Manhattan and the Statue of Liberty from almost every hole.', 11),
  ('Lofoten Links', 'Lofoten Islands, Norway', 'Seaside links above the Arctic Circle in northern Norway.', 12)
) as v(name, location, description, sort_order)
where not exists (select 1 from public.courses);

