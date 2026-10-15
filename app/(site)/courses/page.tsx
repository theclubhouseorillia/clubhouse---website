import type { Metadata } from "next";
import Link from "next/link";
import { FlagIcon } from "@/components/icons";
import { Reveal } from "@/components/site/Reveal";
import { PageHeader } from "@/components/site/SectionHeading";
import { SmartImage } from "@/components/site/SmartImage";
import { SmartLink } from "@/components/site/SmartLink";
import { getCourses, getSettings } from "@/lib/data";
import { real } from "@/lib/format";
import { bookingLink } from "@/lib/site";

export const metadata: Metadata = {
  title: "Courses You Can Play",
  description:
    "Play famous golf courses like St Andrews, Royal Troon, Pebble Beach and Pinehurst No. 2 on our Trackman simulators in Orillia.",
  alternates: { canonical: "/courses" },
};

export default async function CoursesPage() {
  const [courses, settings] = await Promise.all([getCourses(), getSettings()]);
  const booking = bookingLink(settings);

  return (
    <>
      <PageHeader
        eyebrow="Trackman courses"
        title="Play the world's great courses"
        intro="A few of the famous courses you can play on our Trackman simulators. Ask us about the full course library when you book."
      />

      <section aria-label="Courses" className="py-20 sm:py-24">
        <div className="container-site">
          {courses.length > 0 ? (
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((course, i) => (
                <li key={course.id}>
                  <Reveal delay={(i % 3) * 80} className="h-full">
                    <article className="card flex h-full flex-col overflow-hidden">
                      {course.image_url ? (
                        <div className="relative aspect-[16/10] border-b border-line">
                          <SmartImage
                            src={course.image_url}
                            alt={`${course.name} on our simulator`}
                            sizes="(min-width: 1024px) 30vw, (min-width: 640px) 50vw, 100vw"
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="relative flex h-28 items-end justify-between overflow-hidden border-b border-line bg-forest px-6 pb-4">
                          <div className="dimples pointer-events-none absolute inset-0 opacity-30" aria-hidden="true" />
                          <span className="relative font-display text-4xl font-semibold leading-none text-gold" aria-hidden="true">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <FlagIcon width={30} height={30} className="relative text-gold-2" />
                        </div>
                      )}
                      <div className="flex flex-1 flex-col gap-2 p-6 sm:p-7">
                        {real(course.location) && (
                          <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold-2">{course.location}</p>
                        )}
                        <h2 className="font-display text-2xl font-semibold leading-tight text-cream">{course.name}</h2>
                        {real(course.description) && <p className="leading-relaxed text-mist">{course.description}</p>}
                      </div>
                    </article>
                  </Reveal>
                </li>
              ))}
            </ul>
          ) : (
            <p className="card max-w-2xl p-8 text-lg text-mist">Ask us about the courses you can play when you book.</p>
          )}
          <p className="mt-10 text-sm text-mist">Course names belong to their respective owners.</p>
        </div>
      </section>

      <section className="border-t border-line bg-coal py-16 sm:py-20">
        <div className="container-site flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
          <div className="flex flex-col gap-2">
            <h2 className="font-display text-3xl font-semibold text-cream">Pick a course and tee off</h2>
            <p className="max-w-xl text-mist">Book a bay and choose your course when you arrive.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <SmartLink href={booking.href} className="btn btn-gold">
              Book a Simulator
            </SmartLink>
            <Link href="/pricing" className="btn btn-outline">
              Simulator pricing
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
