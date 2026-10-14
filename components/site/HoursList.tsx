import { formatLongDate } from "@/lib/format";
import { groupHours, specialHoursValue } from "@/lib/hours";
import type { HoursRow, SpecialHours } from "@/lib/types";

export function HoursList({ hours, special }: { hours: HoursRow[]; special: SpecialHours[] }) {
  return (
    <div className="flex flex-col gap-6">
      <dl className="flex flex-col">
        {groupHours(hours).map((line) => (
          <div key={line.label} className="flex items-baseline justify-between gap-6 border-b border-line/70 py-3 last:border-0">
            <dt className="text-cream">{line.label}</dt>
            <dd className="text-right tabular-nums text-mist">{line.value}</dd>
          </div>
        ))}
      </dl>
      {special.length > 0 && (
        <div className="rounded-[4px] border border-gold/40 bg-forest/40 p-5">
          <p className="eyebrow mb-3">Holiday hours</p>
          <dl className="flex flex-col gap-2 text-sm">
            {special.map((s) => (
              <div key={s.id} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                <dt className="text-cream">
                  {s.label} <span className="text-mist">· {formatLongDate(s.date)}</span>
                </dt>
                <dd className="text-mist">{specialHoursValue(s)}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </div>
  );
}
