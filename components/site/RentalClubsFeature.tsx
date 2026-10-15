import { CheckIcon } from "@/components/icons";
import { hasPlaceholderText, real } from "@/lib/format";
import type { LinkTarget } from "@/lib/site";
import type { RentalClubs } from "@/lib/types";
import { PhotoCarousel } from "./PhotoCarousel";
import { Reveal } from "./Reveal";
import { SectionHeading } from "./SectionHeading";
import { SmartLink } from "./SmartLink";

/** Rental clubs showcase: text on the left, photos on the right (the pool table below mirrors it). */
export function RentalClubsFeature({ clubs, booking }: { clubs: RentalClubs; booking: LinkTarget }) {
  const price = clubs.price_label && !hasPlaceholderText(clubs.price_label) ? clubs.price_label.trim() : null;
  const priceNote = real(clubs.price_note);
  const isAmount = price ? /\d/.test(price) : false;

  return (
    <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
      <Reveal className="order-2 overflow-hidden rounded-[4px] border border-line lg:order-2">
        <PhotoCarousel photos={clubs.photos} label={clubs.title} sizes="(min-width: 1024px) 50vw, 100vw" />
      </Reveal>
      <Reveal delay={100} className="order-1 flex flex-col gap-7 lg:order-1">
        <SectionHeading id="clubs-title" eyebrow="Rental clubs" title={clubs.title} intro={clubs.description} />
        {price && (
          <div className="flex items-baseline gap-3 border-y border-line/80 py-5">
            <span
              className={
                isAmount
                  ? "font-display text-6xl font-semibold leading-none text-gold"
                  : "text-sm font-bold uppercase tracking-[0.18em] text-gold"
              }
            >
              {price}
            </span>
            {priceNote && <span className="text-sm uppercase tracking-[0.14em] text-mist">{priceNote}</span>}
          </div>
        )}
        {clubs.features.length > 0 && (
          <ul className="flex flex-col gap-3">
            {clubs.features.map((f) => (
              <li key={f} className="flex gap-3 text-cream/90">
                <CheckIcon width={18} height={18} className="mt-0.5 shrink-0 text-gold" />
                {f}
              </li>
            ))}
          </ul>
        )}
        <div>
          <SmartLink href={booking.href} className="btn btn-gold">
            Book a Simulator
          </SmartLink>
        </div>
      </Reveal>
    </div>
  );
}
