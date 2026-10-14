import { CalendarIcon, TicketIcon } from "@/components/icons";
import { describeWhen } from "@/lib/events";
import { dateBadge, real } from "@/lib/format";
import type { EventOccurrence } from "@/lib/types";
import { PhotoSlot } from "./PhotoSlot";
import { SmartLink } from "./SmartLink";

export function EventCard({ event, compact = false }: { event: EventOccurrence; compact?: boolean }) {
  const badge = dateBadge(event.next_date);
  const when = describeWhen(event, event.next_date);
  const buttonUrl = real(event.button_url);
  const href = buttonUrl ?? "/contact";
  const label = real(event.button_label) ?? (buttonUrl ? "Book now" : "Contact us");
  const description = real(event.description);
  const admission = real(event.admission);

  return (
    <article className="card group flex h-full flex-col overflow-hidden transition-colors duration-300 hover:border-gold/50">
      <div className="relative">
        <PhotoSlot
          src={event.image_url}
          alt={`${event.title} flyer`}
          label="Event flyer"
          className="aspect-[4/5] bg-coal-2"
          imageClassName="object-contain transition-transform duration-700 group-hover:scale-[1.02]"
          sizes="(min-width: 1024px) 30vw, (min-width: 640px) 50vw, 100vw"
        />
        <div className="absolute left-4 top-4 flex min-w-14 flex-col items-center bg-gold px-3 py-2 leading-none text-ink shadow-lg">
          <span className="text-[0.65rem] font-bold tracking-[0.2em]">{badge.month}</span>
          <span className="font-display text-3xl font-bold">{badge.day}</span>
        </div>
        {event.repeats_weekly && (
          <span className="absolute right-4 top-4 bg-ink/85 px-3 py-1.5 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-gold-2">
            Weekly
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-6">
        <p className="flex items-start gap-2 text-sm font-semibold text-gold-2">
          <CalendarIcon width={16} height={16} className="mt-0.5 shrink-0" />
          <span>{when}</span>
        </p>
        <h3 className="font-display text-3xl font-semibold leading-tight text-cream">{event.title}</h3>
        {description && (
          <p className={`leading-relaxed text-mist ${compact ? "line-clamp-3" : "whitespace-pre-line"}`}>{description}</p>
        )}
        {admission && (
          <p className="flex items-center gap-2 text-sm text-cream/90">
            <TicketIcon width={16} height={16} className="shrink-0 text-gold" />
            {admission}
          </p>
        )}
        <div className="mt-auto pt-3">
          <SmartLink href={href} className="btn btn-outline w-full" ariaLabel={`${label}: ${event.title}`}>
            {label}
          </SmartLink>
        </div>
      </div>
    </article>
  );
}
