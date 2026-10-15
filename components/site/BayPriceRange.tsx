import { formatPriceRange } from "@/lib/format";
import type { BayType, Rate } from "@/lib/types";

/** Green "$50 – $65 per hour" line for a bay, worked out from the pricing table. */
export function BayPriceRange({ bay, rates, className = "" }: { bay: BayType; rates: Rate[]; className?: string }) {
  const column = bay.price_column;
  if (!column) return null;
  const range = formatPriceRange(rates.map((r) => r[column]));
  if (!range) return null;
  return (
    <p className={`flex flex-wrap items-baseline gap-x-2 ${className}`}>
      <span className="font-display text-3xl font-semibold leading-none text-gold">{range}</span>
      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-2">per hour</span>
    </p>
  );
}
