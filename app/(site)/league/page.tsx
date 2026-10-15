import type { Metadata } from "next";
import { Fragment } from "react";
import { notFound } from "next/navigation";
import { CalendarIcon, CheckIcon, ClockIcon, ExternalIcon, MailIcon, PhoneIcon } from "@/components/icons";
import { PackageCard } from "@/components/site/PackageCard";
import { Reveal } from "@/components/site/Reveal";
import { PageHeader, SectionHeading } from "@/components/site/SectionHeading";
import { SmartLink } from "@/components/site/SmartLink";
import { getLeagueOptions, getLeagueSettings, getLeagueSteps, getSettings } from "@/lib/data";
import { real, telHref } from "@/lib/format";
import { toBlocks } from "@/lib/richText";
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
  const [league, options, steps, settings] = await Promise.all([
    getLeagueSettings(),
    getLeagueOptions(),
    getLeagueSteps(),
    getSettings(),
  ]);
  if (!league.enabled) notFound();

  const emailHref = leagueEmailHref(league.email, league.email_subject);
  const hasEmail = emailHref.startsWith("mailto:");
  const signupUrl = real(league.signup_url);
  const hasSignup = !!signupUrl && /^https?:\/\//i.test(signupUrl);
  // With an online sign-up link, every join button opens it; otherwise people email (or use the contact page).
  const joinHref = hasSignup && signupUrl ? signupUrl : emailHref;
  const ctaLabel = hasSignup ? "Sign up now" : hasEmail ? "Email us to join" : "Contact us to join";
  const CtaIcon = hasSignup ? ExternalIcon : MailIcon;
  const tel = telHref(settings.phone);
  const details = toBlocks(real(league.details) ?? "");

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
            {details.length > 0 && (
              <div className="flex flex-col gap-4 text-lg leading-relaxed text-mist">
                {details.map((block, i) => (
                  <Fragment key={i}>
                    {block.kind === "heading" && (
                      <h3 className="mt-5 font-display text-2xl font-semibold text-cream">{block.text}</h3>
                    )}
                    {block.kind === "list" && (
                      <ul className="flex list-disc flex-col gap-1.5 pl-6 marker:text-gold">
                        {block.items.map((item, j) => (
                          <li key={j}>{item}</li>
                        ))}
                      </ul>
                    )}
                    {block.kind === "paragraph" && <p className="whitespace-pre-line">{block.text}</p>}
                  </Fragment>
                ))}
              </div>
            )}
            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              <SmartLink href={joinHref} className="btn btn-gold">
                <CtaIcon width={18} height={18} />
                {ctaLabel}
              </SmartLink>
              {hasSignup && (
                <SmartLink href={emailHref} className="btn btn-outline">
                  <MailIcon width={18} height={18} />
                  Questions? Contact us
                </SmartLink>
              )}
            </div>
          </Reveal>

          {league.highlights.length > 0 && (
            <Reveal delay={100} className="lg:self-start">
              <div className="card flex flex-col gap-5 p-7 sm:p-9">
                <h3 className="font-display text-2xl font-semibold text-cream">League details</h3>
                <ul className="flex flex-col gap-4">
                  {league.highlights.map((h) => (
                    <li key={h} className="flex gap-3 text-lg text-cream/90">
                      <CheckIcon width={20} height={20} className="mt-1 shrink-0 text-gold" />
                      {h}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          )}
        </div>
      </section>

      {options.length > 0 && (
        <section aria-labelledby="league-pricing-title" className="border-t border-line bg-coal py-20 sm:py-28">
          <div className="container-site">
            <SectionHeading id="league-pricing-title" eyebrow="Pricing" title="League fee" />
            <div
              className={`mt-14 grid gap-6 ${
                options.length >= 3 ? "lg:grid-cols-3" : options.length === 2 ? "md:grid-cols-2" : "max-w-xl"
              }`}
            >
              {options.map((option, i) => (
                <Reveal key={option.id} delay={i * 90}>
                  <PackageCard pkg={option} cta={{ href: joinHref, label: ctaLabel }} />
                </Reveal>
              ))}
            </div>
            {real(league.note) && <p className="mt-8 text-sm text-mist">{league.note}</p>}
          </div>
        </section>
      )}

      {steps.length > 0 && (
        <section
          id="sign-up"
          aria-labelledby="league-signup-title"
          className="scroll-mt-28 border-t border-line py-20 sm:py-24"
        >
          <div className="container-site grid gap-12 lg:grid-cols-[1fr_1.4fr] lg:gap-20">
            <Reveal className="flex flex-col gap-6">
              <SectionHeading
                id="league-signup-title"
                eyebrow="Step by step"
                title="How to sign up & pay"
                intro="It only takes a few minutes. Follow these steps on your phone."
              />
              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
                <SmartLink href={joinHref} className="btn btn-gold">
                  <CtaIcon width={18} height={18} />
                  {ctaLabel}
                </SmartLink>
                {tel && (
                  <a href={tel} className="btn btn-outline">
                    <PhoneIcon width={18} height={18} />
                    Questions? Call us
                  </a>
                )}
              </div>
            </Reveal>

            <Reveal delay={100}>
              <ol className="flex flex-col">
                {steps.map((step, i) => (
                  <li key={step.id} className="relative flex gap-5 pb-9 last:pb-0">
                    {i < steps.length - 1 && (
                      <span aria-hidden="true" className="absolute bottom-0 left-6 top-12 w-px bg-gold/35" />
                    )}
                    <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-gold/60 bg-ink font-display text-xl font-semibold text-gold">
                      <span className="sr-only">Step </span>
                      {i + 1}
                    </span>
                    <div className="flex flex-col gap-2 pt-2">
                      <h3 className="font-display text-2xl font-semibold leading-tight text-cream">{step.title}</h3>
                      {real(step.description) && <p className="leading-relaxed text-mist">{step.description}</p>}
                    </div>
                  </li>
                ))}
              </ol>
            </Reveal>
          </div>
        </section>
      )}

      <section className="py-20 sm:py-24">
        <div className="container-site">
          <div className="flex flex-col items-start justify-between gap-8 border border-gold/40 bg-forest p-8 sm:p-12 lg:flex-row lg:items-center">
            <div className="flex flex-col gap-3">
              <h2 className="font-display text-4xl font-semibold text-cream">Ready to play?</h2>
              <p className="max-w-xl text-cream/85">
                {hasSignup
                  ? "Sign up online in a couple of minutes. Spots are limited, so grab yours early."
                  : "Send us a quick email with your name, phone number and whether you’re joining solo or with a team."}
              </p>
            </div>
            <SmartLink href={joinHref} className="btn btn-gold">
              <CtaIcon width={18} height={18} />
              {ctaLabel}
            </SmartLink>
          </div>
        </div>
      </section>
    </>
  );
}
