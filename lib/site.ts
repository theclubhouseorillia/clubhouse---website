import { isPlaceholder, real, telHref } from "./format";
import type { Settings } from "./types";

export interface LinkTarget {
  href: string;
  external: boolean;
}

/** Where every "Book" button goes. Uses the booking link from Admin → Settings. */
export function bookingLink(settings: Settings): LinkTarget {
  const url = real(settings.booking_url);
  if (url) return { href: url, external: /^https?:\/\//i.test(url) };
  const tel = telHref(settings.phone);
  if (tel) return { href: tel, external: false };
  return { href: "/contact", external: false };
}

export function addressLines(settings: Settings): string[] {
  const cityLine = [settings.city, settings.province].filter((p) => p && p.trim()).join(", ");
  return [
    settings.street_address ?? "",
    [cityLine, settings.postal_code ?? ""].filter((p) => p && p.trim()).join(" "),
  ].filter((l) => l.trim());
}

/** True once a real street address and city have been entered. */
export function hasRealAddress(settings: Settings): boolean {
  return !isPlaceholder(settings.street_address) && !isPlaceholder(settings.city);
}

export function fullAddress(settings: Settings): string {
  return addressLines(settings).join(", ");
}

export function mapsEmbedUrl(settings: Settings): string | null {
  if (!hasRealAddress(settings)) return null;
  const q = `${settings.business_name}, ${fullAddress(settings)}`;
  return `https://www.google.com/maps?q=${encodeURIComponent(q)}&output=embed`;
}

export function directionsUrl(settings: Settings): string | null {
  if (!hasRealAddress(settings)) return null;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(fullAddress(settings))}`;
}

export function socialLinks(settings: Settings): { label: string; href: string }[] {
  return [
    { label: "Facebook", href: settings.facebook_url },
    { label: "Instagram", href: settings.instagram_url },
    { label: "TikTok", href: settings.tiktok_url },
  ]
    .filter((s): s is { label: string; href: string } => !!real(s.href))
    .map((s) => ({ label: s.label, href: s.href.trim() }));
}

export function siteUrl(): string {
  const raw = (process.env.NEXT_PUBLIC_SITE_URL ?? "").trim().replace(/\/+$/, "");
  if (!raw) return "http://localhost:3000";
  return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
}

export const NAV_LINKS = [
  { href: "/pricing", label: "Simulators & Pricing" },
  { href: "/league", label: "Winter League" },
  { href: "/events", label: "Events" },
  { href: "/private-events", label: "Private Events" },
  { href: "/menu", label: "Food & Drink" },
  { href: "/gallery", label: "Gallery" },
  { href: "/contact", label: "Contact" },
] as const;

/** Menu links, leaving out the league page when it's switched off. */
export function navLinks(showLeague: boolean) {
  return NAV_LINKS.filter((l) => showLeague || l.href !== "/league");
}

/** "Email us to join" link for the league, with the subject and a few prompts filled in. */
export function leagueEmailHref(email: string | null, subject: string | null): string {
  const address = real(email);
  if (!address) return "/contact";
  const body = "Name:\nPhone:\nPlaying as (individual or team):\nQuestions:\n";
  return `mailto:${address}?subject=${encodeURIComponent(subject || "Winter Golf League inquiry")}&body=${encodeURIComponent(body)}`;
}
