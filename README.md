# Golf Simulator & Sports Bar Website

A fast, mobile-friendly website with a password-protected admin dashboard. Once it's set up, you can update announcements, events, pricing, packages, hours, the menu and photos yourself, without touching any code.

**Built with:** Next.js (React) · Tailwind CSS · Supabase (database, logins, photo storage) · Resend (email) · hosted on Vercel.

---

## What's included

**Public website**

| Page | What it does |
|---|---|
| Home | Hero with your headline and slogan, booking / private event / pricing buttons, simulator bays, sports bar, event packages, upcoming entertainment, hours and location |
| Simulators & Pricing (`/pricing`) | Your rate table (a table on computers, cards on phones), bay descriptions, booking buttons |
| Winter League (`/league`) | League details, season and schedule, pricing options and a "Sign up now" button (your online sign-up link, or an email if no link is set). Can be switched off in the dashboard |
| Events (`/events`) | Weekly nights, upcoming one-off events and past events. Past events move to the bottom automatically |
| Private Events (`/private-events`) | Packages and an inquiry form (name, email, phone, date, guests, package, details) |
| Food & Drink (`/menu`) | Menu by category with prices, descriptions and optional photos |
| Gallery (`/gallery`) | Photo grid with category filters and a full-screen viewer (swipe, arrow keys, Esc) |
| Contact (`/contact`) | Address, click-to-call, hours, Google Map, contact form, social links |

On every page: a rotating **announcement banner** at the very top (with arrows), a sticky menu, and a **Book a Simulator** bar pinned to the bottom of phone screens.

**Admin dashboard (`/admin`)**

- Business settings: name, logo, headlines, slogan, address, phone, **booking link**, **where form emails go**, social links
- Homepage photos: swipeable photo sets for the top of the page, sports bar, private events, winter league and visit sections
- Announcement banner: add, edit, delete, switch on/off, and schedule start and end times
- Events: one-off or **weekly repeating**, flyers, times, admission, ticket/booking links, feature on the homepage
- Orillia weather on the homepage beside “What’s on” (current conditions + forecast from Environment and Climate Change Canada, refreshed every 15 minutes; hidden automatically if the forecast can’t be reached)
- “Watch the game here” schedule: big games you're showing (Admin → Watch the game here), next three on the homepage sports bar section and the full list on `/sports`; past games drop off automatically
- Memberships & hour packs page (`/memberships`): plans appear once their name and price are filled in (no [brackets]). Paste a Stripe Payment Link into a plan's **Buy online link** (Admin → Memberships & hour packs) and its button goes straight to Stripe checkout; plans without one keep "Call to buy". Admin → Settings → **Members' self-serve link** takes the Stripe customer portal login link. Stripe test-mode links (`…/test_…`) are hidden on the production site and only show on preview deployments
- Membership emails (automatic): when someone buys through Stripe, `/api/stripe/webhook` saves them to Admin → **Members & pack buyers**, emails them a link to create their YourGolfBooking account, and emails you the details. Members get the code from Admin → **Member discount code** 24 hours later; when you change the code, every active member is emailed the new one the next morning (Vercel cron `/api/cron/member-codes`, 14:00 UTC). Cancellations and failed payments are emailed to you. Needs `STRIPE_WEBHOOK_SECRET` (from the Stripe webhook endpoint) and `CRON_SECRET` in Vercel
- Course showcase (`/courses`): famous courses on your Trackman simulators, linked from the homepage simulators section
- Kids' birthday parties: a “Kids' Birthday Party” package on the Private Events page (Admin → Private event packages); the old `/kids-parties` address forwards there
- Rental Clubs section on the homepage between the simulator bays and the pool table (Admin → Rental clubs: text, highlights, optional price, photos)
- Instagram strip on the homepage: paste a free Behold.so JSON feed link in Admin → Settings → “Instagram feed link (Behold)”
- Simulator pricing and bay descriptions
- Winter golf league page: step-by-step “How to sign up & pay”, details, pricing and the sign-up link (or email)
- Pool table: photos, hourly price and its own booking button
- Meet the Owners: your story, one group photo and each owner's name and title, at the bottom of the homepage
- Google reviews: your star rating, the reviews you pick, and "Leave us a review" / "Read all reviews on Google" buttons
- Gift Cards page: “Buy a gift card online” button and QR code for your online gift card shop (e.g. Toast eGift cards), plus call or email to order; homepage band with a buy button
- FAQ page: questions whose answer is still in [square brackets] stay hidden until you fill them in
- Calendar page: a month view plus day-by-day list of every event and weekly special (from Admin → Events), with holiday hours
- Food & Drink page shows your menu PDF: a picture of each page to scroll through, plus open/download buttons (Admin → Menu)
- Privacy policy page, linked in the footer and under every form (a plain-language starting point, not legal advice)
- Anonymous visitor stats with Vercel Web Analytics (turn it on in Vercel → your project → Analytics)
- Private event packages
- Menu: upload your menu PDF and a picture of each page
- Weekly hours, plus holiday and special hours
- Photo gallery uploads
- Inbox of every form submission (also emailed to you)
- A setup checklist on the Overview page

**Under the hood:** secure logins, a real database with row-level security, photo uploads that are automatically resized, form validation, spam protection (hidden honeypot field, timing check, rate limiting, optional Cloudflare Turnstile), SEO metadata, a sitemap, structured data for Google, accessibility features and error handling.

> **About placeholders.** Your prices, packages, hours and bay descriptions are pre-loaded. Your business name, address, phone, slogan, social links and photos start as placeholders in `[square brackets]`. Fill them in from the dashboard after your first login; the Overview page lists what's left.

---

## Setup guide (about 45–60 minutes, one time)

You'll create free or low-cost accounts with four services. Keep a text file open to paste keys into as you go.

### Step 1: Create the database (Supabase)

1. Go to **supabase.com**, sign up, and click **New project**. Choose the **Canada (Central)** region if offered. Save the database password somewhere safe.
2. When the project is ready, open **SQL Editor → New query**.
3. Open `supabase/schema.sql` from this project, copy everything, paste it in, and click **Run**. You should see "Success".
4. Do the same with `supabase/seed.sql`. This loads your pricing, packages, hours and starter content.
5. Go to **Project Settings → API** (sometimes labelled **API Keys**) and copy two things:
   - **Project URL**
   - **anon / publishable key**
6. In the SQL Editor, run `select value from private.app_config where key = 'form_secret';` and copy the result. This is your **form secret**: it lets the website save form submissions. Keep it private.

### Step 2: Lock down logins and create your admin account

1. **Authentication → Sign In / Providers** (or **Providers → Email**): turn **off** "Allow new users to sign up". Only people you add can log in.
2. **Authentication → Users → Add user → Create new user**: enter your email and a strong password, and tick **Auto confirm user**.
3. Back in the **SQL Editor**, run this with your email address:

   ```sql
   insert into public.admin_users (user_id)
   select id from auth.users where email = 'you@example.com'
   on conflict do nothing;
   ```

   Repeat steps 2–3 for anyone else who should be able to edit the site.

### Step 3: Set up email for form submissions (Resend)

1. Sign up at **resend.com**.
2. **Domains → Add domain**: add your website domain and copy the DNS records it gives you into your domain registrar. This proves you own the domain so emails don't land in spam.
   - Only *add* records. **Don't delete or change your existing MX records**, or your current email may stop working.
3. **API Keys → Create API key**. Copy it.
4. Your sender address will be something like `Website <inquiries@yourdomain.ca>`.

You'll choose which inbox *receives* the emails later, in **Admin → Business settings**.

### Step 4: Put the website online (Vercel)

1. Create a free account at **github.com** and make a new **private** repository. Upload this project's files to it (GitHub's **"uploading an existing file"** link lets you drag and drop the folder).
2. Sign up at **vercel.com** with your GitHub account and click **Add New → Project**, then import the repository.
3. Before clicking Deploy, open **Environment Variables** and add these (names must match exactly):

   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_SITE_URL` | Your website address, e.g. `https://www.yourdomain.ca` |
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon / publishable key |
   | `FORM_SECRET` | The form secret from Step 1 (mark it **Sensitive**) |
   | `RESEND_API_KEY` | Resend API key |
   | `EMAIL_FROM` | e.g. `Website <inquiries@yourdomain.ca>` |
   | `IP_HASH_SALT` | Any long random text (mash the keyboard for 40+ characters) |
   | `INQUIRY_EMAIL` | *(optional)* backup recipient for form emails |
   | `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | *(optional)* see Step 6 |
   | `TURNSTILE_SECRET_KEY` | *(optional)* see Step 6 |

4. Click **Deploy**. After a minute or two you'll get a link like `your-project.vercel.app`. Open it to check the site.

> **Plans:** Vercel's free Hobby plan is for personal, non-commercial projects. A business website should use a paid plan. Supabase's free plan can pause projects that see little activity and doesn't include automatic backups. Check both companies' current pricing pages before choosing.

### Step 5: Tell Supabase where the site lives

In Supabase → **Authentication → URL Configuration**:

- **Site URL:** `https://www.yourdomain.ca` (or your `vercel.app` address for now)
- **Redirect URLs:** add `https://www.yourdomain.ca/admin/auth/callback` and `https://your-project.vercel.app/admin/auth/callback`

This makes the **Forgot your password?** link work.

### Step 6 (optional): Extra spam protection

1. In a free Cloudflare account, open **Turnstile → Add widget**, and add your domain.
2. Copy the **Site key** into `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and the **Secret key** into `TURNSTILE_SECRET_KEY` in Vercel.
3. In Vercel, go to **Deployments → ⋯ → Redeploy** so the change takes effect.

### Step 7: Connect your domain

1. In Vercel: **Project → Settings → Domains → Add** your domain (e.g. `www.yourdomain.ca` and `yourdomain.ca`).
2. Vercel shows one or two DNS records. Add them at your domain registrar (or wherever your DNS is managed).
   - If another company currently hosts your website, coordinate the switch with them so there's no downtime.
   - Again, **leave your email (MX) records alone.**
3. Once it shows "Valid configuration", update `NEXT_PUBLIC_SITE_URL` in Vercel and redeploy.

### Step 8: Your first login

1. Visit `https://www.yourdomain.ca/admin` and sign in.
2. The **Overview** page shows a checklist. Start with **Business settings**: name, address, phone, booking link, and the email address that should receive form submissions.
3. Then upload photos, check your menu PDF, and publish your first events.

Bookmark `/admin`. There's deliberately no admin link on the public website.

---

## Using the dashboard

- **Saving** updates the live website immediately.
- **Announcement banner:** keep messages short so they fit on phones. Link to a page on the site (like `/events`) or to a full web address. Use *Start showing* / *Stop showing* to schedule promos ahead of time.
- **Weekly events** (karaoke, DJ nights): set the first date, tick *Repeats every week*, and optionally an end date. The site always shows the next date.
- **Feature on the homepage:** featured events show first in the homepage's "What's on" section, right under the top banner (above the golf simulators).
- **Photos:** upload straight from your phone or computer. Large photos are shrunk automatically. Add a short description to every gallery photo; it helps visitors using screen readers and helps Google.
- **Booking buttons:** every *Book a Simulator* button uses the booking link in Business settings. If it's empty, the buttons call your phone number.
- **Hours:** edit your regular week under *Weekly hours*. Add holidays under *Holiday & special hours*; they show automatically until the date passes.
- **Inquiries:** everything from the website forms is saved here, even if an email fails. Mark items as handled to keep track.

---

## For developers

```bash
npm install
cp .env.example .env.local   # fill in values
npm run dev                  # http://localhost:3000
npm run build                # production build
npm run typecheck
```

- Node 20 or newer.
- Public pages are statically rendered and revalidated every 5 minutes. Admin saves call `revalidatePath("/", "layout")`, so changes appear instantly.
- Every admin screen, form and server-side validator is generated from `lib/resources.ts`. Add a column in Supabase, then add the field there.
- Database access: the public site reads with the anon key under row-level security. Admin writes use the signed-in user's session, also checked by RLS (`public.is_admin()`). Form submissions are saved through the `submit_inquiry` database function, which only runs when the server sends `FORM_SECRET` and also enforces the rate limit. No Supabase service-role key is needed anywhere.
- Colours and fonts live in `app/globals.css` (`@theme`) and `app/layout.tsx`.
- Photos are stored in the public `media` bucket in Supabase Storage.

### Project layout

```
app/
  (site)/            public pages (home, pricing, events, private-events, menu, gallery, contact)
  admin/             login, dashboard, generic editor for every section, server actions
  actions/inquiry.ts form handling: validation, spam checks, save + email
components/site/     public UI (announcement bar, header, gallery viewer, forms…)
components/admin/    dashboard UI (resource editor, fields, image upload)
lib/                 data loading, formatting, events/hours logic, admin definitions, validation
supabase/            schema.sql (tables + security) and seed.sql (starting content)
```

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Site shows `[Business Name]` | Fill in Business settings in the dashboard. |
| Can't sign in | Check the user exists and is confirmed in Supabase → Authentication → Users, and that you ran the `admin_users` insert for that email. |
| "This account isn't set up as an admin" | Run the `admin_users` insert from Step 2 for that email. |
| Forms say "couldn't send your message" | Check `FORM_SECRET` in Vercel matches the value in `private.app_config`, then redeploy. |
| Forms say they sent but no email arrives | Check the inquiry email in Business settings, the Resend domain verification, and your spam folder. Submissions are always in Admin → Inquiries. |
| Photo upload fails | Make sure `schema.sql` ran fully (it creates the `media` bucket), and the file is a JPG, PNG or WebP under 10 MB. |
| Password reset link doesn't work | Add the `/admin/auth/callback` redirect URLs in Supabase (Step 5), and open the link in the same browser you requested it from. |
| Changes don't show | Hard-refresh the page. If it persists, check Vercel → Deployments → Logs. |
