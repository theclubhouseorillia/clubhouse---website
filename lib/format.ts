// Date, time and price helpers. All "today" logic uses the venue's time zone.

export const TIMEZONE = "America/Toronto";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** Today's date in the venue's time zone, as YYYY-MM-DD. */
export function todayISO(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** 1 = Monday … 7 = Sunday, in the venue's time zone. */
export function todayWeekdayId(now: Date = new Date()): number {
  const name = new Intl.DateTimeFormat("en-US", { timeZone: TIMEZONE, weekday: "long" }).format(now);
  const index = DAY_NAMES.indexOf(name); // 0 = Sunday
  return index === 0 ? 7 : index;
}

function parseDateOnly(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return null;
  return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
}

export function addDays(iso: string, days: number): string {
  const d = parseDateOnly(iso);
  if (!d) return iso;
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function daysBetween(fromIso: string, toIso: string): number {
  const a = parseDateOnly(fromIso);
  const b = parseDateOnly(toIso);
  if (!a || !b) return 0;
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

export function weekdayName(iso: string): string {
  const d = parseDateOnly(iso);
  return d ? DAY_NAMES[d.getUTCDay()] : "";
}

/** "Friday, November 7" (or with year when it isn't this year). */
export function formatLongDate(iso: string): string {
  const d = parseDateOnly(iso);
  if (!d) return iso;
  const sameYear = iso.slice(0, 4) === todayISO().slice(0, 4);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "UTC",
    weekday: "long",
    month: "long",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  }).format(d);
}

/** "Nov 7, 2026" */
export function formatShortDate(iso: string): string {
  const d = parseDateOnly(iso);
  if (!d) return iso;
  return new Intl.DateTimeFormat("en-CA", { timeZone: "UTC", month: "short", day: "numeric", year: "numeric" }).format(d);
}

/** { month: "NOV", day: "7" } for date badges. */
export function dateBadge(iso: string): { month: string; day: string } {
  const d = parseDateOnly(iso);
  if (!d) return { month: "", day: "" };
  return {
    month: new Intl.DateTimeFormat("en-CA", { timeZone: "UTC", month: "short" }).format(d).replace(".", "").toUpperCase(),
    day: String(d.getUTCDate()),
  };
}

/** "21:30:00" → "9:30 PM", "12:00" → "12 PM". */
export function formatTime(value: string | null | undefined): string {
  if (!value) return "";
  const m = /^(\d{1,2}):(\d{2})/.exec(value);
  if (!m) return value;
  const h24 = Number(m[1]);
  const min = Number(m[2]);
  const suffix = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return min === 0 ? `${h12} ${suffix}` : `${h12}:${String(min).padStart(2, "0")} ${suffix}`;
}

export function formatTimeRange(start: string | null, end: string | null): string {
  if (!start) return "";
  return end ? `${formatTime(start)} – ${formatTime(end)}` : formatTime(start);
}

/** "$45" or "$45.50" in Canadian dollars. */
export function formatPrice(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === "") return "—";
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return "—";
  const digits = Number.isInteger(n) ? 0 : 2;
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    currencyDisplay: "narrowSymbol",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(n);
}

/** True for empty values and for "[placeholder]" text that hasn't been filled in yet. */
export function isPlaceholder(value: string | null | undefined): boolean {
  if (!value || !value.trim()) return true;
  return /^\[.*\]$/.test(value.trim());
}

/** Value if it's real content, otherwise null. */
export function real(value: string | null | undefined): string | null {
  return isPlaceholder(value) ? null : (value as string).trim();
}

export function telHref(phone: string | null | undefined): string | null {
  if (!phone || isPlaceholder(phone)) return null;
  const digits = phone.replace(/[^\d+]/g, "");
  return digits.length >= 7 ? `tel:${digits}` : null;
}

/** "$50 – $65" from a list of prices (or "$50" if they're all the same). */
export function formatPriceRange(values: (number | null | undefined)[]): string | null {
  const nums = values.filter((v): v is number => typeof v === "number" && Number.isFinite(v));
  if (!nums.length) return null;
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  return min === max ? formatPrice(min) : `${formatPrice(min)} – ${formatPrice(max)}`;
}
