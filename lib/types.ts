export interface Settings {
  business_name: string;
  logo_url: string | null;
  hero_headline: string | null;
  hero_subheadline: string | null;
  slogan: string | null;
  show_slogan: boolean;
  hero_image_url: string | null;
  bar_heading: string | null;
  bar_text: string | null;
  highlights: string[];
  packages_note: string | null;
  street_address: string | null;
  city: string | null;
  province: string | null;
  postal_code: string | null;
  phone: string | null;
  public_email: string | null;
  website_url: string | null;
  booking_url: string | null;
  inquiry_email: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  /** Behold.so JSON feed for the homepage Instagram strip. */
  instagram_feed_url: string | null;
  /** Stripe customer portal login link, where members update their card or cancel. */
  membership_portal_url: string | null;
  tiktok_url: string | null;
  seo_description: string | null;
  pricing_season_label: string | null;
  pricing_note: string | null;
  hours_season_label: string | null;
}

export interface Announcement {
  id: string;
  message: string;
  link_url: string | null;
  link_label: string | null;
  enabled: boolean;
  starts_at: string | null;
  ends_at: string | null;
  sort_order: number;
}

export interface EventRow {
  id: string;
  title: string;
  description: string | null;
  event_date: string; // YYYY-MM-DD
  start_time: string | null; // HH:MM:SS
  end_time: string | null;
  repeats_weekly: boolean;
  repeat_until: string | null;
  image_url: string | null;
  admission: string | null;
  button_label: string | null;
  button_url: string | null;
  featured: boolean;
  published: boolean;
}

export interface EventOccurrence extends EventRow {
  next_date: string;
}

export interface BayType {
  id: string;
  name: string;
  summary: string | null;
  details: string[];
  photos: string[];
  /** Which column of the pricing table this bay's price range comes from. */
  price_column: "open_bay" | "semi_private" | "private_bay" | null;
  sort_order: number;
}

export interface Rate {
  id: string;
  label: string;
  open_bay: number | null;
  semi_private: number | null;
  private_bay: number | null;
  sort_order: number;
}

export interface EventPackage {
  id: string;
  name: string;
  price_label: string;
  price_note: string | null;
  description: string | null;
  features: string[];
  featured: boolean;
  sort_order: number;
  photos: string[];
  /** Memberships only: online checkout link (e.g. a Stripe Payment Link) and its button text. */
  buy_url?: string | null;
  buy_label?: string | null;
  /** Memberships only: optional flyer, which also features the plan in "What's happening" on the homepage. */
  flyer_url?: string | null;
}

export interface MenuItem {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number | null;
  image_url: string | null;
  available: boolean;
  sort_order: number;
}

export interface MenuCategory {
  id: string;
  name: string;
  description: string | null;
  sort_order: number;
  items: MenuItem[];
}

export interface HoursRow {
  id: number; // 1 = Monday … 7 = Sunday
  day_name: string;
  opens: string | null;
  closes: string | null;
  closed: boolean;
}

export interface SpecialHours {
  id: string;
  date: string;
  label: string;
  closed: boolean;
  opens: string | null;
  closes: string | null;
}

export interface GalleryImage {
  id: string;
  image_url: string;
  alt_text: string;
  caption: string | null;
  category: string;
  sort_order: number;
}

export interface LeagueSettings {
  enabled: boolean;
  title: string;
  intro: string | null;
  season: string | null;
  schedule: string | null;
  highlights: string[];
  email: string | null;
  email_subject: string | null;
  /** Online sign-up and payment page (the Stripe payment link). When set, the league page's join buttons open it. */
  signup_url: string | null;
  /** Longer description under "How it works": "## " starts a heading, "- " a bullet. */
  details: string | null;
  note: string | null;
}

/** A game shown on the "Watch the game here" schedule. */
export interface SportsGame {
  id: string;
  title: string;
  sport: string | null;
  game_date: string;
  start_time: string | null;
  note: string | null;
  featured: boolean;
}

/** A course on the course showcase page. */
export interface Course {
  id: string;
  name: string;
  location: string | null;
  description: string | null;
  image_url: string | null;
  sort_order: number;
}

/** One step of "How to sign up & pay" on the league page. */
export interface LeagueStep {
  id: string;
  title: string;
  description: string;
  sort_order: number;
}

/** League pricing options share the package card layout. */
export type LeagueOption = EventPackage;

/** Photo sets for each homepage section. */
export interface HomepagePhotos {
  hero_photos: string[];
  bar_photos: string[];
  events_photos: string[];
  league_photos: string[];
  visit_photos: string[];
}

export interface PoolTable {
  enabled: boolean;
  title: string;
  description: string | null;
  price_label: string;
  price_note: string | null;
  features: string[];
  photos: string[];
  booking_url: string | null;
}

export interface RentalClubs {
  enabled: boolean;
  title: string;
  description: string | null;
  /** Optional; hidden on the site while blank or still in [brackets]. */
  price_label: string | null;
  price_note: string | null;
  features: string[];
  photos: string[];
}

export interface OwnersSection {
  enabled: boolean;
  heading: string;
  intro: string | null;
  /** One group photo of the owners. */
  photo_url: string | null;
}

export interface MenuSettings {
  heading: string;
  intro: string | null;
  /** The menu PDF people can open or download. */
  pdf_url: string | null;
  /** A picture of each page, in order, shown on the Food & Drink page. */
  page_images: string[];
}

export interface GiftCards {
  enabled: boolean;
  heading: string;
  intro: string | null;
  how_to_order: string | null;
  amounts: string[];
  highlights: string[];
  photo_url: string | null;
  /** Online eGift card shop (e.g. Toast). */
  buy_url: string | null;
  /** QR code that opens the online shop. */
  qr_image_url: string | null;
}

export interface Faq {
  id: string;
  question: string;
  answer: string;
  sort_order: number;
}

export interface PrivacyPolicy {
  content: string;
  updated_on: string | null;
}

export interface ReviewsSection {
  enabled: boolean;
  heading: string;
  /** Overall Google star rating, e.g. 4.9 (entered by the owner). */
  rating: number | null;
  review_count: number | null;
  google_url: string | null;
  write_review_url: string | null;
}

export interface Review {
  id: string;
  author: string;
  rating: number;
  quote: string;
  review_date: string | null;
  sort_order: number;
}

export interface Owner {
  id: string;
  name: string;
  role: string | null;
  bio: string | null;
  photo_url: string | null;
  sort_order: number;
}
