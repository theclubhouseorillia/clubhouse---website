import { formatTime } from "./format";
import type { HoursRow, SpecialHours } from "./types";

export interface HoursLine {
  label: string;
  value: string;
}

function rowValue(row: Pick<HoursRow, "closed" | "opens" | "closes">): string {
  if (row.closed) return "Closed";
  if (!row.opens || !row.closes) return "Hours vary";
  return `${formatTime(row.opens)} – ${formatTime(row.closes)}`;
}

/** Groups consecutive days with the same hours: "Monday – Thursday: 11 AM – 10 PM". */
export function groupHours(rows: HoursRow[]): HoursLine[] {
  const sorted = [...rows].sort((a, b) => a.id - b.id);
  const lines: HoursLine[] = [];
  let start = 0;
  for (let i = 1; i <= sorted.length; i++) {
    const prev = sorted[i - 1];
    const cur = sorted[i];
    if (cur && rowValue(cur) === rowValue(prev)) continue;
    const first = sorted[start];
    const label = first.id === prev.id ? first.day_name : `${first.day_name} – ${prev.day_name}`;
    lines.push({ label, value: rowValue(prev) });
    start = i;
  }
  return lines;
}

export function specialHoursValue(s: SpecialHours): string {
  return rowValue(s);
}

/** Hours for one specific date, taking holiday / special hours into account. */
export function hoursForDate(
  weekdayId: number,
  dateIso: string,
  rows: HoursRow[],
  special: SpecialHours[],
): { value: string; note: string | null; closed: boolean } {
  const override = special.find((s) => s.date === dateIso);
  if (override) {
    return { value: specialHoursValue(override), note: override.label, closed: override.closed };
  }
  const row = rows.find((r) => r.id === weekdayId);
  if (!row) return { value: "", note: null, closed: false };
  return { value: rowValue(row), note: null, closed: row.closed };
}

const SCHEMA_DAYS = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

/** schema.org openingHoursSpecification for search engines. */
export function openingHoursSchema(rows: HoursRow[]) {
  return rows
    .filter((r) => !r.closed && r.opens && r.closes)
    .map((r) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: SCHEMA_DAYS[r.id],
      opens: (r.opens ?? "").slice(0, 5),
      closes: (r.closes ?? "").slice(0, 5),
    }));
}
