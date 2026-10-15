import type { Metadata } from "next";
import Link from "next/link";
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon, ClockIcon, TicketIcon } from "@/components/icons";
import { PageHeader } from "@/components/site/SectionHeading";
import { SmartLink } from "@/components/site/SmartLink";
import {
  lastDayOfMonth,
  monthGrid,
  monthLabel,
  monthName,
  occurrencesBetween,
  pickMonth,
  shiftMonth,
  type CalendarItem,
} from "@/lib/calendar";
import { getEvents, getSpecialHours } from "@/lib/data";
import { formatLongDate, formatTime, formatTimeRange, real, todayISO } from "@/lib/format";
import type { SpecialHours } from "@/lib/types";

export const metadata: Metadata = {
  title: "Calendar",
  description: "Weekly specials, events and entertainment, day by day.",
  alternates: { canonical: "/calendar" },
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS_AHEAD = 11;

function specialNote(s: SpecialHours): string {
  if (s.closed) return `${s.label}: closed`;
  const hours = formatTimeRange(s.opens, s.closes);
  return hours ? `${s.label}: ${hours}` : s.label;
}

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const { month: requested } = await searchParams;
  const today = todayISO();
  const currentMonth = today.slice(0, 7);
  const lastMonth = shiftMonth(currentMonth, MONTHS_AHEAD);
  const month = pickMonth(requested, currentMonth, lastMonth);
  const prev = month > currentMonth ? shiftMonth(month, -1) : null;
  const next = month < lastMonth ? shiftMonth(month, 1) : null;

  const [events, special] = await Promise.all([getEvents(), getSpecialHours()]);
  const weeks = monthGrid(month);
  const items = occurrencesBetween(events, weeks[0][0], weeks[weeks.length - 1][6]);

  const byDate = new Map<string, CalendarItem[]>();
  for (const item of items) byDate.set(item.date, [...(byDate.get(item.date) ?? []), item]);
  const specialByDate = new Map(special.map((s) => [s.date, s]));

  // Day-by-day list: this month's days with something on, from today onward.
  const firstListed = month === currentMonth ? today : `${month}-01`;
  const lastListed = lastDayOfMonth(month);
  const listDays = [...new Set([...byDate.keys(), ...specialByDate.keys()])]
    .filter((d) => d >= firstListed && d <= lastListed)
    .sort();

  const monthNav = (
    <nav aria-label="Choose month" className="flex items-center justify-between gap-4">
      {prev ? (
        <Link href={`/calendar?month=${prev}`} className="btn btn-outline min-h-11 px-4" scroll={false}>
          <ChevronLeftIcon width={18} height={18} />
          <span className="hidden sm:inline">{monthName(prev)}</span>
          <span className="sr-only sm:hidden">Previous month</span>
        </Link>
      ) : (
        <span className="w-11 sm:w-32" aria-hidden="true" />
      )}
      <h2 id="month-title" className="text-center font-display text-3xl font-semibold text-cream sm:text-4xl">
        {monthLabel(month)}
      </h2>
      {next ? (
        <Link href={`/calendar?month=${next}`} className="btn btn-outline min-h-11 px-4" scroll={false}>
          <span className="hidden sm:inline">{monthName(next)}</span>
          <span className="sr-only sm:hidden">Next month</span>
          <ChevronRightIcon width={18} height={18} />
        </Link>
      ) : (
        <span className="w-11 sm:w-32" aria-hidden="true" />
      )}
    </nav>
  );

  return (
    <>
      <PageHeader
        eyebrow="What's on"
        title="Calendar"
        intro="Weekly specials, events and entertainment at a glance. Tap a day for the details."
      />

      <section id="calendar-top" aria-labelledby="month-title" className="scroll-mt-24 py-14 sm:py-20">
        <div className="container-site flex flex-col gap-10">
          {monthNav}

          {/* Month grid (tablets and computers) */}
          <div className="hidden md:block">
            <div className="grid grid-cols-7 border-l border-t border-line text-sm">
              {WEEKDAYS.map((d) => (
                <div
                  key={d}
                  className="border-b border-r border-line bg-coal px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-mist"
                >
                  {d}
                </div>
              ))}
              {weeks.flat().map((date) => {
                const inMonth = date.startsWith(month);
                const past = date < today;
                const isToday = date === today;
                const dayItems = byDate.get(date) ?? [];
                const note = specialByDate.get(date);
                const listed = inMonth && date >= firstListed && (dayItems.length > 0 || !!note);
                return (
                  <div
                    key={date}
                    className={`flex min-h-32 flex-col gap-1.5 border-b border-r border-line p-2 ${
                      inMonth ? "bg-ink" : "bg-coal/60"
                    } ${past || !inMonth ? "opacity-45" : ""}`}
                  >
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold ${
                        isToday ? "bg-gold text-ink" : "text-cream"
                      }`}
                      aria-label={isToday ? `Today, ${formatLongDate(date)}` : formatLongDate(date)}
                    >
                      {Number(date.slice(8))}
                    </span>
                    {note && (
                      <span className={`text-xs font-semibold ${note.closed ? "text-danger" : "text-gold-2"}`}>
                        {note.closed ? "Closed" : note.label}
                      </span>
                    )}
                    {dayItems.slice(0, 3).map(({ event }) => {
                      const time = formatTime(event.start_time);
                      const chip = (
                        <>
                          {time && <span className="font-semibold text-gold-2">{time} </span>}
                          {event.title}
                        </>
                      );
                      return listed ? (
                        <a
                          key={event.id}
                          href={`#day-${date}`}
                          className="block truncate rounded-sm bg-forest px-2 py-1 text-xs text-cream transition hover:bg-gold hover:text-ink"
                        >
                          {chip}
                        </a>
                      ) : (
                        <span key={event.id} className="block truncate rounded-sm bg-forest px-2 py-1 text-xs text-cream">
                          {chip}
                        </span>
                      );
                    })}
                    {dayItems.length > 3 && (
                      <span className="px-1 text-xs text-mist">+{dayItems.length - 3} more</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Day by day (every screen size) */}
          <div className="flex flex-col">
            <h2 className="eyebrow mb-2">Day by day</h2>
            {listDays.length === 0 ? (
              <div className="card flex flex-col items-start gap-4 p-8">
                <p className="text-lg text-mist">
                  Nothing on the calendar for the rest of {monthName(month)} yet.
                </p>
                {next && (
                  <Link href={`/calendar?month=${next}`} className="btn btn-outline" scroll={false}>
                    See {monthName(next)}
                    <ChevronRightIcon width={16} height={16} />
                  </Link>
                )}
              </div>
            ) : (
              listDays.map((date) => {
                const dayItems = byDate.get(date) ?? [];
                const note = specialByDate.get(date);
                return (
                  <div
                    key={date}
                    id={`day-${date}`}
                    className="grid scroll-mt-28 gap-4 border-t border-line py-7 md:grid-cols-[13rem_1fr] md:gap-8"
                  >
                    <div className="flex items-start gap-3">
                      <CalendarIcon className="mt-1 shrink-0 text-gold" />
                      <div>
                        <p className="font-display text-2xl font-semibold text-cream">{formatLongDate(date)}</p>
                        {date === today && (
                          <span className="mt-1 inline-block bg-gold px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-ink">
                            Today
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-4">
                      {note && (
                        <p
                          className={`rounded-sm border px-4 py-3 text-sm font-semibold ${
                            note.closed ? "border-danger/50 text-danger" : "border-gold/40 text-gold-2"
                          }`}
                        >
                          {specialNote(note)}
                        </p>
                      )}
                      {dayItems.map(({ event }) => {
                        const time = formatTimeRange(event.start_time, event.end_time);
                        const description = real(event.description);
                        const admission = real(event.admission);
                        const buttonUrl = real(event.button_url);
                        const buttonLabel = real(event.button_label) ?? (buttonUrl ? "Book now" : "Contact us");
                        return (
                          <article
                            key={event.id}
                            className="card flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
                          >
                            <div className="flex flex-col gap-1.5">
                              <h3 className="font-display text-2xl font-semibold leading-tight text-cream">{event.title}</h3>
                              <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gold-2">
                                {time && (
                                  <span className="inline-flex items-center gap-1.5">
                                    <ClockIcon width={15} height={15} />
                                    {time}
                                  </span>
                                )}
                                {admission && (
                                  <span className="inline-flex items-center gap-1.5">
                                    <TicketIcon width={15} height={15} />
                                    {admission}
                                  </span>
                                )}
                                {event.repeats_weekly && <span className="text-mist">Every week</span>}
                              </p>
                              {description && <p className="max-w-2xl leading-relaxed text-mist">{description}</p>}
                            </div>
                            <SmartLink
                              href={buttonUrl ?? "/contact"}
                              className="btn btn-outline shrink-0 self-start sm:self-center"
                              ariaLabel={`${buttonLabel}: ${event.title}`}
                            >
                              {buttonLabel}
                            </SmartLink>
                          </article>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {next && listDays.length > 0 && (
            <div className="flex justify-end">
              <Link
                href={`/calendar?month=${next}#calendar-top`}
                className="link-gold inline-flex items-center gap-2 text-sm uppercase tracking-[0.16em]"
              >
                {monthName(next)} <ChevronRightIcon width={16} height={16} />
              </Link>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
