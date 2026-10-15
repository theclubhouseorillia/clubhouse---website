import type { Metadata } from "next";
import { MailIcon, PhoneIcon } from "@/components/icons";
import { InquiryForm } from "@/components/site/InquiryForm";
import { PackageCard } from "@/components/site/PackageCard";
import { Reveal } from "@/components/site/Reveal";
import { PageHeader, SectionHeading } from "@/components/site/SectionHeading";
import { getKidsPackages, getSettings } from "@/lib/data";
import { real, telHref } from "@/lib/format";

export const metadata: Metadata = {
  title: "Kids' Birthday Parties",
  description: "Golf simulator birthday parties for kids in Orillia. Tell us about your party and we'll put together the right package.",
  alternates: { canonical: "/kids-parties" },
};

const STEPS = [
  { title: "Tell us about the party", text: "Send us the date, the number of kids and any questions using the form below." },
  { title: "We’ll confirm the details", text: "We’ll get back to you with availability and pricing." },
  { title: "Party time", text: "Bring the birthday crew and tee off on our simulators." },
];

export default async function KidsPartiesPage() {
  const [packages, settings] = await Promise.all([getKidsPackages(), getSettings()]);
  const phone = real(settings.phone);
  const tel = telHref(settings.phone);
  const email = real(settings.public_email);
  const packageNames = packages.length ? packages.map((p) => p.name) : ["Kids’ birthday party"];

  return (
    <>
      <PageHeader
        eyebrow="Kids' parties"
        title="Kids' birthday parties"
        intro="Golf simulator birthday parties for kids. Tell us about your party and we'll put together the right package."
      />

      <section aria-labelledby="kids-how-title" className="py-20 sm:py-24">
        <div className="container-site">
          <SectionHeading id="kids-how-title" eyebrow="How it works" title="Planning is easy" />
          <ol className="mt-12 grid gap-6 md:grid-cols-3">
            {STEPS.map((step, i) => (
              <li key={step.title}>
                <Reveal delay={i * 90} className="card flex h-full flex-col gap-3 p-7">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full border border-gold/60 bg-ink font-display text-xl font-semibold text-gold">
                    <span className="sr-only">Step </span>
                    {i + 1}
                  </span>
                  <h3 className="font-display text-2xl font-semibold text-cream">{step.title}</h3>
                  <p className="leading-relaxed text-mist">{step.text}</p>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {packages.length > 0 && (
        <section aria-labelledby="kids-packages-title" className="border-t border-line py-20 sm:py-24">
          <div className="container-site">
            <SectionHeading id="kids-packages-title" eyebrow="Packages" title="Party packages" />
            <div
              className={`mt-14 grid gap-6 ${
                packages.length >= 3 ? "lg:grid-cols-3" : packages.length === 2 ? "md:grid-cols-2" : "max-w-xl"
              }`}
            >
              {packages.map((pkg, i) => (
                <Reveal key={pkg.id} delay={i * 90}>
                  <PackageCard
                    pkg={pkg}
                    cta={{ href: `/kids-parties?package=${encodeURIComponent(pkg.name)}#inquire`, label: "Inquire about this package" }}
                  />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      <section id="inquire" aria-labelledby="kids-inquire-title" className="scroll-mt-24 border-t border-line bg-coal py-20 sm:py-28">
        <div className="container-site grid gap-12 lg:grid-cols-[1fr_1.4fr] lg:gap-20">
          <div className="flex flex-col gap-8">
            <SectionHeading
              id="kids-inquire-title"
              eyebrow="Party inquiry"
              title="Let's plan the party"
              intro="Send us a few details and we'll be in touch to confirm availability and pricing."
            />
            <div className="flex flex-col gap-3 text-mist">
              {tel && phone && (
                <a href={tel} className="inline-flex items-center gap-3 text-lg transition hover:text-gold-2">
                  <PhoneIcon className="text-gold" />
                  {phone}
                </a>
              )}
              {email && (
                <a href={`mailto:${email}`} className="inline-flex items-center gap-3 break-all transition hover:text-gold-2">
                  <MailIcon className="text-gold" />
                  {email}
                </a>
              )}
            </div>
          </div>
          <div className="card p-6 sm:p-10">
            <InquiryForm kind="event" topic="kids-party" packages={packageNames} />
          </div>
        </div>
      </section>
    </>
  );
}
