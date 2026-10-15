import type { Metadata } from "next";
import Link from "next/link";
import { PhoneIcon } from "@/components/icons";
import { GameRow, gameDayLabel } from "@/components/site/GameList";
import { Reveal } from "@/components/site/Reveal";
import { PageHeader } from "@/components/site/SectionHeading";
import { SmartLink } from "@/components/site/SmartLink";
import { getSettings, getSportsGames } from "@/lib/data";
import { real, telHref } from "@/lib/format";
import { bookingLink } from "@/lib/site";
import type { SportsGame } from "@/lib/types";

export const metadata: Metadata = {
  title: "Watch the Game",
  description: "Catch the big games on large 4K screens with a full bar and kitchen. See which games we're showing next.",
  alternates: { canonical: "/sports" },
};

export default async function SportsPage() {
  const [games, settings] = await Promise.all([getSportsGames(), getSettings()]);
  const tel = telHref(settings.phone);
  const phone = real(settings.phone);
  const booking = bookingLink(settings);

  const days = new Map<string, SportsGame[]>();
  for (const g of games) days.set(g.game_date, [...(days.get(g.game_date) ?? []), g]);

  return (
    <>
      <PageHeader
        eyebrow="Sports bar"
        title="Watch the game here"
        intro="Catch the big games on our large 4K screens with the full bar and kitchen. Here's what's coming up."
      />

      <section aria-label="Upcoming games" className="py-16 sm:py-24">
        <div className="container-site flex max-w-4xl flex-col gap-12">
          {games.length === 0 ? (
            <div className="card flex flex-col items-start gap-5 p-8">
              <p className="text-lg text-mist">No games are posted right now. Give us a call to ask what&apos;s on the TVs.</p>
              {tel && phone && (
                <a href={tel} className="btn btn-outline">
                  <PhoneIcon width={18} height={18} />
                  {phone}
                </a>
              )}
            </div>
          ) : (
            [...days.entries()].map(([day, list], i) => (
              <Reveal key={day} delay={Math.min(i, 3) * 60} className="flex flex-col gap-4">
                <h2 className="font-display text-3xl font-semibold text-cream">{gameDayLabel(day)}</h2>
                <ul className="flex flex-col gap-3">
                  {list.map((g) => (
                    <GameRow key={g.id} game={g} />
                  ))}
                </ul>
              </Reveal>
            ))
          )}
        </div>
      </section>

      <section className="border-t border-line bg-coal py-16 sm:py-20">
        <div className="container-site flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
          <div className="flex flex-col gap-2">
            <h2 className="font-display text-3xl font-semibold text-cream">Make a night of it</h2>
            <p className="max-w-xl text-mist">Grab a bay before or after the game and play a round on our Trackman simulators.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <SmartLink href={booking.href} className="btn btn-gold">
              Book a Simulator
            </SmartLink>
            <Link href="/menu" className="btn btn-outline">
              Food &amp; Drink
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
