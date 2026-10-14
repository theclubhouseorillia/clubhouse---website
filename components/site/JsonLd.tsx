import { real } from "@/lib/format";
import { openingHoursSchema } from "@/lib/hours";
import { hasRealAddress, siteUrl, socialLinks } from "@/lib/site";
import type { HoursRow, Settings } from "@/lib/types";

/** Structured data so search engines understand the business, address and hours. */
export function BusinessJsonLd({ settings, hours }: { settings: Settings; hours: HoursRow[] }) {
  if (!real(settings.business_name)) return null;

  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": ["BarOrPub", "SportsActivityLocation"],
    name: settings.business_name,
    url: real(settings.website_url) ?? siteUrl(),
    description: real(settings.seo_description) ?? undefined,
    telephone: real(settings.phone) ?? undefined,
    image: settings.hero_image_url ?? undefined,
    priceRange: "$$",
    openingHoursSpecification: openingHoursSchema(hours),
    sameAs: socialLinks(settings).map((s) => s.href),
  };

  if (hasRealAddress(settings)) {
    data.address = {
      "@type": "PostalAddress",
      streetAddress: settings.street_address,
      addressLocality: settings.city,
      addressRegion: real(settings.province) ?? undefined,
      postalCode: real(settings.postal_code) ?? undefined,
      addressCountry: "CA",
    };
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
