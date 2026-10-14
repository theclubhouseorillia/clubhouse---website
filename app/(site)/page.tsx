import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRightIcon, CheckIcon, MapPinIcon, PhoneIcon } from "@/components/icons";
import { EventCard } from "@/components/site/EventCard";
import { HoursList } from "@/components/site/HoursList";
import { OpenToday } from "@/components/site/OpenToday";
import { PackageCard } from "@/components/site/PackageCard";
import { PhotoSlot } from "@/components/site/PhotoSlot";
import { Reveal } from "@/components/site/Reveal";
import { SectionHeading } from "@/components/site/SectionHeading";
import { SmartImage } from "@/components/site/SmartImage";
import { SmartLink } from "@/components/site/SmartLink";
import {
  getBayTypes,
  getEvents,
  getGallery,
  getHours,
  getPackages,
  getSettings,
  getSpecialHours,
} from "@/lib/data";
import { homepageEvents } from "@/lib/events";
import { real, telHref } from "@/lib/format";
import { addressLines, bookingLink, directionsUrl } from "@/lib/site";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const [settings, bays, events, packages, hours, special, gallery] = await Promise.all([
    getSettings(),
    getBayTypes(),
    getEvents(),
    getPackages(),
    getHours(),
    getSpecialHours(),
    getGallery(),
  ]);

  const booking = bookingLink(settings);
  const headline = real(settings.hero_headline) ?? settings.business_name;
  const slogan = settings.show_slogan ? settings.slogan?.trim() || null : null;
  const upcoming = homepageEvents(events, 3);
  const barPhoto =
    gallery.find((g) => g.category === "Bar & lounge") ?? gallery.find((g) => g.category === "Food & drinks") ?? null;
  const simPhoto =
    gallery.find((g) => g.category === "Golf simulator bays") ?? gallery.find((g) => g.category === "Private simulator") ?? null;
  const phone = real(settings.phone);
  const tel = telHref(settings.phone);
  const directions = directionsUrl(settings);

  return (
    <>
      {/* HERO */}
      <section aria-labelledby="hero-title" className="relative isolate overflow-hidden border-b border-line">
        <div className="absolute inset-0 -z-10">
          {settings.hero_image_url ? (
            <>
              <SmartImage src={settings.hero_image_url} alt="" priority sizes="100vw" className="object-cover" />
              <div className="absolute inset-0 bg-ink/65" />
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-ink to-transparent" />
            </>
          ) : (
            <div className="dimples absolute inset-0 opacity-60" />
          )}
        </div>

        <div className="container-site flex min-h-[calc(100svh-7rem)] flex-col justify-center py-24 sm:py-32">
          <div className="flex max-w-4xl flex-col gap-7">
            {slogan && (
              <p className="inline-flex w-fit items-center gap-3 border border-gold/50 bg-ink/40 px-4 py-2 text-[0.7rem] font-bold uppercase tracking-[0.22em] text-gold-2 sm:text-xs">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gold" aria-hidden="true" />
                {slogan}
              </p>
            )}
            <h1
              id="hero-title"
              className="animate-fade-in font-display text-5xl font-semibold uppercase leading-[0.95] tracking-[0.02em] text-cream sm:text-7xl lg:text-8xl"
            >
              {headline}
            </h1>
            {settings.hero_subheadline && (
              <p className="max-w-2xl font-display text-2xl italic leading-snug text-cream/90 sm:text-3xl">
                {settings.hero_subheadline}
              </p>
            )}
            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:flex-wrap">
              <SmartLink href={booking.href} className="btn btn-gold">
                Book a Simulator
              </SmartLink>
              <Link href="/private-events" className="btn btn-outline">
                Plan a Private Event
              </Link>
              <Link href="/pricing" className="btn btn-outline">
                View Our Pricing
              </Link>
            </div>
            <div className="flex flex-wrap gap-x-8 gap-y-3 pt-4 text-sm text-mist">
              <OpenToday hours={hours} special={special} />
              {tel && phone && (
                <a href={tel} className="inline-flex items-center gap-2 transition hover:text-gold-2">
                  <PhoneIcon width={16} height={16} className="text-gold" />
                  {phone}
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* SIMULATORS */}
      <section aria-labelledby="sims-title" className="py-24 sm:py-32">
        <div className="container-site">
          <div className="grid items-end gap-10 lg:grid-cols-[1.1fr_1fr]">
            <Reveal>
              <SectionHeading
                id="sims-title"
                eyebrow="Golf simulators"
                title="Play the world's great courses, any season"
                intro="Four premium simulator bays, from social open bays beside the lounge to a fully private room. Rental clubs are available for left-handed, right-handed and women's golfers."
              />
            </Reveal>
            <Reveal delay={100} className="lg:justify-self-end">
              <Link href="/pricing" className="link-gold inline-flex items-center gap-2 text-sm uppercase tracking-[0.16em]">
                Simulator pricing <ArrowRightIcon width={16} height={16} />
              </Link>
            </Reveal>
          </div>

          <div className="mt-14 grid gap-5 lg:grid-cols-3">
            {bays.map((bay, i) => (
              <Reveal key={bay.id} delay={i * 90}>
                <article className="card flex h-full flex-col gap-5 p-7 sm:p-8">
                  <span className="font-display text-5xl font-semibold text-gold/40" aria-hidden="true">
                    0{i + 1}
                  </span>
                  <h3 className="font-display text-3xl font-semibold text-cream">{bay.name}</h3>
                  {bay.summary && <p className="leading-relaxed text-mist">{bay.summary}</p>}
                  {bay.details.length > 0 && (
                    <ul className="mt-auto flex flex-col gap-2.5 border-t border-line pt-5">
                      {bay.details.map((d) => (
                        <li key={d} className="flex gap-3 text-sm text-cream/90">
                          <CheckIcon width={16} height={16} className="mt-0.5 shrink-0 text-gold" />
                          {d}
                        </li>
                      ))}
                    </ul>
                  )}
                </article>
              </Reveal>
            ))}
          </div>

          <Reveal className="mt-5">
            <PhotoSlot
              src={simPhoto?.image_url}
              alt={simPhoto?.alt_text ?? ""}
              label="Golf simulator bays"
              className="aspect-[16/9] rounded-[4px] border border-line sm:aspect-[21/8]"
              imageClassName="object-cover"
              sizes="(min-width: 1280px) 1200px, 100vw"
            />
          </Reveal>
        </div>
      </section>

      {/* SPORTS BAR */}
      <section aria-labelledby="bar-title" className="border-y border-line bg-coal py-24 sm:py-32">
        <div className="container-site grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <Reveal className="order-2 lg:order-1">
            <PhotoSlot
              src={barPhoto?.image_url}
              alt={barPhoto?.alt_text ?? ""}
              label="Bar & lounge"
              className="aspect-[4/5] rounded-[4px] border border-line"
              imageClassName="object-cover"
              sizes="(min-width: 1024px) 50vw, 100vw"
            />
          </Reveal>
          <Reveal delay={100} className="order-1 flex flex-col gap-8 lg:order-2">
            <SectionHeading
              id="bar-title"
              eyebrow="Sports bar & lounge"
              title={settings.bar_heading || "A sports bar worth staying for"}
              intro={settings.bar_text}
            />
            {settings.highlights.length > 0 && (
              <ul className="grid gap-3 sm:grid-cols-2">
                {settings.highlights.map((h) => (
                  <li key={h} className="flex gap-3 text-cream/90">
                    <CheckIcon width={18} height={18} className="mt-0.5 shrink-0 text-gold" />
                    {h}
                  </li>
                ))}
              </ul>
            )}
            <div className="flex flex-wrap gap-3">
              <Link href="/menu" className="btn btn-outline">
                Food &amp; Drink
              </Link>
              <Link href="/gallery" className="btn btn-outline">
                See the space
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* PRIVATE EVENTS */}
      <section aria-labelledby="events-pkg-title" className="relative overflow-hidden bg-forest py-24 sm:py-32">
        <div className="dimples pointer-events-none absolute inset-0 opacity-25" aria-hidden="true" />
        <div className="container-site relative">
          <Reveal>
            <SectionHeading
              id="events-pkg-title"
              eyebrow="Private events"
              title="Parties, holiday gatherings & corporate events"
              intro="Birthdays, Christmas parties, team-building and celebrations. Book a private bay or take over the whole venue."
            />
          </Reveal>
          <div className="mt-14 grid gap-6 lg:grid-cols-3">
            {packages.map((pkg, i) => (
              <Reveal key={pkg.id} delay={i * 90}>
                <PackageCard
                  pkg={pkg}
                  maxFeatures={4}
                  cta={{ href: `/private-events?package=${encodeURIComponent(pkg.name)}#inquire`, label: "Inquire" }}
                />
              </Reveal>
            ))}
          </div>
          <Reveal className="mt-10">
            <Link href="/private-events" className="btn btn-gold">
              Plan a Private Event
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ENTERTAINMENT */}
      <section aria-labelledby="ent-title" className="py-24 sm:py-32">
        <div className="container-site">
          <div className="grid items-end gap-8 lg:grid-cols-[1.2fr_1fr]">
            <Reveal>
              <SectionHeading
                id="ent-title"
                eyebrow="What's on"
                title="Karaoke, live DJs & live music"
                intro="Big games on the big screens, weekly entertainment and special events all year."
              />
            </Reveal>
            <Reveal delay={100} className="lg:justify-self-end">
              <Link href="/events" className="link-gold inline-flex items-center gap-2 text-sm uppercase tracking-[0.16em]">
                All events <ArrowRightIcon width={16} height={16} />
              </Link>
            </Reveal>
          </div>
          {upcoming.length > 0 ? (
            <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {upcoming.map((event, i) => (
                <Reveal key={event.id} delay={i * 90}>
                  <EventCard event={event} compact />
                </Reveal>
              ))}
            </div>
          ) : (
            <Reveal className="mt-14">
              <p className="card p-8 text-mist">
                New events are posted here regularly. Check back soon, or follow us on social media for announcements.
              </p>
            </Reveal>
          )}
        </div>
      </section>

      {/* VISIT */}
      <section aria-labelledby="visit-title" className="border-t border-line bg-coal py-24 sm:py-28">
        <div className="container-site grid gap-12 lg:grid-cols-2 lg:gap-20">
          <Reveal className="flex flex-col gap-8">
            <SectionHeading id="visit-title" eyebrow="Visit us" title="Come in for a round" />
            <address className="flex flex-col gap-4 not-italic text-lg text-mist">
              <span className="flex gap-3">
                <MapPinIcon className="mt-1 shrink-0 text-gold" />
                <span>
                  <span className="block text-cream">{settings.business_name}</span>
                  {addressLines(settings).map((l) => (
                    <span key={l} className="block">
                      {l}
                    </span>
                  ))}
                </span>
              </span>
              {tel && phone && (
                <a href={tel} className="flex items-center gap-3 transition hover:text-gold-2">
                  <PhoneIcon className="shrink-0 text-gold" />
                  {phone}
                </a>
              )}
            </address>
            <div className="flex flex-wrap gap-3">
              <SmartLink href={booking.href} className="btn btn-gold">
                Book a Simulator
              </SmartLink>
              {directions && (
                <a href={directions} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
                  Get directions
                </a>
              )}
            </div>
          </Reveal>
          <Reveal delay={100}>
            <h3 className="eyebrow mb-4">{real(settings.hours_season_label) ?? "Hours"}</h3>
            <HoursList hours={hours} special={special} />
          </Reveal>
        </div>
      </section>
    </>
  );
}
