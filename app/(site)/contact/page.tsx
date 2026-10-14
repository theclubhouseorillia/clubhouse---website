import type { Metadata } from "next";
import Link from "next/link";
import { ExternalIcon, MailIcon, MapPinIcon, PhoneIcon } from "@/components/icons";
import { HoursList } from "@/components/site/HoursList";
import { InquiryForm } from "@/components/site/InquiryForm";
import { PhotoSlot } from "@/components/site/PhotoSlot";
import { PageHeader } from "@/components/site/SectionHeading";
import { getHours, getSettings, getSpecialHours } from "@/lib/data";
import { real, telHref } from "@/lib/format";
import { addressLines, directionsUrl, mapsEmbedUrl, socialLinks } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact & Directions",
  description: "Address, phone number, hours and directions. Send us a message or plan a private event.",
  alternates: { canonical: "/contact" },
};

export default async function ContactPage() {
  const [settings, hours, special] = await Promise.all([getSettings(), getHours(), getSpecialHours()]);
  const phone = real(settings.phone);
  const tel = telHref(settings.phone);
  const email = real(settings.public_email);
  const website = real(settings.website_url);
  const socials = socialLinks(settings);
  const mapUrl = mapsEmbedUrl(settings);
  const directions = directionsUrl(settings);

  return (
    <>
      <PageHeader eyebrow="Contact" title="Get in touch" intro="Questions, bookings or event ideas: we'd love to hear from you." />

      <section className="py-16 sm:py-24">
        <div className="container-site grid gap-12 lg:grid-cols-[1fr_1.3fr] lg:gap-16">
          <div className="flex flex-col gap-10">
            <div className="flex flex-col gap-5">
              <h2 className="font-display text-3xl font-semibold text-cream">{settings.business_name}</h2>
              <address className="flex flex-col gap-4 not-italic text-mist">
                <span className="flex gap-3">
                  <MapPinIcon className="mt-0.5 shrink-0 text-gold" />
                  <span>
                    {addressLines(settings).map((l) => (
                      <span key={l} className="block">
                        {l}
                      </span>
                    ))}
                  </span>
                </span>
                {tel && phone && (
                  <a href={tel} className="flex items-center gap-3 text-lg text-cream transition hover:text-gold-2">
                    <PhoneIcon className="shrink-0 text-gold" />
                    {phone}
                  </a>
                )}
                {email && (
                  <a href={`mailto:${email}`} className="flex items-center gap-3 break-all transition hover:text-gold-2">
                    <MailIcon className="shrink-0 text-gold" />
                    {email}
                  </a>
                )}
                {website && (
                  <a href={website} className="flex items-center gap-3 break-all transition hover:text-gold-2">
                    <ExternalIcon className="shrink-0 text-gold" />
                    {website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                  </a>
                )}
              </address>
              <div className="flex flex-wrap gap-3">
                {tel && (
                  <a href={tel} className="btn btn-gold">
                    <PhoneIcon width={16} height={16} />
                    Call us
                  </a>
                )}
                <Link href="/private-events#inquire" className="btn btn-outline">
                  Private event inquiry
                </Link>
              </div>
              {socials.length > 0 && (
                <ul className="flex flex-wrap gap-2" aria-label="Social media">
                  {socials.map((s) => (
                    <li key={s.label}>
                      <a
                        href={s.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-11 items-center rounded-sm border border-line px-4 text-sm transition hover:border-gold hover:text-gold-2"
                      >
                        {s.label}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <h2 className="eyebrow mb-4">{real(settings.hours_season_label) ?? "Hours"}</h2>
              <HoursList hours={hours} special={special} />
            </div>
          </div>

          <div className="card h-fit p-6 sm:p-10">
            <h2 className="mb-6 font-display text-3xl font-semibold text-cream">Send us a message</h2>
            <InquiryForm kind="contact" />
          </div>
        </div>
      </section>

      <section aria-label="Map" className="border-t border-line">
        {mapUrl ? (
          <div className="relative">
            <iframe
              title={`Map showing the location of ${settings.business_name}`}
              src={mapUrl}
              className="block h-[420px] w-full border-0 grayscale-[35%] invert-[90%] hue-rotate-180"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
            {directions && (
              <a
                href={directions}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-gold absolute bottom-5 left-5 shadow-xl"
              >
                Get directions
              </a>
            )}
          </div>
        ) : (
          <PhotoSlot src={null} alt="" label="Map appears once your address is added" className="h-[320px]" />
        )}
      </section>
    </>
  );
}
