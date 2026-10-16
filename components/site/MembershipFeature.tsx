import Link from "next/link";
import { CheckIcon } from "@/components/icons";
import { real } from "@/lib/format";
import type { EventPackage } from "@/lib/types";
import { PhotoSlot } from "./PhotoSlot";

/**
 * A membership plan with its flyer, in "What's happening" on the homepage
 * (beside the gift card). The button opens the Memberships page, which has the
 * details, small print and the "Click to buy" checkout button.
 */
export function MembershipFeature({ plan }: { plan: EventPackage }) {
  const description = real(plan.description);
  const priceNote = real(plan.price_note);
  const features = plan.features.slice(0, 8);

  return (
    <article className="card group flex h-full flex-col overflow-hidden transition-colors duration-300 hover:border-gold/50">
      <div className="relative">
        <PhotoSlot
          src={plan.flyer_url}
          alt={`${plan.name} flyer`}
          label="Membership flyer"
          className="aspect-[4/5] bg-coal-2 md:aspect-[4/3]"
          imageClassName="object-contain p-5 transition-transform duration-700 group-hover:scale-[1.02]"
          sizes="(min-width: 768px) 45vw, 100vw"
        />
        <span className="absolute right-4 top-4 bg-ink/85 px-3 py-1.5 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-gold-2">
          Membership
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-4 p-6 sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-gold">Now available online</p>
        <h3 className="font-display text-4xl font-semibold leading-tight text-cream">{plan.name}</h3>
        <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="font-display text-4xl font-semibold text-gold-2">{plan.price_label}</span>
          {priceNote && <span className="text-sm uppercase tracking-[0.14em] text-mist">{priceNote}</span>}
        </p>
        {description && <p className="leading-relaxed text-mist">{description}</p>}
        {features.length > 0 && (
          <ul className="grid gap-x-6 gap-y-2.5 xl:grid-cols-2">
            {features.map((feature) => (
              <li key={feature} className="flex items-start gap-2.5 text-sm leading-snug text-cream/90">
                <CheckIcon width={16} height={16} className="mt-0.5 shrink-0 text-gold" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-auto pt-3">
          <Link href="/memberships" className="btn btn-gold w-full">
            Buy a Membership
          </Link>
        </div>
      </div>
    </article>
  );
}
