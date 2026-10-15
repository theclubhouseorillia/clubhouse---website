import type { Metadata } from "next";
import Link from "next/link";
import { MailIcon, PhoneIcon } from "@/components/icons";
import { Gallery } from "@/components/site/Gallery";
import { InquiryForm } from "@/components/site/InquiryForm";
import { PackageCard } from "@/components/site/PackageCard";
import { Reveal } from "@/components/site/Reveal";
import { PageHeader, SectionHeading } from "@/components/site/SectionHeading";
import { getGallery, getPackages, getSettings } from "@/lib/data";
import { real, telHref } from "@/lib/format";

export const metadata: Metadata = {
  title: "Private Events & Corporate Parties",
  description:
    "Host birthday parties, Christmas parties, corporate functions and team-building events with golf simulators, a full bar and lounge.",
  alternates: { canonical: "/private-events" },
};

const OCCASIONS = [
  "Birthday parties",
  "Christmas & holiday parties",
  "Corporate functions",
  "Team-building",
  "Celebrations",
];

export default async function PrivateEventsPage() {
  const [settings, packages, gallery] = await Promise.all([getSettings(), getPackages(), getGallery()]);
  const partyPhotos = gallery.filter((g) => g.category === "Private parties").slice(0, 9);
  const phone = real(settings.phone);
  const tel = telHref(settings.phone);
  const email = real(settings.public_email);

  return (
    <>
      <PageHeader
        eyebrow="Private events"
        title="Host your next event with us"
        intro="Golf, drinks, food and room for the whole group. Tell us about your event and we'll put together the right package."
      />

      <section aria-labelledby="occasions-title" className="py-16 sm:py-20">
        <div className="container-site">
          <h2 id="occasions-title" className="sr-only">
            Occasions we host
          </h2>
          <ul className="flex flex-wrap gap-3">
            {OCCASIONS.map((o) => (
              <li key={o} className="border border-line bg-coal px-5 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-cream/90">
                {o}
              </li>
            ))}
          </ul>
          <p className="mt-6 text-mist">
            Planning a party for the kids?{" "}
            <Link href="/kids-parties" className="link-gold">
              See our kids&apos; birthday parties
            </Link>
          </p>
        </div>
      </section>

      <section aria-labelledby="packages-title" className="pb-20 sm:pb-28">
        <div className="container-site">
          <SectionHeading id="packages-title" eyebrow="Packages" title="Choose your experience" />
          <div className="mt-14 grid gap-6 lg:grid-cols-3">
            {packages.map((pkg, i) => (
              <Reveal key={pkg.id} delay={i * 90}>
                <PackageCard
                  pkg={pkg}
                  cta={{ href: `/private-events?package=${encodeURIComponent(pkg.name)}#inquire`, label: "Inquire about this package" }}
                />
              </Reveal>
            ))}
          </div>
          {real(settings.packages_note) && <p className="mt-8 text-sm text-mist">{settings.packages_note}</p>}
        </div>
      </section>

      {partyPhotos.length > 0 && (
        <section aria-labelledby="past-parties-title" className="border-t border-line py-20 sm:py-24">
          <div className="container-site">
            <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
              <SectionHeading
                id="past-parties-title"
                eyebrow="Past events"
                title="Parties we've hosted"
                intro="Birthdays, holiday parties and corporate nights at the venue."
              />
              <Link href="/gallery" className="link-gold text-sm uppercase tracking-[0.16em]">
                See all photos
              </Link>
            </div>
            <Gallery images={partyPhotos} categories={["Private parties"]} />
          </div>
        </section>
      )}

      <section id="inquire" aria-labelledby="inquire-title" className="scroll-mt-24 border-t border-line bg-coal py-20 sm:py-28">
        <div className="container-site grid gap-12 lg:grid-cols-[1fr_1.4fr] lg:gap-20">
          <div className="flex flex-col gap-8">
            <SectionHeading
              id="inquire-title"
              eyebrow="Event inquiry"
              title="Let's plan it"
              intro="Send us a few details and we'll be in touch to confirm availability and pricing."
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
            <InquiryForm kind="event" packages={packages.map((p) => p.name)} />
          </div>
        </div>
      </section>
    </>
  );
}
