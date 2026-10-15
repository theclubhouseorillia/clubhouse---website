import type { Weather } from "@/lib/weather-parse";
import { WEATHER_LICENCE_URL, WEATHER_SOURCE_URL } from "@/lib/weather";
import type { LinkTarget } from "@/lib/site";
import { SmartLink } from "./SmartLink";
import { WeatherIcon } from "./WeatherIcon";

function hookLine(weather: Weather): string {
  const kind = weather.current?.kind ?? weather.periods[0]?.kind;
  if (kind === "rain" || kind === "mixed" || kind === "storm") return "Wet out there? Tee it up inside.";
  if (kind === "snow") return "Snowing? Tee it up inside.";
  const temp = weather.current?.temp;
  if (temp !== null && temp !== undefined && temp <= 5) return "Chilly out? Tee it up inside.";
  return "Rain or shine, it’s golf season indoors.";
}

function updatedAt(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/Toronto" });
}

/** Today's Orillia weather and the next few forecast periods, with a nudge to book. */
export function WeatherCard({ weather, booking }: { weather: Weather; booking: LinkTarget }) {
  const { current } = weather;
  const periods = weather.periods.slice(0, 4);
  const updated = updatedAt(weather.observedAt);

  return (
    <aside aria-labelledby="weather-title" className="card flex h-full flex-col gap-6 p-7 sm:p-8">
      <div className="flex items-baseline justify-between gap-4">
        <h3 id="weather-title" className="text-xs font-bold uppercase tracking-[0.22em] text-gold">
          {weather.location} weather
        </h3>
        {updated && <p className="text-xs text-mist">Updated {updated}</p>}
      </div>

      {current && (
        <div className="flex items-center gap-5">
          <WeatherIcon kind={current.kind} width={56} height={56} className="shrink-0 text-gold" />
          <div className="flex flex-col">
            {current.temp !== null && (
              <p className="font-display text-6xl font-semibold leading-none text-cream">
                {current.temp}°<span className="align-top text-2xl text-mist">C</span>
              </p>
            )}
            {current.condition && <p className="mt-1 text-cream/90">{current.condition}</p>}
          </div>
        </div>
      )}

      <p className="font-display text-xl italic text-gold-2">{hookLine(weather)}</p>

      {periods.length > 0 && (
        <ul className="flex flex-col divide-y divide-line border-y border-line">
          {periods.map((p) => (
            <li key={p.name} className="flex items-center gap-3 py-3">
              <span className="w-24 shrink-0 text-sm font-semibold text-cream">{p.name}</span>
              <WeatherIcon kind={p.kind} width={22} height={22} className="shrink-0 text-gold" />
              <span className="min-w-0 flex-1 text-sm leading-snug text-mist">
                {p.summary}
                {p.pop ? <span className="text-cream/80"> · {p.pop}%</span> : null}
              </span>
              {p.temp !== null && (
                <span className="shrink-0 text-right text-sm text-cream">
                  <span className="sr-only">{p.tempClass === "low" ? "Low " : p.tempClass === "high" ? "High " : ""}</span>
                  <span aria-hidden="true" className="mr-1 text-[0.65rem] uppercase tracking-[0.14em] text-mist">
                    {p.tempClass === "low" ? "Lo" : p.tempClass === "high" ? "Hi" : ""}
                  </span>
                  <span className="font-semibold">{p.temp}°</span>
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-auto flex flex-col gap-4">
        <SmartLink href={booking.href} className="btn btn-gold w-full">
          Book a simulator
        </SmartLink>
        <p className="text-xs leading-relaxed text-mist">
          Data source:{" "}
          <a href={WEATHER_SOURCE_URL} target="_blank" rel="noopener noreferrer" className="underline hover:text-gold-2">
            Environment and Climate Change Canada
          </a>{" "}
          (
          <a href={WEATHER_LICENCE_URL} target="_blank" rel="noopener noreferrer" className="underline hover:text-gold-2">
            licence
          </a>
          )
        </p>
      </div>
    </aside>
  );
}
