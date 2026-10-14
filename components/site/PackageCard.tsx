import { CheckIcon } from "@/components/icons";
import type { EventPackage } from "@/lib/types";
import { SmartLink } from "./SmartLink";

export function PackageCard({
  pkg,
  cta,
  maxFeatures,
}: {
  pkg: EventPackage;
  cta?: { href: string; label: string };
  maxFeatures?: number;
}) {
  const features = maxFeatures ? pkg.features.slice(0, maxFeatures) : pkg.features;
  const hidden = pkg.features.length - features.length;

  return (
    <article
      className={`relative flex h-full flex-col gap-6 rounded-[4px] border p-7 sm:p-8 ${
        pkg.featured ? "border-gold bg-forest" : "border-line bg-coal"
      }`}
    >
      {pkg.featured && (
        <span className="absolute -top-3 left-7 bg-gold px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-ink">
          Most popular
        </span>
      )}
      <div className="flex flex-col gap-2">
        <h3 className="font-display text-3xl font-semibold leading-tight text-cream">{pkg.name}</h3>
        {pkg.description && <p className="text-mist">{pkg.description}</p>}
      </div>
      <div className="border-y border-line/80 py-5">
        <p className="font-display text-5xl font-semibold text-gold">{pkg.price_label}</p>
        {pkg.price_note && <p className="mt-1 text-sm uppercase tracking-[0.12em] text-mist">{pkg.price_note}</p>}
      </div>
      <ul className="flex flex-col gap-3">
        {features.map((f) => (
          <li key={f} className="flex gap-3 text-cream/90">
            <CheckIcon width={18} height={18} className="mt-0.5 shrink-0 text-gold" />
            <span>{f}</span>
          </li>
        ))}
        {hidden > 0 && <li className="pl-8 text-sm text-mist">+ {hidden} more</li>}
      </ul>
      {cta && (
        <div className="mt-auto pt-2">
          <SmartLink href={cta.href} className={`btn w-full ${pkg.featured ? "btn-gold" : "btn-outline"}`}>
            {cta.label}
          </SmartLink>
        </div>
      )}
    </article>
  );
}
