import type { Metadata } from "next";
import Link from "next/link";
import { MailIcon, PhoneIcon } from "@/components/icons";
import { PackageCard } from "@/components/site/PackageCard";
import { Reveal } from "@/components/site/Reveal";
import { PageHeader, SectionHeading } from "@/components/site/SectionHeading";
import { getMembershipPlans, getSettings } from "@/lib/data";
import { real, telHref } from "@/lib/format";

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
  const buy = tel ? { href: tel, label: "Call to buy" } : mailHref ? { href: mailHref, label: "Email to buy" } : { href: "/contact", label: "Contact us" };

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
                  <PackageCard pkg={plan} cta={buy} />
                </Reveal>
              ))}
            </div>
          ) : (
            <p className="card max-w-2xl p-8 text-lg text-mist">
              Memberships and hour packs are coming soon. Give us a call to ask about them.
            </p>
          )}
        </div>
      </section>

      <section aria-labelledby="buy-title" className="border-t border-line bg-coal py-20 sm:py-24">
        <div className="container-site grid items-center gap-10 lg:grid-cols-[1.2fr_1fr]">
          <SectionHeading
            id="buy-title"
            eyebrow="How to buy"
            title="Call, email or ask at the bar"
            intro="Tell us which plan you'd like and we'll get you set up."
          />
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
            <Link href="/pricing" className="btn btn-outline">
              Hourly pricing
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
