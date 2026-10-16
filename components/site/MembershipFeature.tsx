import Link from "next/link";
import { CheckIcon } from "@/components/icons";
import { real } from "@/lib/format";
import type { EventPackage } from "@/lib/types";
import { PhotoSlot } from "./PhotoSlot";

/**
 * A membership plan with its flyer, shown full width in "What's happening" on
 * the homepage. The button opens the Memberships page (details, small print
 * and the "Click to buy" checkout button).
 */
export function MembershipFeature({ plan }: { plan: EventPackage }) {
  const description = real(plan.description);
  const priceNote = real(plan.price_note);
  const features = plan.features.slice(0, 8);

  return (
    <article className="card group grid overflow-hidden transition-colors duration-300 hover:border-gold/50 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
      <div className="relative">
        <PhotoSlot
          src={plan.flyer_url}
          alt={`${plan.name} flyer`}
          label="Membership flyer"
          className="aspect-[4/5] h-full bg-coal-2"
          imageClassName="object-contain transition-transform duration-700 group-hover:scale-[1.02]"
          sizes="(min-width: 1024px) 30vw, (min-width: 640px) 40vw, 100vw"
        />
        <span className="absolute right-4 top-4 bg-ink/85 px-3 py-1.5 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-gold-2">
          Membership
        </span>
      </div>
      <div className="flex flex-col justify-center gap-5 p-6 sm:p-10">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-gold">Now available online</p>
        <h3 className="font-display text-4xl font-semibold leading-tight text-cream sm:text-5xl">{plan.name}</h3>
        <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="font-display text-4xl font-semibold text-gold-2">{plan.price_label}</span>
          {priceNote && <span className="text-sm uppercase tracking-[0.14em] text-mist">{priceNote}</span>}
        </p>
        {description && <p className="max-w-2xl leading-relaxed text-mist">{description}</p>}
        {features.length > 0 && (
          <ul className="grid gap-x-8 gap-y-2.5 lg:grid-cols-2">
            {features.map((feature) => (
              <li key={feature} className="flex items-start gap-2.5 text-sm leading-snug text-cream/90">
                <CheckIcon width={16} height={16} className="mt-0.5 shrink-0 text-gold" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="pt-2">
          <Link href="/memberships" className="btn btn-gold w-full sm:w-auto">
            Buy a Membership
          </Link>
        </div>
      </div>
    </article>
  );
}
