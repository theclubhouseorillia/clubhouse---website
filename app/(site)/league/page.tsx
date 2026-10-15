import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CalendarIcon, CheckIcon, ClockIcon, MailIcon } from "@/components/icons";
import { PackageCard } from "@/components/site/PackageCard";
import { Reveal } from "@/components/site/Reveal";
import { PageHeader, SectionHeading } from "@/components/site/SectionHeading";
import { SmartLink } from "@/components/site/SmartLink";
import { getLeagueOptions, getLeagueSettings } from "@/lib/data";
import { real } from "@/lib/format";
import { leagueEmailHref } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const league = await getLeagueSettings();
  return {
    title: league.title,
    description:
      real(league.intro)?.slice(0, 160) ?? "Join our winter golf league on Trackman iO simulators. All skill levels welcome.",
    alternates: { canonical: "/league" },
  };
}

export default async function LeaguePage() {
  const [league, options] = await Promise.all([getLeagueSettings(), getLeagueOptions()]);
  if (!league.enabled) notFound();

  const emailHref = leagueEmailHref(league.email, league.email_subject);
  const hasEmail = emailHref.startsWith("mailto:");
  const ctaLabel = hasEmail ? "Email us to join" : "Contact us to join";

  return (
    <>
      <PageHeader eyebrow="Leagues" title={league.title} intro={league.intro} />

      <section aria-labelledby="league-details-title" className="py-20 sm:py-24">
        <div className="container-site grid gap-12 lg:grid-cols-[1fr_1.2fr] lg:gap-20">
          <Reveal className="flex flex-col gap-6">
            <SectionHeading id="league-details-title" eyebrow="The details" title="How it works" />
            <dl className="flex flex-col gap-4">
              {league.season && (
                <div className="flex gap-3">
                  <CalendarIcon className="mt-1 shrink-0 text-gold" />
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-mist">Season</dt>
                    <dd className="text-lg text-cream">{league.season}</dd>
                  </div>
                </div>
              )}
              {league.schedule && (
                <div className="flex gap-3">
                  <ClockIcon className="mt-1 shrink-0 text-gold" />
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-mist">When we play</dt>
                    <dd className="text-lg text-cream">{league.schedule}</dd>
                  </div>
                </div>
              )}
            </dl>
            <div>
              <SmartLink href={emailHref} className="btn btn-gold">
                <MailIcon width={18} height={18} />
                {ctaLabel}
              </SmartLink>
            </div>
          </Reveal>

          {league.highlights.length > 0 && (
            <Reveal delay={100}>
              <ul className="card flex flex-col gap-4 p-7 sm:p-9">
                {league.highlights.map((h) => (
                  <li key={h} className="flex gap-3 text-lg text-cream/90">
                    <CheckIcon width={20} height={20} className="mt-1 shrink-0 text-gold" />
                    {h}
                  </li>
                ))}
              </ul>
            </Reveal>
          )}
        </div>
      </section>

      {options.length > 0 && (
        <section aria-labelledby="league-pricing-title" className="border-t border-line bg-coal py-20 sm:py-28">
          <div className="container-site">
            <SectionHeading id="league-pricing-title" eyebrow="Pricing" title="Join the league" />
            <div
              className={`mt-14 grid gap-6 ${
                options.length >= 3 ? "lg:grid-cols-3" : options.length === 2 ? "md:grid-cols-2" : "max-w-xl"
              }`}
            >
              {options.map((option, i) => (
                <Reveal key={option.id} delay={i * 90}>
                  <PackageCard pkg={option} cta={{ href: emailHref, label: ctaLabel }} />
                </Reveal>
              ))}
            </div>
            {real(league.note) && <p className="mt-8 text-sm text-mist">{league.note}</p>}
          </div>
        </section>
      )}

      <section className="py-20 sm:py-24">
        <div className="container-site">
          <div className="flex flex-col items-start justify-between gap-8 border border-gold/40 bg-forest p-8 sm:p-12 lg:flex-row lg:items-center">
            <div className="flex flex-col gap-3">
              <h2 className="font-display text-4xl font-semibold text-cream">Ready to play?</h2>
              <p className="max-w-xl text-cream/85">
                Send us a quick email with your name, phone number and whether you&apos;re joining solo or with a team.
              </p>
            </div>
            <SmartLink href={emailHref} className="btn btn-gold">
              <MailIcon width={18} height={18} />
              {ctaLabel}
            </SmartLink>
          </div>
        </div>
      </section>
    </>
  );
}
