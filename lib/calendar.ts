// Month grid and event dates for the Calendar page.
import { addDays, daysBetween } from "./format";
import type { EventRow } from "./types";

export interface CalendarItem {
  event: EventRow;
  date: string; // YYYY-MM-DD
}

const MONTH_RE = /^(\d{4})-(0[1-9]|1[0-2])$/;

function utcDate(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`);
}

/** "2026-11" + 1 → "2026-12". */
export function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return d.toISOString().slice(0, 7);
}

/** The month to show: the one asked for if it's in range, otherwise the current month. */
export function pickMonth(requested: string | undefined, current: string, max: string): string {
  if (!requested || !MONTH_RE.test(requested)) return current;
  if (requested < current) return current;
  if (requested > max) return max;
  return requested;
}

/** "November 2026" */
export function monthLabel(month: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "UTC", month: "long", year: "numeric" }).format(
    utcDate(`${month}-01`),
  );
}

/** "November" */
export function monthName(month: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "UTC", month: "long" }).format(utcDate(`${month}-01`));
}

export function lastDayOfMonth(month: string): string {
  return addDays(`${shiftMonth(month, 1)}-01`, -1);
}

/** Weeks (Sunday to Saturday) covering the whole month, including the days either side. */
export function monthGrid(month: string): string[][] {
  const first = `${month}-01`;
  const last = lastDayOfMonth(month);
  const start = addDays(first, -utcDate(first).getUTCDay());
  const end = addDays(last, 6 - utcDate(last).getUTCDay());
  const weeks: string[][] = [];
  for (let day = start; day <= end; day = addDays(day, 7)) {
    weeks.push(Array.from({ length: 7 }, (_, i) => addDays(day, i)));
  }
  return weeks;
}

/** Every date each event happens on between `from` and `to` (inclusive), sorted by date then time. */
export function occurrencesBetween(events: EventRow[], from: string, to: string): CalendarItem[] {
  const items: CalendarItem[] = [];
  for (const event of events) {
    if (!event.repeats_weekly) {
      if (event.event_date >= from && event.event_date <= to) items.push({ event, date: event.event_date });
      continue;
    }
    const until = event.repeat_until && event.repeat_until < to ? event.repeat_until : to;
    let day = event.event_date;
    if (day < from) {
      const behind = daysBetween(day, from);
      day = addDays(day, Math.ceil(behind / 7) * 7);
    }
    for (; day <= until; day = addDays(day, 7)) items.push({ event, date: day });
  }
  return items.sort(
    (a, b) =>
      a.date.localeCompare(b.date) ||
      (a.event.start_time ?? "").localeCompare(b.event.start_time ?? "") ||
      a.event.title.localeCompare(b.event.title),
  );
}
