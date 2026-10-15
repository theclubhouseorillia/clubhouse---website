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

export interface NavLink {
  href: string;
  /** Used in the phone menu and footer. */
  label: string;
  /** Used in the desktop top bar. */
  short: string;
  /** false = phone menu and footer only (keeps the desktop bar from overflowing). */
  desktop: boolean;
}

export const NAV_LINKS: readonly NavLink[] = [
  { href: "/pricing", label: "Simulators & Pricing", short: "Pricing", desktop: true },
  { href: "/league", label: "Winter League", short: "League", desktop: true },
  { href: "/events", label: "Events", short: "Events", desktop: true },
  { href: "/calendar", label: "Calendar", short: "Calendar", desktop: true },
  { href: "/private-events", label: "Private Events", short: "Private Events", desktop: true },
  { href: "/menu", label: "Food & Drink", short: "Menu", desktop: true },
  { href: "/gallery", label: "Gallery", short: "Gallery", desktop: true },
  { href: "/contact", label: "Contact", short: "Contact", desktop: true },
  { href: "/#owners", label: "Meet the Owners", short: "The Owners", desktop: true },
  { href: "/sports", label: "Watch the Game", short: "Sports", desktop: false },
  { href: "/courses", label: "Courses You Can Play", short: "Courses", desktop: false },
  { href: "/memberships", label: "Memberships & Hour Packs", short: "Memberships", desktop: false },
  { href: "/kids-parties", label: "Kids' Parties", short: "Kids' Parties", desktop: false },
  { href: "/gift-cards", label: "Gift Cards", short: "Gift Cards", desktop: false },
  { href: "/faq", label: "FAQ", short: "FAQ", desktop: false },
];

/** Which optional sections are switched on (and so get a menu link). */
export interface NavVisibility {
  league: boolean;
  owners: boolean;
  giftCards: boolean;
  faq: boolean;
  sports: boolean;
  courses: boolean;
  memberships: boolean;
}

const OPTIONAL: Record<string, keyof NavVisibility> = {
  "/league": "league",
  "/#owners": "owners",
  "/gift-cards": "giftCards",
  "/faq": "faq",
  "/sports": "sports",
  "/courses": "courses",
  "/memberships": "memberships",
};

/** Menu links, leaving out sections that are switched off. */
export function navLinks(show: NavVisibility): NavLink[] {
  return NAV_LINKS.filter((l) => {
    const key = OPTIONAL[l.href];
    return key ? show[key] : true;
  });
}

/** "Email us" link for gift card orders, with a few prompts filled in. */
export function giftCardEmailHref(email: string | null): string | null {
  const address = real(email);
  if (!address) return null;
  const body = "Hi! I'd like to order a gift card.\n\nAmount:\nWho it's for:\nMy name and phone number:\n";
  return `mailto:${address}?subject=${encodeURIComponent("Gift card order")}&body=${encodeURIComponent(body)}`;
}

/** Fills {business_name}, {email}, {phone} and {address} in editable text like the privacy policy. */
export function fillTokens(text: string, settings: Settings): string {
  const values: Record<string, string> = {
    business_name: settings.business_name,
    email: real(settings.public_email) ?? "",
    phone: real(settings.phone) ?? "",
    address: hasRealAddress(settings) ? fullAddress(settings) : "",
  };
  return text.replace(/\{(business_name|email|phone|address)\}/g, (_, key: string) => values[key] ?? "");
}

/** "Email us to join" link for the league, with the subject and a few prompts filled in. */
export function leagueEmailHref(email: string | null, subject: string | null): string {
  const address = real(email);
  if (!address) return "/contact";
  const body = "Name:\nPhone:\nPlaying as (individual or team):\nQuestions:\n";
  return `mailto:${address}?subject=${encodeURIComponent(subject || "Winter Golf League inquiry")}&body=${encodeURIComponent(body)}`;
}
