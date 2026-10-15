import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRightIcon, CalendarIcon, CheckIcon, ExternalIcon, MailIcon, MapPinIcon, PhoneIcon } from "@/components/icons";
import { PhotoCarousel } from "@/components/site/PhotoCarousel";
import { BayPriceRange } from "@/components/site/BayPriceRange";
import { EventCard } from "@/components/site/EventCard";
import { HeroBackground } from "@/components/site/HeroBackground";
import { HoursList } from "@/components/site/HoursList";
import { OpenToday } from "@/components/site/OpenToday";
import { PackageCard } from "@/components/site/PackageCard";
import { PhotoSlot } from "@/components/site/PhotoSlot";
import { PoolTableFeature } from "@/components/site/PoolTableFeature";
import { Reveal } from "@/components/site/Reveal";
import { SectionHeading } from "@/components/site/SectionHeading";
import { SmartLink } from "@/components/site/SmartLink";
import { Stars } from "@/components/site/Stars";
import {
  getBayTypes,
  getEvents,
  getGallery,
  getHomepagePhotos,
  getHours,
  getLeagueSettings,
  getOwners,
  getOwnersSection,
  getPackages,
  getPoolTable,
  getRates,
  getReviews,
  getReviewsSection,
  getSettings,
  getSpecialHours,
} from "@/lib/data";
import { homepageEvents } from "@/lib/events";
import { formatMonthYear, real, telHref } from "@/lib/format";
import { addressLines, bookingLink, directionsUrl, leagueEmailHref } from "@/lib/site";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const [
    settings,
    bays,
    events,
    packages,
    hours,
    special,
    gallery,
    league,
    photos,
    pool,
    rates,
    ownersSection,
    owners,
    reviewsSection,
    reviews,
  ] = await Promise.all([
    getSettings(),
    getBayTypes(),
    getEvents(),
    getPackages(),
    getHours(),
    getSpecialHours(),
    getGallery(),
    getLeagueSettings(),
    getHomepagePhotos(),
    getPoolTable(),
    getRates(),
    getOwnersSection(),
    getOwners(),
    getReviewsSection(),
    getReviews(),
  ]);

  const booking = bookingLink(settings);
  const headline = real(settings.hero_headline) ?? settings.business_name;
  const slogan = settings.show_slogan ? settings.slogan?.trim() || null : null;
  const upcoming = homepageEvents(events, 3);
  const heroPhotos = photos.hero_photos.length
    ? photos.hero_photos
    : settings.hero_image_url
      ? [settings.hero_image_url]
      : [];
  const galleryBarPhoto =
    gallery.find((g) => g.category === "Bar & lounge") ?? gallery.find((g) => g.category === "Food & drinks") ?? null;
  const barPhotos = photos.bar_photos.length ? photos.bar_photos : galleryBarPhoto ? [galleryBarPhoto.image_url] : [];
  const poolPhotos = pool.photos.length
    ? pool.photos
    : gallery.filter((g) => g.category === "Pool table").map((g) => g.image_url);
  const phone = real(settings.phone);
  const tel = telHref(settings.phone);
  const directions = directionsUrl(settings);
  const leagueHref = leagueEmailHref(league.email, league.email_subject);
  const showReviews = reviewsSection.enabled && (reviews.length > 0 || reviewsSection.rating !== null);
  const ownersIntro = real(ownersSection.intro);
  const ownersHaveBios = owners.some((o) => real(o.bio));
  const ownerNames = owners.map((o) => o.name);
  const ownersPhotoAlt = ownerNames.length
    ? ownerNames.length > 1
      ? `${ownerNames.slice(0, -1).join(", ")} and ${ownerNames[ownerNames.length - 1]}`
      : ownerNames[0]
    : `The owners of ${settings.business_name}`;

  return (
    <>
      {/* HERO */}
      <section aria-labelledby="hero-title" className="relative isolate overflow-hidden border-b border-line">
        <div className="absolute inset-0 -z-10">
          <HeroBackground photos={heroPhotos} />
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
              {league.enabled && (
                <Link href="/league" className="btn btn-outline">
                  Join the Winter League
                </Link>
              )}
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
                <article className="card group flex h-full flex-col overflow-hidden">
                  <div className="relative border-b border-line">
                    <PhotoCarousel photos={bay.photos} label={`${bay.name} golf simulator`} />
                    <span
                      className="pointer-events-none absolute left-4 top-4 bg-ink/80 px-2.5 py-1 font-display text-2xl font-semibold leading-none text-gold"
                      aria-hidden="true"
                    >
                      0{i + 1}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col gap-4 p-7 sm:p-8">
                    <div className="flex flex-col gap-2">
                      <h3 className="font-display text-3xl font-semibold text-cream">{bay.name}</h3>
                      <BayPriceRange bay={bay} rates={rates} />
                    </div>
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
                    <Link href="/pricing" className="link-gold mt-2 inline-flex items-center gap-2 text-sm uppercase tracking-[0.14em]">
                      See pricing <ArrowRightIcon width={14} height={14} />
                    </Link>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>

        </div>
      </section>

      {/* POOL TABLE */}
      {pool.enabled && (
        <section aria-labelledby="pool-title" className="border-t border-line py-24 sm:py-28">
          <div className="container-site">
            <PoolTableFeature pool={pool} photos={poolPhotos} booking={booking} />
          </div>
        </section>
      )}

      {/* SPORTS BAR */}
      <section aria-labelledby="bar-title" className="border-y border-line bg-coal py-24 sm:py-32">
        <div className="container-site grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <Reveal className="order-2 lg:order-1">
            <div className="overflow-hidden rounded-[4px] border border-line">
              <PhotoCarousel
                photos={barPhotos}
                label="Bar & lounge"
                className="aspect-[4/5]"
                sizes="(min-width: 1024px) 50vw, 100vw"
              />
            </div>
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
          {photos.events_photos.length > 0 && (
            <Reveal className="mt-12 overflow-hidden rounded-[4px] border border-gold/30">
              <PhotoCarousel
                photos={photos.events_photos}
                label="Private events"
                className="aspect-[4/3] sm:aspect-[21/9]"
                sizes="(min-width: 1280px) 1200px, 100vw"
              />
            </Reveal>
          )}
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

      {/* WINTER LEAGUE */}
      {league.enabled && (
        <section aria-labelledby="league-title" className="border-b border-line py-20 sm:py-24">
          <div className="container-site">
            <Reveal className="grid items-center gap-10 lg:grid-cols-[1.3fr_1fr]">
              <div className="flex flex-col gap-5">
                <SectionHeading id="league-title" eyebrow="Leagues" title={league.title} intro={league.intro} />
                {real(league.season) && (
                  <p className="flex items-center gap-2 text-cream/90">
                    <CalendarIcon width={18} height={18} className="text-gold" />
                    {league.season}
                    {real(league.schedule) ? ` · ${league.schedule}` : ""}
                  </p>
                )}
                {photos.league_photos.length > 0 && (
                  <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                    <Link href="/league" className="btn btn-gold">
                      League details &amp; pricing
                    </Link>
                    <SmartLink href={leagueHref} className="btn btn-outline">
                      <MailIcon width={16} height={16} />
                      {leagueHref.startsWith("mailto:") ? "Email us to join" : "Contact us to join"}
                    </SmartLink>
                  </div>
                )}
              </div>
              {photos.league_photos.length > 0 ? (
                <div className="overflow-hidden rounded-[4px] border border-line">
                  <PhotoCarousel photos={photos.league_photos} label={league.title} sizes="(min-width: 1024px) 40vw, 100vw" />
                </div>
              ) : (
              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col lg:items-end">
                <Link href="/league" className="btn btn-gold">
                  League details &amp; pricing
                </Link>
                <SmartLink href={leagueHref} className="btn btn-outline">
                  <MailIcon width={16} height={16} />
                  {leagueHref.startsWith("mailto:") ? "Email us to join" : "Contact us to join"}
                </SmartLink>
              </div>
              )}
            </Reveal>
          </div>
        </section>
      )}

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

      {/* GOOGLE REVIEWS */}
      {showReviews && (
        <section aria-labelledby="reviews-title" className="border-t border-line py-24 sm:py-28">
          <div className="container-site">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <Reveal>
                <SectionHeading id="reviews-title" eyebrow="Google reviews" title={reviewsSection.heading} />
              </Reveal>
              {reviewsSection.rating !== null && (
                <Reveal delay={100} className="flex items-center gap-5">
                  <span className="font-display text-6xl leading-none text-cream">{reviewsSection.rating.toFixed(1)}</span>
                  <span className="flex flex-col gap-2">
                    <Stars rating={reviewsSection.rating} size={22} />
                    <span className="text-sm text-mist">
                      {reviewsSection.review_count
                        ? `from ${reviewsSection.review_count.toLocaleString("en-CA")} Google review${reviewsSection.review_count === 1 ? "" : "s"}`
                        : "on Google"}
                    </span>
                  </span>
                </Reveal>
              )}
            </div>

            {reviews.length > 0 && (
              <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {reviews.map((review, i) => (
                  <Reveal key={review.id} delay={(i % 3) * 90} className="card h-full">
                    <figure className="flex h-full flex-col gap-5 p-7">
                      <Stars rating={review.rating} />
                      <blockquote className="flex-1 leading-relaxed whitespace-pre-line text-cream/90">
                        <p>&ldquo;{review.quote}&rdquo;</p>
                      </blockquote>
                      <figcaption className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-t border-line pt-4">
                        <span className="font-semibold text-cream">{review.author}</span>
                        <span className="text-xs uppercase tracking-[0.14em] text-mist">
                          Google review{review.review_date ? ` · ${formatMonthYear(review.review_date)}` : ""}
                        </span>
                      </figcaption>
                    </figure>
                  </Reveal>
                ))}
              </div>
            )}

            {(reviewsSection.write_review_url || reviewsSection.google_url) && (
              <div className="mt-10 flex flex-wrap gap-3">
                {reviewsSection.write_review_url && (
                  <a href={reviewsSection.write_review_url} target="_blank" rel="noopener noreferrer" className="btn btn-gold">
                    Leave us a review
                  </a>
                )}
                {reviewsSection.google_url && (
                  <a href={reviewsSection.google_url} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
                    Read all reviews on Google
                    <ExternalIcon width={16} height={16} />
                  </a>
                )}
              </div>
            )}
          </div>
        </section>
      )}

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
        {photos.visit_photos.length > 0 && (
          <div className="container-site mt-14">
            <Reveal className="overflow-hidden rounded-[4px] border border-line">
              <PhotoCarousel
                photos={photos.visit_photos}
                label="The venue"
                className="aspect-[4/3] sm:aspect-[21/8]"
                sizes="(min-width: 1280px) 1200px, 100vw"
              />
            </Reveal>
          </div>
        )}
      </section>

      {/* MEET THE OWNERS (the "Meet the Owners" button in the top menu jumps here) */}
      {ownersSection.enabled && (
        <section id="owners" aria-labelledby="owners-title" className="scroll-mt-28 border-t border-line py-24 sm:py-28">
          <div className="container-site grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <Reveal className="flex flex-col gap-10">
              <SectionHeading
                id="owners-title"
                eyebrow="Our story"
                title={ownersSection.heading}
                intro={ownersIntro ?? undefined}
              />
              {owners.length > 0 && (
                <ul
                  className={
                    ownersHaveBios
                      ? "flex flex-col divide-y divide-line border-y border-line"
                      : "grid gap-x-6 gap-y-5 border-t border-line pt-6 sm:grid-cols-3"
                  }
                >
                  {owners.map((owner) => {
                    const role = real(owner.role);
                    const bio = real(owner.bio);
                    return (
                      <li key={owner.id} className={ownersHaveBios ? "py-5" : ""}>
                        <p className="font-display text-xl text-cream">{owner.name}</p>
                        {role && (
                          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-gold">{role}</p>
                        )}
                        {bio && <p className="mt-3 leading-relaxed whitespace-pre-line text-mist">{bio}</p>}
                      </li>
                    );
                  })}
                </ul>
              )}
              <a
                href="#top"
                className="inline-flex items-center gap-2 self-start text-sm font-semibold uppercase tracking-[0.14em] text-mist transition hover:text-gold-2"
              >
                <ArrowRightIcon className="-rotate-90" width={16} height={16} />
                Back to top
              </a>
            </Reveal>
            <Reveal delay={100} className="overflow-hidden rounded-[4px] border border-line">
              <PhotoSlot
                src={ownersSection.photo_url}
                alt={ownersPhotoAlt}
                label="The owners"
                className="aspect-[4/3] bg-coal"
                sizes="(min-width: 1280px) 600px, (min-width: 1024px) 50vw, 100vw"
              />
            </Reveal>
          </div>
        </section>
      )}
    </>
  );
}
