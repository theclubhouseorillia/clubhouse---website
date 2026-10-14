import { addDays, daysBetween, formatLongDate, formatTimeRange, todayISO, weekdayName } from "./format";
import type { EventOccurrence, EventRow } from "./types";

/** Next date this event happens on (today counts), or null if it's over. */
export function nextOccurrence(event: EventRow, today: string): string | null {
  if (!event.repeats_weekly) {
    return event.event_date >= today ? event.event_date : null;
  }
  if (event.repeat_until && event.repeat_until < today) return null;
  if (event.event_date >= today) return event.event_date;

  const elapsed = daysBetween(event.event_date, today);
  const offset = (7 - (elapsed % 7)) % 7;
  const next = addDays(today, offset);
  if (event.repeat_until && next > event.repeat_until) return null;
  return next;
}

export interface SplitEvents {
  upcoming: EventOccurrence[]; // one-off events, soonest first
  weekly: EventOccurrence[]; // repeating events that are still running
  past: EventRow[]; // finished events, most recent first
}

export function splitEvents(events: EventRow[], today: string = todayISO()): SplitEvents {
  const upcoming: EventOccurrence[] = [];
  const weekly: EventOccurrence[] = [];
  const past: EventRow[] = [];

  for (const event of events) {
    const next = nextOccurrence(event, today);
    if (!next) {
      past.push(event);
    } else if (event.repeats_weekly) {
      weekly.push({ ...event, next_date: next });
    } else {
      upcoming.push({ ...event, next_date: next });
    }
  }

  const byDateThenTime = (a: EventOccurrence, b: EventOccurrence) =>
    a.next_date.localeCompare(b.next_date) || (a.start_time ?? "").localeCompare(b.start_time ?? "");

  upcoming.sort(byDateThenTime);
  weekly.sort(byDateThenTime);
  past.sort((a, b) => b.event_date.localeCompare(a.event_date));

  return { upcoming, weekly, past: past.slice(0, 12) };
}

/** Events for the homepage: featured ones first, then whatever is coming up next. */
export function homepageEvents(events: EventRow[], limit = 3, today: string = todayISO()): EventOccurrence[] {
  const { upcoming, weekly } = splitEvents(events, today);
  const all = [...upcoming, ...weekly].sort(
    (a, b) =>
      Number(b.featured) - Number(a.featured) ||
      a.next_date.localeCompare(b.next_date) ||
      (a.start_time ?? "").localeCompare(b.start_time ?? ""),
  );
  return all.slice(0, limit);
}

/** "Every Thursday · 9 PM – 1 AM" or "Saturday, November 8 · 8 PM – 12 AM". */
export function describeWhen(event: EventRow, date: string): string {
  const day = event.repeats_weekly ? `Every ${weekdayName(event.event_date)}` : formatLongDate(date);
  const time = formatTimeRange(event.start_time, event.end_time);
  return time ? `${day} · ${time}` : day;
}
