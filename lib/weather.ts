import "server-only";
import { cache } from "react";
import { latestFileIn, parseCitypage, type Weather } from "./weather-parse";

// Orillia's forecast from Environment and Climate Change Canada (free for business use
// with attribution). Site code from ECCC's site list: s0000414, Ontario.
const PROVINCE = "ON";
const SITE = "s0000414";
const DATAMART = "https://dd.weather.gc.ca/today/citypage_weather";
/** Re-check for a newer forecast at most every 15 minutes. */
const REVALIDATE_SECONDS = 900;

export const WEATHER_SOURCE_URL = "https://weather.gc.ca/city/pages/on-13_metric_e.html";
export const WEATHER_LICENCE_URL = "https://eccc-msc.github.io/open-data/licence/readme_en/";

async function fetchText(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      next: { revalidate: REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(5000),
    });
    return res.ok ? await res.text() : null;
  } catch {
    return null;
  }
}

/**
 * The latest Orillia conditions and forecast, or null if Environment Canada can't be
 * reached (the homepage then simply leaves the weather card out).
 */
export const getWeather = cache(async (): Promise<Weather | null> => {
  const now = Date.now();
  // Forecast files are filed in folders by UTC hour; look in this hour's, then the two before.
  for (let hoursBack = 0; hoursBack < 3; hoursBack++) {
    const hour = String(new Date(now - hoursBack * 3_600_000).getUTCHours()).padStart(2, "0");
    const folder = `${DATAMART}/${PROVINCE}/${hour}/`;
    const listing = await fetchText(folder);
    if (!listing) continue;
    const file = latestFileIn(listing, SITE);
    if (!file) continue;
    const xml = await fetchText(new URL(file, folder).toString());
    const weather = xml ? parseCitypage(xml) : null;
    if (weather) return weather;
  }
  return null;
});
