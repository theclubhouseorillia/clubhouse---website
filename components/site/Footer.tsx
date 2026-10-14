import Link from "next/link";
import { ClockIcon, MailIcon, MapPinIcon, PhoneIcon } from "@/components/icons";
import { real, telHref } from "@/lib/format";
import { groupHours } from "@/lib/hours";
import { NAV_LINKS, addressLines, directionsUrl, socialLinks } from "@/lib/site";
import type { HoursRow, Settings } from "@/lib/types";

export function Footer({ settings, hours }: { settings: Settings; hours: HoursRow[] }) {
  const phone = real(settings.phone);
  const tel = telHref(settings.phone);
  const email = real(settings.public_email);
  const socials = socialLinks(settings);
  const directions = directionsUrl(settings);
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-line bg-coal pb-24 md:pb-0">
      <div className="container-site grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:py-20">
        <div className="flex flex-col gap-5">
          <p className="font-display text-3xl font-semibold uppercase tracking-[0.06em] text-cream">{settings.business_name}</p>
          {real(settings.slogan) && settings.show_slogan && <p className="max-w-sm text-mist">{settings.slogan}</p>}
          {socials.length > 0 && (
            <ul className="flex flex-wrap gap-2" aria-label="Social media">
              {socials.map((s) => (
                <li key={s.label}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 items-center rounded-sm border border-line px-4 text-sm text-cream/90 transition hover:border-gold hover:text-gold-2"
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h2 className="eyebrow mb-5">Visit</h2>
          <address className="flex flex-col gap-3 not-italic text-mist">
            <span className="flex gap-3">
              <MapPinIcon className="mt-0.5 shrink-0 text-gold" />
              <span>
                {addressLines(settings).map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
                {directions && (
                  <a href={directions} target="_blank" rel="noopener noreferrer" className="link-gold mt-1 inline-block text-sm">
                    Get directions
                  </a>
                )}
              </span>
            </span>
            {tel && phone && (
              <a href={tel} className="flex items-center gap-3 transition hover:text-gold-2">
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
          </address>
        </div>

        <div>
          <h2 className="eyebrow mb-5 flex items-center gap-2">
            <ClockIcon width={16} height={16} />
            {real(settings.hours_season_label) ?? "Hours"}
          </h2>
          <dl className="flex flex-col gap-2 text-sm">
            {groupHours(hours).map((line) => (
              <div key={line.label} className="flex flex-col">
                <dt className="text-cream">{line.label}</dt>
                <dd className="text-mist">{line.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <nav aria-label="Footer">
          <h2 className="eyebrow mb-5">Explore</h2>
          <ul className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="inline-block py-1.5 text-mist transition hover:text-gold-2">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="border-t border-line">
        <div className="container-site flex flex-col gap-2 py-6 text-xs text-mist/80 sm:flex-row sm:justify-between">
          <p>
            © {year} {settings.business_name}. All rights reserved.
          </p>
          <p>Prices are in Canadian dollars and before applicable taxes.</p>
        </div>
      </div>
    </footer>
  );
}
