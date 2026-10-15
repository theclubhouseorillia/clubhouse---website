import { CheckIcon } from "@/components/icons";
import { real } from "@/lib/format";
import type { LinkTarget } from "@/lib/site";
import type { PoolTable } from "@/lib/types";
import { PhotoCarousel } from "./PhotoCarousel";
import { Reveal } from "./Reveal";
import { SectionHeading } from "./SectionHeading";
import { SmartLink } from "./SmartLink";

/** Pool table showcase: photos, price and a booking button. */
export function PoolTableFeature({
  pool,
  photos,
  booking,
  id = "pool-title",
}: {
  pool: PoolTable;
  photos: string[];
  booking: LinkTarget;
  id?: string;
}) {
  const href = real(pool.booking_url) ?? booking.href;
  const isAmount = /\d/.test(pool.price_label);

  return (
    <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
      <Reveal className="overflow-hidden rounded-[4px] border border-line">
        <PhotoCarousel photos={photos} label={pool.title} sizes="(min-width: 1024px) 50vw, 100vw" />
      </Reveal>
      <Reveal delay={100} className="flex flex-col gap-7">
        <SectionHeading id={id} eyebrow="Pool table" title={pool.title} intro={pool.description} />
        <div className="flex items-baseline gap-3 border-y border-line/80 py-5">
          <span
            className={
              isAmount
                ? "font-display text-6xl font-semibold leading-none text-gold"
                : "text-sm font-bold uppercase tracking-[0.18em] text-gold"
            }
          >
            {pool.price_label}
          </span>
          {pool.price_note && <span className="text-sm uppercase tracking-[0.14em] text-mist">{pool.price_note}</span>}
        </div>
        {pool.features.length > 0 && (
          <ul className="flex flex-col gap-3">
            {pool.features.map((f) => (
              <li key={f} className="flex gap-3 text-cream/90">
                <CheckIcon width={18} height={18} className="mt-0.5 shrink-0 text-gold" />
                {f}
              </li>
            ))}
          </ul>
        )}
        <div>
          <SmartLink href={href} className="btn btn-gold">
            Book the Pool Table
          </SmartLink>
        </div>
      </Reveal>
    </div>
  );
}
