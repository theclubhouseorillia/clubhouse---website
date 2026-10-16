import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { MailIcon, PhoneIcon } from "@/components/icons";
import { PackageCard } from "@/components/site/PackageCard";
import { Reveal } from "@/components/site/Reveal";
import { PageHeader, SectionHeading } from "@/components/site/SectionHeading";
import { getMembershipPlans, getSettings } from "@/lib/data";
import { real, telHref } from "@/lib/format";
import { planDays } from "@/lib/member-emails";

interface ExpectStep {
  when: string;
  title: string;
  body: string;
  email?: { from: string; subject: string };
  extra?: ReactNode;
}

function EmailChip({ from, subject }: { from: string; subject: string }) {
  return (
    <div className="mt-1 flex items-start gap-3 rounded-[4px] border border-line bg-coal px-4 py-3">
      <MailIcon width={18} height={18} className="mt-0.5 shrink-0 text-gold" aria-hidden="true" />
      <div className="min-w-0 text-sm leading-snug">
        <p className="font-semibold text-cream">{from}</p>
        <p className="text-mist">{subject}</p>
      </div>
    </div>
  );
}

export const metadata: Metadata = {
  title: "Memberships & Hour Packs",
  description: "Play more often with prepaid golf simulator hours or a monthly membership at The Clubhouse in Orillia.",
  alternates: { canonical: "/memberships" },
};

export default async function MembershipsPage() {
  const [plans, settings] = await Promise.all([getMembershipPlans(), getSettings()]);
  const phone = real(settings.phone);
  const tel = telHref(settings.phone);
  const email = real(settings.public_email);
  const mailHref = email
    ? `mailto:${email}?subject=${encodeURIComponent("Membership / hour pack inquiry")}&body=${encodeURIComponent("Hi! I'm interested in:\n\nMy name and phone number:\n")}`
    : null;
  const callToBuy = tel
    ? { href: tel, label: "Call to buy" }
    : mailHref
      ? { href: mailHref, label: "Email to buy" }
      : { href: "/contact", label: "Contact us" };
  // Plans with a Stripe Payment Link go straight to checkout; the rest keep "Call to buy".
  const sellsOnline = plans.some((p) => p.buy_url);
  const hasMonthly = plans.some((p) => p.buy_url && /month/i.test(`${p.price_note ?? ""} ${p.price_label}`));
  const portal = settings.membership_portal_url;
  const business = real(settings.business_name) ?? "The Clubhouse Bar & Golf Sim";
  const bookingUrl = real(settings.booking_url);
  const memberDays = plans
    .filter((p) => /month/i.test(`${p.price_note ?? ""} ${p.price_label}`))
    .map((p) => ({ name: p.name, days: planDays(p.name) }))
    .filter((p): p is { name: string; days: string } => !!p.days);

  const expectSteps: ExpectStep[] = [
    {
      when: "Right away",
      title: "Your receipt",
      body: "Stripe emails your payment receipt as soon as you check out.",
      email: { from: "Stripe", subject: `Your receipt from ${business}` },
    },
    {
      when: "Right away",
      title: "Create your booking account",
      body: "Our welcome email has a “Create my booking account” button. We take bay bookings through YourGolfBooking, so sign up there using the same email address you used at checkout.",
      email: { from: business, subject: "Welcome to The Clubhouse! Set up your booking account" },
    },
    {
      when: "Within 24 hours",
      title: "Your personal member code",
      body: "We set up a code just for you and email it within 24 hours. It's good for one month from the day you bought your membership.",
      email: { from: business, subject: "Your Clubhouse member code" },
    },
    {
      when: "Whenever you play",
      title: "Book an Open Bay",
      body: "Sign in on our booking page, pick an Open Bay time, up to 2 hours a day, and enter your member code at checkout.",
      extra: (
        <>
          {memberDays.length > 0 && (
            <ul className="flex flex-col gap-1 text-sm text-mist">
              {memberDays.map((p) => (
                <li key={p.name}>
                  <span className="text-cream">{p.name}:</span> {p.days}
                </li>
              ))}
            </ul>
          )}
          {bookingUrl && (
            <a href={bookingUrl} target="_blank" rel="noopener noreferrer" className="link-gold mt-1 w-fit text-sm uppercase tracking-[0.14em]">
              Open the booking page
            </a>
          )}
        </>
      ),
    },
    {
      when: "Every month",
      title: "A new code each month",
      body: "Each time your membership renews, we email you a new member code for the month ahead. Need to update your card or cancel? Use “Manage my membership” any time.",
      email: { from: business, subject: "Your Clubhouse member code" },
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Memberships"
        title="Memberships & hour packs"
        intro="Play more often with prepaid simulator hours or a monthly membership."
      />

      <section aria-labelledby="plans-title" className="py-20 sm:py-24">
        <div className="container-site">
          <h2 id="plans-title" className="sr-only">
            Plans
          </h2>
          {plans.length > 0 ? (
            <div
              className={`grid gap-6 ${plans.length >= 3 ? "lg:grid-cols-3" : plans.length === 2 ? "md:grid-cols-2" : "max-w-xl"}`}
            >
              {plans.map((plan, i) => (
                <Reveal key={plan.id} delay={i * 90}>
                  <PackageCard
                    pkg={plan}
                    cta={plan.buy_url ? { href: plan.buy_url, label: plan.buy_label ?? "Buy now" } : callToBuy}
                  />
                </Reveal>
              ))}
            </div>
          ) : (
            <p className="card max-w-2xl p-8 text-lg text-mist">
              Memberships and hour packs are coming soon. Give us a call to ask about them.
            </p>
          )}
          {sellsOnline && (
            <p className="mt-10 max-w-3xl text-sm leading-relaxed text-mist">
              Secure online checkout by Stripe. Prices are plus HST.
              {hasMonthly &&
                " Memberships renew monthly until you cancel, and you can cancel anytime online. Your membership stays active until the end of the month you've paid for."}
              {portal && (
                <>
                  {" "}
                  Already a member?{" "}
                  <a href={portal} target="_blank" rel="noopener noreferrer" className="link-gold">
                    Manage your membership
                  </a>
                  .
                </>
              )}{" "}
              <a href="#what-to-expect" className="link-gold">
                See what happens after you buy
              </a>
              .
            </p>
          )}
        </div>
      </section>

      {sellsOnline && (
        <section
          id="what-to-expect"
          aria-labelledby="expect-title"
          className="scroll-mt-28 border-t border-line py-20 sm:py-24"
        >
          <div className="container-site grid gap-12 lg:grid-cols-[1fr_1.4fr] lg:gap-20">
            <Reveal className="flex flex-col gap-6 lg:sticky lg:top-28 lg:self-start">
              <SectionHeading
                id="expect-title"
                eyebrow="After you buy"
                title="What to expect in your inbox"
                intro="Here's every email you'll get from us after you join, and what to do with each one."
              />
              <div className="card flex flex-col gap-2 p-6">
                <p className="font-display text-xl font-semibold text-cream">Buying the 10-hour pack?</p>
                <p className="leading-relaxed text-mist">
                  You'll get the receipt and the welcome email too. Once your booking account is set up, we'll add your
                  10 Open Bay hours and let you know.
                </p>
              </div>
              <p className="text-sm leading-relaxed text-mist">
                Can't find our emails? Check your spam or promotions folder for messages from {business}.
                {phone && tel && (
                  <>
                    {" "}
                    Still nothing? Call us at{" "}
                    <a href={tel} className="link-gold">
                      {phone}
                    </a>
                    .
                  </>
                )}
              </p>
            </Reveal>

            <Reveal delay={100}>
              <ol className="flex flex-col">
                {expectSteps.map((step, i) => (
                  <li key={step.title} className="relative flex gap-5 pb-9 last:pb-0">
                    {i < expectSteps.length - 1 && (
                      <span aria-hidden="true" className="absolute bottom-0 left-6 top-12 w-px bg-gold/35" />
                    )}
                    <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-gold/60 bg-ink font-display text-xl font-semibold text-gold">
                      <span className="sr-only">Step </span>
                      {i + 1}
                    </span>
                    <div className="flex min-w-0 flex-1 flex-col gap-2 pt-1">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold">{step.when}</p>
                      <h3 className="font-display text-2xl font-semibold leading-tight text-cream">{step.title}</h3>
                      <p className="leading-relaxed text-mist">{step.body}</p>
                      {step.email && <EmailChip from={step.email.from} subject={step.email.subject} />}
                      {step.extra}
                    </div>
                  </li>
                ))}
              </ol>
            </Reveal>
          </div>
        </section>
      )}

      <section aria-labelledby="buy-title" className="border-t border-line bg-coal py-20 sm:py-24">
        <div className="container-site grid items-center gap-10 lg:grid-cols-[1.2fr_1fr]">
          {sellsOnline ? (
            <SectionHeading
              id="buy-title"
              eyebrow="How to buy"
              title="Buy online in minutes"
              intro="Choose a plan above and pay securely online. Your receipt and welcome email arrive right away. Prefer to talk to us? Call, email or ask at the bar."
            />
          ) : (
            <SectionHeading
              id="buy-title"
              eyebrow="How to buy"
              title="Call, email or ask at the bar"
              intro="Tell us which plan you'd like and we'll get you set up."
            />
          )}
          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col lg:items-end xl:flex-row xl:justify-end">
            {tel && phone && (
              <a href={tel} className="btn btn-gold">
                <PhoneIcon width={18} height={18} />
                {phone}
              </a>
            )}
            {mailHref && (
              <a href={mailHref} className="btn btn-outline">
                <MailIcon width={18} height={18} />
                Email us
              </a>
            )}
            {portal && (
              <a href={portal} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
                Manage my membership
              </a>
            )}
            <Link href="/pricing" className="btn btn-outline">
              Hourly pricing
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
