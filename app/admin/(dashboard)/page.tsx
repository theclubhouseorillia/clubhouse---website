import Link from "next/link";
import { CheckIcon } from "@/components/icons";
import { requireAdmin } from "@/lib/auth";
import { emailConfigured } from "@/lib/email";
import { isPlaceholder, todayISO } from "@/lib/format";
import { turnstileEnabled } from "@/lib/spam";

export const dynamic = "force-dynamic";

type Check = { done: boolean; label: string; href: string; hint: string };

export default async function AdminOverview() {
  const { supabase } = await requireAdmin();
  const today = todayISO();

  const [settingsRes, announcementsRes, eventsRes, newInquiriesRes, recentRes, galleryRes, placeholderMenuRes] =
    await Promise.all([
      supabase.from("site_settings").select("*").eq("id", 1).maybeSingle(),
      supabase.from("announcements").select("id", { count: "exact", head: true }).eq("enabled", true),
      supabase
        .from("events")
        .select("id", { count: "exact", head: true })
        .eq("published", true)
        .or(`event_date.gte.${today},repeats_weekly.eq.true`),
      supabase.from("inquiries").select("id", { count: "exact", head: true }).eq("handled", false),
      supabase.from("inquiries").select("id, kind, name, created_at, handled").order("created_at", { ascending: false }).limit(5),
      supabase.from("gallery_images").select("id", { count: "exact", head: true }),
      supabase.from("menu_items").select("id", { count: "exact", head: true }).like("name", "[%"),
    ]);

  const s = (settingsRes.data ?? {}) as Record<string, unknown>;
  const text = (key: string) => (typeof s[key] === "string" ? (s[key] as string) : null);

  const checks: Check[] = [
    {
      done: !isPlaceholder(text("business_name")) && !isPlaceholder(text("street_address")) && !isPlaceholder(text("phone")),
      label: "Add your business name, address and phone number",
      href: "/admin/settings",
      hint: "Business settings",
    },
    {
      done: !isPlaceholder(text("hero_subheadline")) && !isPlaceholder(text("slogan")),
      label: "Write your homepage headline and slogan",
      href: "/admin/settings",
      hint: "Business settings",
    },
    { done: !!text("booking_url"), label: "Add your online booking link", href: "/admin/settings", hint: "Business settings" },
    {
      done: !!text("inquiry_email"),
      label: "Choose where form submissions are emailed",
      href: "/admin/settings",
      hint: "Business settings",
    },
    { done: !!text("hero_image_url"), label: "Upload a homepage hero photo", href: "/admin/settings", hint: "Business settings" },
    { done: (galleryRes.count ?? 0) > 0, label: "Upload photos to the gallery", href: "/admin/gallery", hint: "Photo gallery" },
    {
      done: (placeholderMenuRes.count ?? 0) === 0,
      label: "Replace the placeholder menu items with your real menu",
      href: "/admin/menu-items",
      hint: "Menu items",
    },
    { done: (eventsRes.count ?? 0) > 0, label: "Publish your first event", href: "/admin/events", hint: "Events" },
  ];
  const remaining = checks.filter((c) => !c.done).length;

  const stats = [
    { label: "New inquiries", value: newInquiriesRes.count ?? 0, href: "/admin/inquiries" },
    { label: "Upcoming & weekly events", value: eventsRes.count ?? 0, href: "/admin/events" },
    { label: "Announcements on", value: announcementsRes.count ?? 0, href: "/admin/announcements" },
    { label: "Gallery photos", value: galleryRes.count ?? 0, href: "/admin/gallery" },
  ];

  const recent = (recentRes.data ?? []) as { id: string; kind: string; name: string; created_at: string; handled: boolean }[];

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-2 border-b border-line pb-6">
        <h1 className="font-display text-4xl font-semibold text-cream">Overview</h1>
        <p className="text-mist">Changes you save appear on the website right away.</p>
      </header>

      {settingsRes.error && (
        <p role="alert" className="rounded-[3px] border border-danger/60 bg-danger/10 px-4 py-3 text-sm text-danger">
          The database isn&apos;t set up yet ({settingsRes.error.message}). Run supabase/schema.sql and seed.sql (see README).
        </p>
      )}

      <section aria-labelledby="stats-title">
        <h2 id="stats-title" className="sr-only">
          At a glance
        </h2>
        <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map((st) => (
            <li key={st.label}>
              <Link href={st.href} className="card flex h-full flex-col gap-1 p-5 transition hover:border-gold/60">
                <span className="font-display text-4xl font-semibold text-gold">{st.value}</span>
                <span className="text-sm text-mist">{st.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {remaining > 0 && (
        <section aria-labelledby="setup-title" className="card p-6 sm:p-8">
          <h2 id="setup-title" className="font-display text-3xl font-semibold text-cream">
            Finish setting up
          </h2>
          <p className="mt-1 text-sm text-mist">
            {remaining} of {checks.length} steps left. Placeholders in [square brackets] show on the site until you replace them.
          </p>
          <ul className="mt-6 flex flex-col divide-y divide-line">
            {checks.map((c) => (
              <li key={c.label} className="flex items-center gap-4 py-3">
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                    c.done ? "border-gold bg-gold text-ink" : "border-line"
                  }`}
                  aria-hidden="true"
                >
                  {c.done && <CheckIcon width={14} height={14} strokeWidth={2.5} />}
                </span>
                <span className={`flex-1 ${c.done ? "text-mist line-through" : "text-cream"}`}>
                  {c.label}
                  <span className="sr-only">{c.done ? " (done)" : " (to do)"}</span>
                </span>
                {!c.done && (
                  <Link href={c.href} className="link-gold shrink-0 text-sm">
                    {c.hint}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {(!emailConfigured() || !turnstileEnabled()) && (
        <section className="card p-6 text-sm text-mist">
          <h2 className="mb-2 font-semibold text-cream">Technical setup notes</h2>
          <ul className="list-disc space-y-1 pl-5">
            {!emailConfigured() && (
              <li>
                Email sending isn&apos;t configured on the server yet, so form submissions are only saved here under
                Inquiries. Add RESEND_API_KEY and EMAIL_FROM in Vercel (see README).
              </li>
            )}
            {!turnstileEnabled() && (
              <li>Optional: add Cloudflare Turnstile keys for extra spam protection on your forms.</li>
            )}
          </ul>
        </section>
      )}

      <section aria-labelledby="recent-title">
        <div className="mb-4 flex items-end justify-between">
          <h2 id="recent-title" className="font-display text-3xl font-semibold text-cream">
            Latest inquiries
          </h2>
          <Link href="/admin/inquiries" className="link-gold text-sm">
            View all
          </Link>
        </div>
        {recent.length ? (
          <ul className="card divide-y divide-line">
            {recent.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-4">
                <span className="text-cream">
                  {r.name}{" "}
                  <span className="text-sm text-mist">· {r.kind === "event" ? "Private event" : "Contact"}</span>
                </span>
                <span className="text-sm text-mist">
                  {new Date(r.created_at).toLocaleString("en-CA", {
                    timeZone: "America/Toronto",
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                  {!r.handled && <span className="ml-3 font-semibold text-gold-2">New</span>}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="card p-6 text-mist">No inquiries yet.</p>
        )}
      </section>
    </div>
  );
}
