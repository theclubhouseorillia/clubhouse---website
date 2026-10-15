import type { Metadata } from "next";
import Link from "next/link";
import { EventCard } from "@/components/site/EventCard";
import { Gallery } from "@/components/site/Gallery";
import { Reveal } from "@/components/site/Reveal";
import { PageHeader, SectionHeading } from "@/components/site/SectionHeading";
import { getEvents, getGallery } from "@/lib/data";
import { splitEvents } from "@/lib/events";
import { formatShortDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "Events: Karaoke, Live DJs & Live Music",
  description: "Upcoming karaoke nights, live DJs, live music, tournaments and special events.",
  alternates: { canonical: "/events" },
};

export default async function EventsPage() {
  const [events, gallery] = await Promise.all([getEvents(), getGallery()]);
  const { upcoming, weekly, past } = splitEvents(events);
  const highlightCategories = ["Live entertainment", "Private parties"];
  const highlights = gallery.filter((g) => highlightCategories.includes(g.category)).slice(0, 12);

  return (
    <>
      <PageHeader
        eyebrow="What's on"
        title="Events & entertainment"
        intro="Karaoke nights, live DJs, live music, tournaments and game-day specials."
      />

      {weekly.length > 0 && (
        <section aria-labelledby="weekly-title" className="py-20 sm:py-24">
          <div className="container-site">
            <SectionHeading id="weekly-title" eyebrow="Every week" title="Weekly nights" />
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {weekly.map((event, i) => (
                <Reveal key={event.id} delay={(i % 3) * 90}>
                  <EventCard event={event} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      <section
        aria-labelledby="upcoming-title"
        className={`py-20 sm:py-24 ${weekly.length ? "border-t border-line bg-coal" : ""}`}
      >
        <div className="container-site">
          <SectionHeading id="upcoming-title" eyebrow="Coming up" title="Upcoming events" />
          {upcoming.length > 0 ? (
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {upcoming.map((event, i) => (
                <Reveal key={event.id} delay={(i % 3) * 90}>
                  <EventCard event={event} />
                </Reveal>
              ))}
            </div>
          ) : (
            <p className="card mt-12 p-8 text-mist">
              No special events are scheduled right now. New events are added regularly, so check back soon.
            </p>
          )}
        </div>
      </section>

      {highlights.length > 0 && (
        <section aria-labelledby="highlights-title" className="border-t border-line py-20 sm:py-24">
          <div className="container-site">
            <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
              <SectionHeading
                id="highlights-title"
                eyebrow="Past events"
                title="Event highlights"
                intro="A look at some of the nights we've hosted."
              />
              <Link href="/gallery" className="link-gold text-sm uppercase tracking-[0.16em]">
                See all photos
              </Link>
            </div>
            <Gallery images={highlights} categories={highlightCategories} />
          </div>
        </section>
      )}

      {past.length > 0 && (
        <section aria-labelledby="past-title" className="border-t border-line py-20">
          <div className="container-site">
            <h2 id="past-title" className="eyebrow mb-6">
              Past events
            </h2>
            <ul className="grid gap-x-10 sm:grid-cols-2 lg:grid-cols-3">
              {past.map((event) => (
                <li key={event.id} className="flex justify-between gap-4 border-b border-line/70 py-3 text-sm">
                  <span className="text-cream/85">{event.title}</span>
                  <span className="shrink-0 text-mist">
                    {formatShortDate(event.repeats_weekly && event.repeat_until ? event.repeat_until : event.event_date)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </>
  );
}
