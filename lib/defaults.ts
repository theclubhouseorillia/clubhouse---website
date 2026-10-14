// Fallback content used before the database is connected (or if it is
// temporarily unreachable), so the site never shows a blank page.
// It mirrors supabase/seed.sql.
import type { BayType, EventPackage, HoursRow, MenuCategory, Rate, Settings } from "./types";

export const GALLERY_CATEGORIES = [
  "Golf simulator bays",
  "Bar & lounge",
  "Private simulator",
  "Pool table",
  "Live entertainment",
  "Private parties",
  "Food & drinks",
] as const;

export const DEFAULT_SETTINGS: Settings = {
  business_name: "[Business Name]",
  logo_url: null,
  hero_headline: null,
  hero_subheadline:
    "[Secondary headline, e.g. your city's premier indoor golf & entertainment destination]",
  slogan: "[Marketing slogan]",
  show_slogan: true,
  hero_image_url: null,
  bar_heading: "A sports bar worth staying for",
  bar_text:
    "Catch the game on large 4K screens, order from the full-service bar and kitchen, and rack up a game of pool between tee times. Karaoke, live DJs and live music keep the nights going.",
  highlights: [
    "Four golf simulator bays: open, semi-private and private",
    "Full-service bar and food menu",
    "Premium Bose sound and multiple large 4K TVs",
    "Premium pool table",
    "Karaoke nights, live DJs and live music",
    "Rental clubs for left-handed, right-handed and women's golfers",
    "About 5,000 sq ft of entertainment space",
  ],
  packages_note:
    "Additional hours are available at an additional cost. All prices are before applicable taxes.",
  street_address: "[Street address]",
  city: "[City]",
  province: "[Province]",
  postal_code: "[Postal code]",
  phone: null,
  public_email: null,
  website_url: null,
  booking_url: null,
  inquiry_email: null,
  facebook_url: null,
  instagram_url: null,
  tiktok_url: null,
  seo_description: null,
  pricing_season_label: "Winter pricing",
  pricing_note: "All prices are hourly and before applicable taxes.",
  hours_season_label: "Winter hours",
};

export const DEFAULT_BAY_TYPES: BayType[] = [
  {
    id: "default-open",
    name: "Open Bays",
    summary: "Two bays located near the sports bar and lounge, ideal for social golf and groups.",
    details: ["Steps from the bar, lounge and big screens", "Great for groups and casual rounds", "Rental clubs available"],
    sort_order: 1,
  },
  {
    id: "default-semi",
    name: "Semi-Private Bay",
    summary: "A more secluded simulator experience, set apart from the main lounge.",
    details: ["A quieter, more focused setting", "Great for small groups and practice"],
    sort_order: 2,
  },
  {
    id: "default-private",
    name: "Private Bay",
    summary: "Our premium private simulator space with a Bose sound system and a 75-inch television.",
    details: ["Fully private room", "Bose sound system", "75-inch television", "Up to eight golfers"],
    sort_order: 3,
  },
];

export const DEFAULT_RATES: Rate[] = [
  { id: "r1", label: "Monday–Thursday, 11 AM–4 PM", open_bay: 45, semi_private: 55, private_bay: 65, sort_order: 1 },
  { id: "r2", label: "Monday–Thursday, 4 PM–10 PM", open_bay: 60, semi_private: 70, private_bay: 85, sort_order: 2 },
  { id: "r3", label: "Friday before 4 PM", open_bay: 50, semi_private: 60, private_bay: 75, sort_order: 3 },
  { id: "r4", label: "Friday after 4 PM", open_bay: 65, semi_private: 75, private_bay: 90, sort_order: 4 },
  { id: "r5", label: "Saturday", open_bay: 65, semi_private: 75, private_bay: 90, sort_order: 5 },
  { id: "r6", label: "Sunday", open_bay: 60, semi_private: 70, private_bay: 85, sort_order: 6 },
];

export const DEFAULT_PACKAGES: EventPackage[] = [
  {
    id: "p1",
    name: "Private Simulator Experience",
    price_label: "$95 / hour",
    price_note: "plus taxes",
    description: "Your group's own private simulator room.",
    features: ["Private simulator bay", "Up to eight golfers", "Bose sound system", "75-inch television", "Premium golf experience"],
    featured: false,
    sort_order: 1,
  },
  {
    id: "p2",
    name: "Group Golf Experience",
    price_label: "From $1,199",
    price_note: "plus taxes · 3-hour minimum",
    description: "Three simulator bays plus the lounge and pool table for your group.",
    features: [
      "Two open simulator bays",
      "One semi-private simulator bay",
      "Lounge area",
      "Pool table",
      "Premium Bose sound system",
      "Televisions",
      "Complimentary soft drinks",
      "Rental golf clubs, including left-handed, right-handed and women's sets",
    ],
    featured: true,
    sort_order: 2,
  },
  {
    id: "p3",
    name: "Full Facility Private Event",
    price_label: "From $1,999",
    price_note: "plus taxes · 3-hour minimum",
    description: "Exclusive use of the entire venue.",
    features: [
      "Exclusive use of our approximately 5,000 sq ft facility",
      "All four golf simulator bays",
      "Full lounge area",
      "Pool table",
      "Premium Bose sound system",
      "Televisions",
      "Rental golf clubs",
      "Complimentary soft drinks and fries",
    ],
    featured: false,
    sort_order: 3,
  },
];

export const DEFAULT_HOURS: HoursRow[] = [
  { id: 1, day_name: "Monday", opens: "11:00:00", closes: "22:00:00", closed: false },
  { id: 2, day_name: "Tuesday", opens: "11:00:00", closes: "22:00:00", closed: false },
  { id: 3, day_name: "Wednesday", opens: "11:00:00", closes: "22:00:00", closed: false },
  { id: 4, day_name: "Thursday", opens: "11:00:00", closes: "22:00:00", closed: false },
  { id: 5, day_name: "Friday", opens: "11:00:00", closes: "23:00:00", closed: false },
  { id: 6, day_name: "Saturday", opens: "11:00:00", closes: "23:00:00", closed: false },
  { id: 7, day_name: "Sunday", opens: "12:00:00", closes: "21:00:00", closed: false },
];

const MENU_DEFAULTS: [string, string][] = [
  ["Appetizers", "[Appetizer name]"],
  ["Wings", "[Wing flavour]"],
  ["Main Dishes", "[Main dish name]"],
  ["Beer", "[Beer name]"],
  ["Cocktails", "[Cocktail name]"],
  ["Spirits", "[Spirit name]"],
  ["Non-Alcoholic Drinks", "[Drink name]"],
];

export const DEFAULT_MENU: MenuCategory[] = MENU_DEFAULTS.map(([name, placeholder], i) => ({
  id: `menu-${i}`,
  name,
  description: null,
  sort_order: i + 1,
  items: [
    {
      id: `menu-${i}-1`,
      category_id: `menu-${i}`,
      name: placeholder,
      description: "[Placeholder: replace in Admin → Menu items]",
      price: null,
      image_url: null,
      available: true,
      sort_order: 1,
    },
  ],
}));
