import { formatPrice } from "@/lib/format";
import type { Rate } from "@/lib/types";

const COLUMNS = [
  { key: "open_bay", label: "Open Bay" },
  { key: "semi_private", label: "Semi-Private" },
  { key: "private_bay", label: "Private" },
] as const;

/** A table on larger screens, easy-to-read cards on phones. */
export function PricingTable({ rates, caption }: { rates: Rate[]; caption: string }) {
  if (!rates.length) {
    return <p className="text-mist">Pricing is coming soon. Please call us for current rates.</p>;
  }

  return (
    <div>
      <div className="card hidden overflow-hidden md:block">
        <table className="w-full border-collapse text-left">
          <caption className="sr-only">{caption}: hourly rate per bay</caption>
          <thead>
            <tr className="border-b border-line bg-coal-2">
              <th scope="col" className="px-6 py-5 text-xs font-semibold uppercase tracking-[0.2em] text-mist">
                Day / Time
              </th>
              {COLUMNS.map((c) => (
                <th
                  key={c.key}
                  scope="col"
                  className="px-6 py-5 text-right text-xs font-semibold uppercase tracking-[0.2em] text-gold"
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rates.map((rate) => (
              <tr key={rate.id} className="border-b border-line/70 transition-colors last:border-0 hover:bg-coal-2/60">
                <th scope="row" className="px-6 py-5 font-semibold text-cream">
                  {rate.label}
                </th>
                {COLUMNS.map((c) => (
                  <td key={c.key} className="px-6 py-5 text-right font-display text-3xl font-semibold text-cream">
                    {formatPrice(rate[c.key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="flex flex-col gap-3 md:hidden" aria-label={caption}>
        {rates.map((rate) => (
          <li key={rate.id} className="card p-5">
            <p className="font-semibold text-cream">{rate.label}</p>
            <dl className="mt-4 grid grid-cols-3 gap-3">
              {COLUMNS.map((c) => (
                <div key={c.key} className="flex flex-col gap-1 border-l border-line pl-3 first:border-0 first:pl-0">
                  <dt className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-mist">{c.label}</dt>
                  <dd className="font-display text-3xl font-semibold text-gold">{formatPrice(rate[c.key])}</dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>
    </div>
  );
}
