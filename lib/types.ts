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
  note: string | null;
}

/** League pricing options share the package card layout. */
export type LeagueOption = EventPackage;
