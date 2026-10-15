import type { Metadata } from "next";
import Link from "next/link";
import { CheckIcon } from "@/components/icons";
import { BayPriceRange } from "@/components/site/BayPriceRange";
import { PhotoCarousel } from "@/components/site/PhotoCarousel";
import { PoolTableFeature } from "@/components/site/PoolTableFeature";
import { PricingTable } from "@/components/site/PricingTable";
import { Reveal } from "@/components/site/Reveal";
import { PageHeader, SectionHeading } from "@/components/site/SectionHeading";
import { SmartLink } from "@/components/site/SmartLink";
import { getBayTypes, getGallery, getPoolTable, getRates, getSettings } from "@/lib/data";
import { real } from "@/lib/format";
import { bookingLink } from "@/lib/site";

export const metadata: Metadata = {
  title: "Golf Simulator Pricing",
  description: "Hourly rates for our open, semi-private and private golf simulator bays. Book online.",
  alternates: { canonical: "/pricing" },
};

export default async function PricingPage() {
  const [settings, rates, bays, pool, gallery] = await Promise.all([
    getSettings(),
    getRates(),
    getBayTypes(),
    getPoolTable(),
    getGallery(),
  ]);
  const poolPhotos = pool.photos.length
    ? pool.photos
    : gallery.filter((g) => g.category === "Pool table").map((g) => g.image_url);
  const booking = bookingLink(settings);
  const season = real(settings.pricing_season_label) ?? "Simulator pricing";

  return (
    <>
      <PageHeader
        eyebrow="Simulators & pricing"
        title="Book a bay"
        intro="Choose an open bay by the lounge, a more secluded semi-private bay, or the fully private room."
      />

      <section aria-labelledby="rates-title" className="py-20 sm:py-28">
        <div className="container-site">
          <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <SectionHeading id="rates-title" eyebrow="Hourly rates" title={season} />
            <SmartLink href={booking.href} className="btn btn-gold">
              Book a Simulator
            </SmartLink>
          </div>
          <Reveal>
            <PricingTable rates={rates} caption={season} />
          </Reveal>
          {real(settings.pricing_note) && <p className="mt-5 text-sm text-mist">{settings.pricing_note}</p>}
        </div>
      </section>

      <section aria-labelledby="bays-title" className="border-t border-line bg-coal py-20 sm:py-28">
        <div className="container-site">
          <SectionHeading id="bays-title" eyebrow="Our bays" title="Which bay is right for you?" />
          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {bays.map((bay, i) => (
              <Reveal key={bay.id} delay={i * 90}>
                <article className="flex h-full flex-col overflow-hidden border-t-2 border-gold bg-ink">
                  <PhotoCarousel photos={bay.photos} label={`${bay.name} golf simulator`} />
                  <div className="flex flex-1 flex-col gap-4 p-7 sm:p-8">
                  <h3 className="font-display text-3xl font-semibold text-cream">{bay.name}</h3>
                  <BayPriceRange bay={bay} rates={rates} />
                  {bay.summary && <p className="leading-relaxed text-mist">{bay.summary}</p>}
                  {bay.details.length > 0 && (
                    <ul className="flex flex-col gap-2.5 pt-2">
                      {bay.details.map((d) => (
                        <li key={d} className="flex gap-3 text-sm text-cream/90">
                          <CheckIcon width={16} height={16} className="mt-0.5 shrink-0 text-gold" />
                          {d}
                        </li>
                      ))}
                    </ul>
                  )}
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {pool.enabled && (
        <section aria-labelledby="pricing-pool-title" className="py-20 sm:py-28">
          <div className="container-site">
            <PoolTableFeature pool={pool} photos={poolPhotos} booking={booking} id="pricing-pool-title" />
          </div>
        </section>
      )}

      <section className="py-20 sm:py-24">
        <div className="container-site">
        <div className="flex flex-col items-start justify-between gap-8 border border-gold/40 bg-forest p-8 sm:p-12 lg:flex-row lg:items-center">
          <div className="flex flex-col gap-3">
            <h2 className="font-display text-4xl font-semibold text-cream">Hosting a group?</h2>
            <p className="max-w-xl text-cream/85">
              Private event packages include multiple bays, the lounge, the pool table and more.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <SmartLink href={booking.href} className="btn btn-gold">
              Book a Simulator
            </SmartLink>
            <Link href="/private-events" className="btn btn-outline">
              Private events
            </Link>
          </div>
        </div>
        </div>
      </section>
    </>
  );
}
