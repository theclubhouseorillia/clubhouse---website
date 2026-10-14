import type { ReactNode } from "react";
import { AnnouncementBar } from "@/components/site/AnnouncementBar";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { BusinessJsonLd } from "@/components/site/JsonLd";
import { MobileBookBar } from "@/components/site/MobileBookBar";
import { getAnnouncements, getHours, getSettings } from "@/lib/data";
import { real, telHref } from "@/lib/format";
import { bookingLink } from "@/lib/site";

// Pages are cached for speed and refreshed every 5 minutes. Saving anything in
// the admin dashboard refreshes them immediately.
export const revalidate = 300;

export default async function SiteLayout({ children }: { children: ReactNode }) {
  const [settings, announcements, hours] = await Promise.all([getSettings(), getAnnouncements(), getHours()]);
  const booking = bookingLink(settings);
  const phoneHref = telHref(settings.phone);

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-sm focus:bg-gold focus:px-4 focus:py-3 focus:text-ink"
      >
        Skip to main content
      </a>
      <AnnouncementBar items={announcements} />
      <Header
        businessName={settings.business_name}
        logoUrl={settings.logo_url}
        booking={booking}
        phoneHref={phoneHref}
        phoneLabel={real(settings.phone)}
      />
      <main id="main" tabIndex={-1} className="outline-none">
        {children}
      </main>
      <Footer settings={settings} hours={hours} />
      <MobileBookBar booking={booking} phoneHref={phoneHref} />
      <BusinessJsonLd settings={settings} hours={hours} />
    </>
  );
}
