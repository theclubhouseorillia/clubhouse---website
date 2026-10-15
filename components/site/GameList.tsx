import { addDays, dateBadge, formatLongDate, formatTime, real, todayISO } from "@/lib/format";
import type { SportsGame } from "@/lib/types";

/** "Today", "Tomorrow" or "Saturday, November 7". */
export function gameDayLabel(iso: string): string {
  const today = todayISO();
  if (iso === today) return "Today";
  if (iso === addDays(today, 1)) return "Tomorrow";
  return formatLongDate(iso);
}

/** One game: optional date badge, league, matchup, note and start time. */
export function GameRow({ game, showDate = false }: { game: SportsGame; showDate?: boolean }) {
  const badge = dateBadge(game.game_date);
  const time = formatTime(game.start_time);
  const sport = real(game.sport);
  const note = real(game.note);

  return (
    <li
      className={`flex items-center gap-4 rounded-[4px] border p-4 sm:p-5 ${
        game.featured ? "border-gold/70 bg-forest" : "border-line bg-coal"
      }`}
    >
      {showDate && (
        <div className="flex min-w-14 shrink-0 flex-col items-center bg-gold px-3 py-2 leading-none text-ink">
          <span className="text-[0.65rem] font-bold tracking-[0.2em]">{badge.month}</span>
          <span className="font-display text-2xl font-bold">{badge.day}</span>
          <span className="sr-only">{gameDayLabel(game.game_date)}</span>
        </div>
      )}
      <div className="min-w-0 flex-1">
        {(sport || game.featured) && (
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.7rem] font-bold uppercase tracking-[0.18em] text-gold-2">
            {sport && <span>{sport}</span>}
            {game.featured && <span className="bg-gold px-2 py-0.5 text-ink">Big game</span>}
          </p>
        )}
        <h3 className="mt-1 font-display text-xl font-semibold leading-tight text-cream sm:text-2xl">{game.title}</h3>
        {note && <p className="mt-1 text-sm text-mist">{note}</p>}
      </div>
      {time && <p className="shrink-0 text-right text-sm font-semibold text-cream">{time}</p>}
    </li>
  );
}
