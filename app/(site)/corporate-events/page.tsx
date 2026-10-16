import type { Metadata } from "next";
import Link from "next/link";
import { CheckIcon, MailIcon, PhoneIcon } from "@/components/icons";
import { InquiryForm } from "@/components/site/InquiryForm";
import { PackageCard } from "@/components/site/PackageCard";
import { PhotoCarousel } from "@/components/site/PhotoCarousel";
import { Reveal } from "@/components/site/Reveal";
import { PageHeader, SectionHeading } from "@/components/site/SectionHeading";
import { getGiftCards, getHomepagePhotos, getPackages, getSettings } from "@/lib/data";
import { real, telHref } from "@/lib/format";

export const metadata: Metadata = {
  title: "Corporate Events & Team Building in Orillia",
  description:
    "Holiday parties, team-building, client nights and staff appreciation at an Orillia golf simulator bar: TrackMan simulators, a full bar and food menu, and space for groups of any size.",
  alternates: { canonical: "/corporate-events" },
};

const OCCASIONS = [
  "Holiday & Christmas parties",
  "Team-building",
  "Client entertainment",
  "Staff appreciation",
  "Office golf tournaments",
  "Retirement & farewell parties",
];

const REASONS: { title: string; body: string }[] = [
  {
    title: "Fun for every skill level",
    body: "Simulator golf is easy to pick up, so first-timers and low handicappers can play side by side. Rental clubs for left-handed, right-handed, women's and junior golfers are on hand, so nobody needs to bring a thing.",
  },
  {
    title: "Friendly competition built in",
    body: "TrackMan games like closest-to-the-pin and longest drive turn a work outing into a team challenge, with no golf experience required.",
  },
  {
    title: "Food and drinks, sorted",
    body: "A full-service bar and food menu under the same roof, so there's no separate dinner reservation to plan.",
  },
  {
    title: "Space for any size team",
    body: "Book the private bay for a small group, three bays and the lounge for a bigger team, or the whole venue, about 5,000 sq ft, for the company party.",
  },
];

/** The packages that suit work groups (kids' parties are left out). */
function isCorporatePackage(name: string): boolean {
  return !/kid|birthday/i.test(name);
}

export default async function CorporateEventsPage() {
  const [settings, allPackages, photos, giftCards] = await Promise.all([
    getSettings(),
    getPackages(),
    getHomepagePhotos(),
    getGiftCards(),
  ]);
  const packages = allPackages.filter((p) => isCorporatePackage(p.name));
  const phone = real(settings.phone);
  const tel = telHref(settings.phone);
  const email = real(settings.public_email);
  const eventPhotos = photos.events_photos.length ? photos.events_photos : photos.bar_photos;

  return (
    <>
      <PageHeader
        eyebrow="Corporate events & team building"
        title="Team outings your crew will actually look forward to"
        intro="Holiday parties, team-building, client nights and staff appreciation. Golf simulators, a full bar and food menu, and room for the whole team, from a small group to the entire company."
      />

      <section aria-labelledby="occasions-title" className="py-16 sm:py-20">
        <div className="container-site">
          <h2 id="occasions-title" className="sr-only">
            Work events we host
          </h2>
          <ul className="flex flex-wrap gap-3">
            {OCCASIONS.map((o) => (
              <li key={o} className="border border-line bg-coal px-5 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-cream/90">
                {o}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="why-title" className="pb-20 sm:pb-28">
        <div className="container-site">
          <SectionHeading
            id="why-title"
            eyebrow="Why The Clubhouse"
            title="An easy yes for the whole office"
            intro="No dress code, no tee times, no weather to worry about. Just a good time your team will talk about on Monday."
          />
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {REASONS.map((r, i) => (
              <Reveal key={r.title} delay={i * 80}>
                <div className="card flex h-full gap-4 p-7 sm:p-8">
                  <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-forest text-gold-2" aria-hidden="true">
                    <CheckIcon width={16} height={16} strokeWidth={2.5} />
                  </span>
                  <div className="flex flex-col gap-2">
                    <h3 className="font-display text-2xl font-semibold text-cream">{r.title}</h3>
                    <p className="leading-relaxed text-mist">{r.body}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {eventPhotos.length > 0 && (
        <section aria-label="Photos of the venue" className="pb-20 sm:pb-28">
          <div className="container-site">
            <Reveal className="overflow-hidden rounded-[4px] border border-gold/30">
              <PhotoCarousel
                photos={eventPhotos}
                label="The Clubhouse venue"
                className="aspect-[4/3] sm:aspect-[21/9]"
                sizes="(min-width: 1280px) 1200px, 100vw"
              />
            </Reveal>
          </div>
        </section>
      )}

      {packages.length > 0 && (
        <section aria-labelledby="packages-title" className="border-t border-line py-20 sm:py-28">
          <div className="container-site">
            <SectionHeading
              id="packages-title"
              eyebrow="Packages"
              title="Pick the right fit for your group"
              intro="Every event is a little different. Tell us your headcount and date and we'll tailor the package and pricing."
            />
            <div className={`mt-14 grid gap-6 ${packages.length % 3 === 0 ? "lg:grid-cols-3" : "md:grid-cols-2"}`}>
              {packages.map((pkg, i) => (
                <Reveal key={pkg.id} delay={i * 90}>
                  <PackageCard
                    pkg={pkg}
                    cta={{ href: `/corporate-events?package=${encodeURIComponent(pkg.name)}#inquire`, label: "Get a quote" }}
                  />
                </Reveal>
              ))}
            </div>
            {real(settings.packages_note) && <p className="mt-8 text-sm text-mist">{settings.packages_note}</p>}
          </div>
        </section>
      )}

      <section aria-labelledby="holiday-title" className="border-t border-line py-16 sm:py-20">
        <div className="container-site grid gap-6 lg:grid-cols-2">
          <Reveal className="card flex flex-col gap-4 p-7 sm:p-10">
            <span className="eyebrow">Holiday party season</span>
            <h2 id="holiday-title" className="font-display text-3xl font-semibold text-cream sm:text-4xl">
              Book your date early
            </h2>
            <p className="leading-relaxed text-mist">
              November and December weekends go fast. Send us your preferred date now and we&apos;ll hold the details
              while you get the team on board.
            </p>
            <div>
              <a href="#inquire" className="btn btn-gold">
                Request a date
              </a>
            </div>
          </Reveal>
          {giftCards.enabled && (
            <Reveal delay={90} className="card flex flex-col gap-4 p-7 sm:p-10">
              <span className="eyebrow">Gifts for staff & clients</span>
              <h2 className="font-display text-3xl font-semibold text-cream sm:text-4xl">Gift cards they&apos;ll use</h2>
              <p className="leading-relaxed text-mist">
                A Clubhouse gift card makes an easy thank-you for staff, clients and teams. Buying several? Call or email
                us and we&apos;ll sort it out in one go.
              </p>
              <div>
                <Link href="/gift-cards" className="btn btn-outline">
                  Gift cards
                </Link>
              </div>
            </Reveal>
          )}
        </div>
      </section>

      <section id="inquire" aria-labelledby="inquire-title" className="scroll-mt-24 border-t border-line bg-coal py-20 sm:py-28">
        <div className="container-site grid gap-12 lg:grid-cols-[1fr_1.4fr] lg:gap-20">
          <div className="flex flex-col gap-8">
            <SectionHeading
              id="inquire-title"
              eyebrow="Get a quote"
              title="Tell us about your event"
              intro="Send a few details and we'll get back to you to confirm availability and pricing for your group."
            />
            <div className="flex flex-col gap-3 text-mist">
              {tel && phone && (
                <a href={tel} className="inline-flex items-center gap-3 text-lg transition hover:text-gold-2">
                  <PhoneIcon className="text-gold" />
                  {phone}
                </a>
              )}
              {email && (
                <a href={`mailto:${email}`} className="inline-flex items-center gap-3 break-all transition hover:text-gold-2">
                  <MailIcon className="text-gold" />
                  {email}
                </a>
              )}
            </div>
          </div>
          <div className="card p-6 sm:p-10">
            <InquiryForm
              kind="event"
              source="corporate"
              packages={packages.map((p) => p.name)}
              messagePlaceholder="Company name, the occasion, rough timing, food and drink needs, anything else we should know"
            />
          </div>
        </div>
      </section>
    </>
  );
}
