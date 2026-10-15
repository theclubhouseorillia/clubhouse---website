// Reads an Environment and Climate Change Canada "city page" forecast (MSC Datamart XML)
// into the small shape the homepage weather card shows. No dependencies, so it can be
// tested on its own.

export type WeatherKind =
  | "sun"
  | "moon"
  | "partly"
  | "partly-night"
  | "cloud"
  | "rain"
  | "snow"
  | "mixed"
  | "storm"
  | "fog";

export interface WeatherPeriod {
  /** "Tonight", "Friday", "Friday night" */
  name: string;
  /** Short forecast, e.g. "Chance of flurries or rain showers" */
  summary: string;
  kind: WeatherKind;
  temp: number | null;
  tempClass: "high" | "low" | null;
  /** Chance of precipitation, in % */
  pop: number | null;
}

export interface Weather {
  location: string;
  /** When the current conditions were observed (ISO, UTC) */
  observedAt: string | null;
  current: { temp: number | null; condition: string; kind: WeatherKind } | null;
  periods: WeatherPeriod[];
}

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };

function decode(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, entity: string) => {
      if (entity[0] === "#") {
        const code = entity[1].toLowerCase() === "x" ? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10);
        return Number.isFinite(code) ? String.fromCodePoint(code) : match;
      }
      return ENTITIES[entity.toLowerCase()] ?? match;
    })
    .replace(/\s+/g, " ")
    .trim();
}

function openTag(tag: string): string {
  // "<temperature" must not match "<temperatures".
  return `<${tag}(?=[\\s>/])`;
}

/** Inner XML of the first <tag>…</tag>. */
function block(xml: string, tag: string): string | null {
  const m = xml.match(new RegExp(`${openTag(tag)}[^>]*>([\\s\\S]*?)</${tag}>`));
  return m ? m[1] : null;
}

/** Inner XML of every <tag>…</tag>. */
function blocks(xml: string, tag: string): string[] {
  return [...xml.matchAll(new RegExp(`${openTag(tag)}[^>]*>([\\s\\S]*?)</${tag}>`, "g"))].map((m) => m[1]);
}

/** Text and attributes of the first <tag> element (self-closing or not). */
function element(xml: string, tag: string): { text: string; attrs: Record<string, string> } | null {
  const m = xml.match(new RegExp(`${openTag(tag)}([^>]*?)(?:/>|>([\\s\\S]*?)</${tag}>)`));
  if (!m) return null;
  const attrs: Record<string, string> = {};
  for (const a of (m[1] ?? "").matchAll(/([\w:-]+)="([^"]*)"/g)) attrs[a[1]] = decode(a[2]);
  return { text: decode(m[2] ?? ""), attrs };
}

function toNumber(value: string | undefined | null): number | null {
  if (value == null || value.trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/** Picks an icon from the forecast wording (Environment Canada says "Clear" at night, "Sunny" by day). */
export function kindFor(text: string, night = false): WeatherKind {
  const t = text.toLowerCase();
  if (/thunder/.test(t)) return "storm";
  const snow = /snow|flurr|ice pellet|blizzard/.test(t);
  const rain = /rain|drizzle|precipitation/.test(t) || (/shower/.test(t) && !/snow shower/.test(t));
  if (snow && rain) return "mixed";
  if (snow) return "snow";
  if (rain) return "rain";
  if (/fog|mist|haze|smoke/.test(t)) return "fog";
  if (/partly|mix of sun|a few clouds|clearing|increasing cloud|decreasing cloud/.test(t)) {
    return night ? "partly-night" : "partly";
  }
  if (/cloud|overcast/.test(t)) return "cloud";
  if (/clear/.test(t)) return night ? "moon" : "sun";
  if (/sun/.test(t)) return "sun";
  return night ? "partly-night" : "cloud";
}

/** "20261015200000" (UTC) → "2026-10-15T20:00:00Z" */
function utcStamp(stamp: string | undefined): string | null {
  const m = stamp?.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})?$/);
  return m ? `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6] ?? "00"}Z` : null;
}

export function parseCitypage(xml: string): Weather | null {
  if (!/<siteData[\s>]/.test(xml)) return null;

  const location = element(block(xml, "location") ?? "", "name")?.text || "Orillia";

  let current: Weather["current"] = null;
  let observedAt: string | null = null;
  const cc = block(xml, "currentConditions");
  if (cc) {
    const condition = element(cc, "condition")?.text ?? "";
    const temp = toNumber(element(cc, "temperature")?.text);
    const icon = toNumber(element(cc, "iconCode")?.text);
    const night = icon !== null && icon >= 30 && icon <= 39;
    if (condition || temp !== null) {
      current = { temp: temp === null ? null : Math.round(temp), condition, kind: kindFor(condition, night) };
    }
    const utc = cc.match(/<dateTime(?=[\s>])[^>]*zone="UTC"[^>]*>([\s\S]*?)<\/dateTime>/);
    observedAt = utcStamp(utc ? element(utc[1], "timeStamp")?.text : undefined);
  }

  const periods: WeatherPeriod[] = [];
  for (const f of blocks(block(xml, "forecastGroup") ?? "", "forecast")) {
    const period = element(f, "period");
    const name = period?.attrs.textForecastName || period?.text || "";
    if (!name) continue;
    const abbreviated = block(f, "abbreviatedForecast") ?? "";
    const summary = element(abbreviated, "textSummary")?.text || element(f, "textSummary")?.text || "";
    const temperature = element(block(f, "temperatures") ?? "", "temperature");
    const cls = temperature?.attrs.class;
    const tempClass = cls === "high" || cls === "low" ? cls : null;
    const night = /night/i.test(name);
    periods.push({
      name,
      summary,
      kind: kindFor(summary, night),
      temp: toNumber(temperature?.text),
      tempClass,
      pop: toNumber(element(abbreviated, "pop")?.text),
    });
  }

  // Some stations report a temperature but no sky condition; borrow the next period's look.
  if (current && !current.condition && periods[0]) current.kind = periods[0].kind;

  if (!current && periods.length === 0) return null;
  return { location, observedAt, current, periods };
}

/** Newest English forecast file for a site in a Datamart hour folder's listing. */
export function latestFileIn(listing: string, site: string): string | null {
  const files = [...listing.matchAll(new RegExp(`href="([^"]*_MSC_CitypageWeather_${site}_en\\.xml)"`, "g"))].map(
    (m) => m[1],
  );
  files.sort();
  return files.length ? files[files.length - 1] : null;
}
