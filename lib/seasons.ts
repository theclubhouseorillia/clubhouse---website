// Seasonal decorations: which theme shows when. Used by the site (in the
// visitor's browser, on Toronto dates) and by the admin dashboard's options.

export type SeasonKey =
  | "fall"
  | "halloween"
  | "christmas"
  | "newyear"
  | "winter"
  | "valentines"
  | "stpatricks"
  | "easter"
  | "canadaday";

export type SeasonMode = "auto" | "off" | SeasonKey;
export type SeasonAmount = "light" | "normal" | "lots";

export interface SeasonalSettings {
  mode: SeasonMode;
  amount: SeasonAmount;
  show_on_phones: boolean;
}

export const DEFAULT_SEASONAL_SETTINGS: SeasonalSettings = { mode: "auto", amount: "normal", show_on_phones: true };

/** Every theme, in calendar order, with when it shows automatically. */
export const SEASONS: { key: SeasonKey; label: string; when: string }[] = [
  { key: "newyear", label: "New Year's (confetti & fireworks)", when: "Dec 27 – Jan 2" },
  { key: "winter", label: "Winter (snow & icicles)", when: "Jan 3 – Mar 9" },
  { key: "valentines", label: "Valentine's Day (hearts)", when: "Feb 7 – 14" },
  { key: "stpatricks", label: "St. Patrick's Day (shamrocks)", when: "Mar 11 – 17" },
  { key: "easter", label: "Easter (spring blossoms)", when: "the week before Easter to Easter Monday" },
  { key: "canadaday", label: "Canada Day (maple leaves & fireworks)", when: "Jun 24 – Jul 1" },
  { key: "fall", label: "Fall (falling leaves)", when: "Sep 22 – Oct 23 and Nov 1 – 20" },
  { key: "halloween", label: "Halloween (bats, ghosts & spiders)", when: "Oct 24 – 31" },
  { key: "christmas", label: "Christmas (snow & twinkling lights)", when: "Nov 21 – Dec 26" },
];

const KEYS = new Set<string>(SEASONS.map((s) => s.key));

export function isSeasonKey(v: unknown): v is SeasonKey {
  return typeof v === "string" && KEYS.has(v);
}

export function normalizeSeasonalSettings(row: Partial<Record<keyof SeasonalSettings, unknown>> | null): SeasonalSettings {
  if (!row) return DEFAULT_SEASONAL_SETTINGS;
  const mode = row.mode === "auto" || row.mode === "off" || isSeasonKey(row.mode) ? row.mode : "auto";
  const amount = row.amount === "light" || row.amount === "lots" ? row.amount : "normal";
  return { mode, amount, show_on_phones: row.show_on_phones !== false };
}

/** Easter Sunday (Gregorian calendar), as month (1–12) and day. */
export function easterSunday(year: number): { month: number; day: number } {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return { month, day };
}

/** The theme that shows automatically on a given date, or null for none. */
export function seasonForDate(year: number, month: number, day: number): SeasonKey | null {
  const md = month * 100 + day;
  if (md >= 1227 || md <= 102) return "newyear";
  if (md >= 207 && md <= 214) return "valentines";
  if (md >= 311 && md <= 317) return "stpatricks";
  const easter = easterSunday(year);
  const daysFromEaster = (Date.UTC(year, month - 1, day) - Date.UTC(year, easter.month - 1, easter.day)) / 86_400_000;
  if (daysFromEaster >= -7 && daysFromEaster <= 1) return "easter";
  if (md >= 103 && md <= 309) return "winter";
  if (md >= 624 && md <= 701) return "canadaday";
  if (md >= 1024 && md <= 1031) return "halloween";
  if ((md >= 922 && md <= 1023) || (md >= 1101 && md <= 1120)) return "fall";
  if (md >= 1121 && md <= 1226) return "christmas";
  return null;
}

/** Today's date in Orillia (Toronto time). */
export function torontoToday(now: Date = new Date()): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Toronto",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(now);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return { year: get("year"), month: get("month"), day: get("day") };
}

/** The theme to show right now for a given setting. */
export function activeSeason(mode: SeasonMode, now: Date = new Date()): SeasonKey | null {
  if (mode === "off") return null;
  if (mode !== "auto") return mode;
  const t = torontoToday(now);
  return seasonForDate(t.year, t.month, t.day);
}
