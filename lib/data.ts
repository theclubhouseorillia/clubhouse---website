import "server-only";
import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getPublicClient } from "./supabase/public";
import {
  DEFAULT_BAY_TYPES,
  DEFAULT_HOMEPAGE_PHOTOS,
  DEFAULT_HOURS,
  DEFAULT_LEAGUE_OPTIONS,
  DEFAULT_LEAGUE_SETTINGS,
  DEFAULT_MENU,
  DEFAULT_OWNERS,
  DEFAULT_OWNERS_SECTION,
  DEFAULT_PACKAGES,
  DEFAULT_POOL_TABLE,
  DEFAULT_RATES,
  DEFAULT_REVIEWS,
  DEFAULT_REVIEWS_SECTION,
  DEFAULT_SETTINGS,
} from "./defaults";
import { todayISO } from "./format";
import type {
  Announcement,
  BayType,
  EventPackage,
  EventRow,
  GalleryImage,
  HomepagePhotos,
  HoursRow,
  LeagueOption,
  LeagueSettings,
  MenuCategory,
  MenuItem,
  Owner,
  OwnersSection,
  Review,
  ReviewsSection,
  PoolTable,
  Rate,
  Settings,
  SpecialHours,
} from "./types";

type QueryResult = { data: unknown; error: { message: string } | null };

/** Runs a query; on any failure logs it and returns the fallback so pages still render. */
async function safeQuery<T>(
  label: string,
  fallback: T,
  run: (sb: SupabaseClient) => PromiseLike<QueryResult>,
): Promise<T> {
  const sb = getPublicClient();
  if (!sb) return fallback;
  try {
    const { data, error } = await run(sb);
    if (error) {
      console.error(`[data] ${label}: ${error.message}`);
      return fallback;
    }
    return (data ?? fallback) as T;
  } catch (err) {
    console.error(`[data] ${label}:`, err);
    return fallback;
  }
}

/** Keeps only real photo addresses from a database array. */
function photoList(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((p): p is string => typeof p === "string" && p.length > 0) : [];
}

function toNumber(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

// Every settings column the public site may read. The private inquiry email is
// deliberately left out (see schema.sql: visitors can't read that column).
const PUBLIC_SETTINGS_COLUMNS = [
  "business_name", "logo_url", "hero_headline", "hero_subheadline", "slogan", "show_slogan",
  "hero_image_url", "bar_heading", "bar_text", "highlights", "packages_note", "street_address",
  "city", "province", "postal_code", "phone", "public_email", "website_url", "booking_url",
  "facebook_url", "instagram_url", "tiktok_url", "seo_description", "pricing_season_label",
  "pricing_note", "hours_season_label",
].join(",");

export const getSettings = cache(async (): Promise<Settings> => {
  const row = await safeQuery<Partial<Settings> | null>("settings", null, (sb) =>
    sb.from("site_settings").select(PUBLIC_SETTINGS_COLUMNS).eq("id", 1).maybeSingle(),
  );
  if (!row) return DEFAULT_SETTINGS;
  return {
    ...DEFAULT_SETTINGS,
    ...row,
    business_name: row.business_name || DEFAULT_SETTINGS.business_name,
    show_slogan: row.show_slogan ?? true,
    highlights: Array.isArray(row.highlights) ? row.highlights : [],
  };
});

/** Enabled announcements that haven't expired (the banner re-checks times in the browser). */
export const getAnnouncements = cache(async (): Promise<Announcement[]> => {
  const rows = await safeQuery<Announcement[]>("announcements", [], (sb) =>
    sb.from("announcements").select("*").eq("enabled", true).order("sort_order").order("created_at"),
  );
  const now = Date.now();
  return rows.filter(
    (a) =>
      (!a.starts_at || new Date(a.starts_at).getTime() <= now) &&
      (!a.ends_at || new Date(a.ends_at).getTime() > now),
  );
});

export const getEvents = cache(async (): Promise<EventRow[]> => {
  return safeQuery<EventRow[]>("events", [], (sb) =>
    sb.from("events").select("*").eq("published", true).order("event_date"),
  );
});

export const getBayTypes = cache(async (): Promise<BayType[]> => {
  type Row = BayType & { image_url?: string | null };
  const rows = await safeQuery<Row[]>("bay types", DEFAULT_BAY_TYPES, (sb) =>
    sb.from("bay_types").select("*").order("sort_order"),
  );
  return rows.map(({ image_url, ...r }) => {
    const photos = photoList(r.photos);
    const column = ["open_bay", "semi_private", "private_bay"].includes(r.price_column ?? "") ? r.price_column : null;
    return {
      ...r,
      details: Array.isArray(r.details) ? r.details : [],
      photos: photos.length ? photos : image_url ? [image_url] : [],
      price_column: column,
    };
  });
});

export const getRates = cache(async (): Promise<Rate[]> => {
  const rows = await safeQuery<Rate[]>("pricing", DEFAULT_RATES, (sb) =>
    sb.from("pricing_rates").select("*").order("sort_order"),
  );
  return rows.map((r) => ({
    ...r,
    open_bay: toNumber(r.open_bay),
    semi_private: toNumber(r.semi_private),
    private_bay: toNumber(r.private_bay),
  }));
});

export const getPackages = cache(async (): Promise<EventPackage[]> => {
  const rows = await safeQuery<EventPackage[]>("packages", DEFAULT_PACKAGES, (sb) =>
    sb.from("event_packages").select("*").order("sort_order"),
  );
  return rows.map((r) => ({ ...r, features: Array.isArray(r.features) ? r.features : [], photos: photoList(r.photos) }));
});

export const getMenu = cache(async (): Promise<MenuCategory[]> => {
  type Row = Omit<MenuCategory, "items"> & { menu_items: MenuItem[] | null };
  const rows = await safeQuery<Row[] | null>("menu", null, (sb) =>
    sb.from("menu_categories").select("*, menu_items(*)").order("sort_order"),
  );
  if (!rows) return DEFAULT_MENU;
  return rows.map(({ menu_items, ...category }) => ({
    ...category,
    items: (menu_items ?? [])
      .filter((item) => item.available)
      .map((item) => ({ ...item, price: toNumber(item.price) }))
      .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name)),
  }));
});

export const getHours = cache(async (): Promise<HoursRow[]> => {
  const rows = await safeQuery<HoursRow[]>("hours", DEFAULT_HOURS, (sb) =>
    sb.from("business_hours").select("*").order("id"),
  );
  return rows.length ? rows : DEFAULT_HOURS;
});

/** Holiday / special hours from today onward. */
export const getSpecialHours = cache(async (): Promise<SpecialHours[]> => {
  return safeQuery<SpecialHours[]>("special hours", [], (sb) =>
    sb.from("special_hours").select("*").gte("date", todayISO()).order("date").limit(10),
  );
});

export const getGallery = cache(async (): Promise<GalleryImage[]> => {
  return safeQuery<GalleryImage[]>("gallery", [], (sb) =>
    sb.from("gallery_images").select("*").order("sort_order").order("created_at", { ascending: false }),
  );
});

export const getLeagueSettings = cache(async (): Promise<LeagueSettings> => {
  const row = await safeQuery<Partial<LeagueSettings> | null>("league settings", null, (sb) =>
    sb.from("league_settings").select("*").eq("id", 1).maybeSingle(),
  );
  if (!row) return DEFAULT_LEAGUE_SETTINGS;
  return {
    ...DEFAULT_LEAGUE_SETTINGS,
    ...row,
    enabled: row.enabled ?? true,
    title: row.title || DEFAULT_LEAGUE_SETTINGS.title,
    highlights: Array.isArray(row.highlights) ? row.highlights : [],
  };
});

export const getLeagueOptions = cache(async (): Promise<LeagueOption[]> => {
  const rows = await safeQuery<LeagueOption[]>("league options", DEFAULT_LEAGUE_OPTIONS, (sb) =>
    sb.from("league_options").select("*").order("sort_order"),
  );
  return rows.map((r) => ({ ...r, features: Array.isArray(r.features) ? r.features : [], photos: photoList(r.photos) }));
});

export const getHomepagePhotos = cache(async (): Promise<HomepagePhotos> => {
  const row = await safeQuery<Partial<HomepagePhotos> | null>("homepage photos", null, (sb) =>
    sb.from("homepage_photos").select("*").eq("id", 1).maybeSingle(),
  );
  if (!row) return DEFAULT_HOMEPAGE_PHOTOS;
  return {
    hero_photos: photoList(row.hero_photos),
    bar_photos: photoList(row.bar_photos),
    events_photos: photoList(row.events_photos),
    league_photos: photoList(row.league_photos),
    visit_photos: photoList(row.visit_photos),
  };
});

export const getPoolTable = cache(async (): Promise<PoolTable> => {
  const row = await safeQuery<Partial<PoolTable> | null>("pool table", null, (sb) =>
    sb.from("pool_table").select("*").eq("id", 1).maybeSingle(),
  );
  if (!row) return DEFAULT_POOL_TABLE;
  return {
    ...DEFAULT_POOL_TABLE,
    ...row,
    enabled: row.enabled ?? true,
    title: row.title || DEFAULT_POOL_TABLE.title,
    price_label: row.price_label || DEFAULT_POOL_TABLE.price_label,
    features: Array.isArray(row.features) ? row.features : [],
    photos: photoList(row.photos),
  };
});

export const getOwnersSection = cache(async (): Promise<OwnersSection> => {
  const row = await safeQuery<(Partial<OwnersSection> & { photos?: unknown }) | null>("owners section", null, (sb) =>
    sb.from("owners_section").select("*").eq("id", 1).maybeSingle(),
  );
  if (!row) return DEFAULT_OWNERS_SECTION;
  return {
    enabled: row.enabled ?? true,
    heading: row.heading || DEFAULT_OWNERS_SECTION.heading,
    intro: row.intro ?? null,
    photo_url: row.photo_url || photoList(row.photos)[0] || null,
  };
});

export const getOwners = cache(async (): Promise<Owner[]> => {
  return safeQuery<Owner[]>("owners", DEFAULT_OWNERS, (sb) =>
    sb.from("owners").select("*").order("sort_order").order("name"),
  );
});

function numberOrNull(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export const getReviewsSection = cache(async (): Promise<ReviewsSection> => {
  const row = await safeQuery<Partial<ReviewsSection> | null>("reviews section", null, (sb) =>
    sb.from("reviews_section").select("*").eq("id", 1).maybeSingle(),
  );
  if (!row) return DEFAULT_REVIEWS_SECTION;
  return {
    enabled: row.enabled ?? true,
    heading: row.heading || DEFAULT_REVIEWS_SECTION.heading,
    rating: numberOrNull(row.rating),
    review_count: numberOrNull(row.review_count),
    google_url: row.google_url || null,
    write_review_url: row.write_review_url || null,
  };
});

export const getReviews = cache(async (): Promise<Review[]> => {
  const rows = await safeQuery<Review[]>("reviews", DEFAULT_REVIEWS, (sb) =>
    sb.from("reviews").select("*").order("sort_order").order("created_at", { ascending: false }),
  );
  return rows.map((r) => ({ ...r, rating: Math.min(5, Math.max(1, Math.round(Number(r.rating) || 5))) }));
});
