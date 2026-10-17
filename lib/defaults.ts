// Fallback content used before the database is connected (or if it is
// temporarily unreachable), so the site never shows a blank page.
// It mirrors supabase/seed.sql.
import type {
  BayType,
  Course,
  EventPackage,
  Faq,
  GiftCards,
  HomepagePhotos,
  HoursRow,
  LeagueOption,
  LeagueSettings,
  LeagueStep,
  MenuCategory,
  MenuSettings,
  Owner,
  OwnersSection,
  PoolTable,
  PrivacyPolicy,
  Rate,
  RentalClubs,
  Review,
  ReviewsSection,
  Settings,
  SportsGame,
} from "./types";

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
    "Rental clubs for left-handed, right-handed and women's golfers, plus youth sets for kids 4 to 12",
    "About 5,000 sq ft of entertainment space",
  ],
  packages_note: "Contact us for pricing and availability. We'll tailor a package to your group and date.",
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
  instagram_feed_url: null,
  membership_portal_url: null,
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
    photos: [],
    price_column: "open_bay",
    sort_order: 1,
  },
  {
    id: "default-semi",
    name: "Semi-Private Bay",
    summary: "A more secluded simulator experience, set apart from the main lounge.",
    details: ["A quieter, more focused setting", "Great for small groups and practice"],
    photos: [],
    price_column: "semi_private",
    sort_order: 2,
  },
  {
    id: "default-private",
    name: "Private Bay",
    summary: "Our premium private simulator space with a Bose sound system and a 75-inch television.",
    details: ["Fully private room", "Bose sound system", "75-inch television", "Up to eight golfers"],
    photos: [],
    price_column: "private_bay",
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
    price_label: "Inquire for pricing",
    price_note: null,
    description: "Your group's own private simulator room.",
    features: ["Private simulator bay", "Up to eight golfers", "Bose sound system", "75-inch television", "Premium golf experience"],
    featured: false,
    sort_order: 1,
    photos: [],
  },
  {
    id: "p2",
    name: "Group Golf Experience",
    price_label: "Inquire for pricing",
    price_note: null,
    description: "Three simulator bays plus the lounge and pool table for your group.",
    features: [
      "Two open simulator bays",
      "One semi-private simulator bay",
      "Lounge area",
      "Pool table",
      "Premium Bose sound system",
      "Televisions",
      "Complimentary soft drinks",
      "Rental golf clubs, including left-handed, right-handed, women's and youth sets",
    ],
    featured: true,
    sort_order: 2,
    photos: [],
  },
  {
    id: "p3",
    name: "Full Facility Private Event",
    price_label: "Inquire for pricing",
    price_note: null,
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
    photos: [],
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

export const DEFAULT_LEAGUE_SETTINGS: LeagueSettings = {
  enabled: true,
  title: "Winter Golf League",
  intro:
    "Keep your game sharp all winter. Play weekly rounds on our Trackman iO simulators, compete on the leaderboard and enjoy the bar with your league mates.",
  season: "[Season dates, e.g. January to March]",
  schedule: "[League night and time, e.g. Tuesdays at 7 PM]",
  highlights: [
    "[Format, e.g. 9 holes per week on world-famous courses]",
    "[What's included, e.g. weekly prizes and an end-of-season party]",
    "All skill levels welcome",
  ],
  email: null,
  email_subject: "Winter Golf League inquiry",
  signup_url: null,
  details: null,
  note: "Spots are limited. Email us to reserve yours.",
};

export const DEFAULT_LEAGUE_OPTIONS: LeagueOption[] = [];

export const DEFAULT_LEAGUE_STEPS: LeagueStep[] = [];

export const DEFAULT_SPORTS_GAMES: SportsGame[] = [];

export const DEFAULT_COURSES: Course[] = [];

export const DEFAULT_MEMBERSHIP_PLANS: EventPackage[] = [];

export const DEFAULT_HOMEPAGE_PHOTOS: HomepagePhotos = {
  hero_photos: [],
  bar_photos: [],
  events_photos: [],
  league_photos: [],
  visit_photos: [],
};

export const DEFAULT_POOL_TABLE: PoolTable = {
  enabled: true,
  title: "Premium Pool Table",
  description:
    "Rack 'em up between rounds or make a night of it. Grab a drink from the bar and challenge your crew on our premium pool table.",
  price_label: "$20",
  price_note: "per hour",
  features: ["Premium pool table", "Book online in seconds"],
  photos: [],
  booking_url: null,
};

export const DEFAULT_RENTAL_CLUBS: RentalClubs = {
  enabled: true,
  title: "Rental Clubs",
  description:
    "No clubs? No problem. We have rental sets ready for right-handed, left-handed and women’s golfers, plus youth sets for kids 4 to 12, so anyone can grab a bay and play.",
  price_label: null,
  price_note: null,
  features: ["Right-handed sets", "Left-handed sets", "Women’s sets", "Youth sets for kids 4 to 12: $25 plus tax"],
  photos: [],
};

export const DEFAULT_OWNERS_SECTION: OwnersSection = {
  enabled: true,
  heading: "Meet the Owners",
  intro: null,
  photo_url: null,
};

export const DEFAULT_OWNERS: Owner[] = [];

export const DEFAULT_REVIEWS_SECTION: ReviewsSection = {
  enabled: true,
  heading: "What our guests are saying",
  rating: null,
  review_count: null,
  google_url: null,
  write_review_url: null,
};

export const DEFAULT_REVIEWS: Review[] = [];

export const DEFAULT_GIFT_CARDS: GiftCards = {
  enabled: true,
  heading: "Gift Cards",
  intro: "The perfect gift for the golfer in your life, or anyone who loves a great night out.",
  how_to_order:
    "To order a gift card, give us a call or send us an email. Let us know the amount and who it's for, and we'll take care of the rest.",
  amounts: [],
  highlights: [],
  photo_url: null,
  buy_url: null,
  qr_image_url: null,
};

export const DEFAULT_FAQS: Faq[] = [];

export const DEFAULT_PRIVACY_POLICY: PrivacyPolicy = { content: "", updated_on: null };

export const DEFAULT_MENU_SETTINGS: MenuSettings = {
  heading: "Our Menu",
  intro: "Scroll through our full food and drink menu below, or download it to keep on your phone.",
  pdf_url: "/menu-files/the-clubhouse-menu.pdf",
  page_images: [
    "/menu-files/menu-page-1.jpg",
    "/menu-files/menu-page-2.jpg",
    "/menu-files/menu-page-3.jpg",
    "/menu-files/menu-page-4.jpg",
    "/menu-files/menu-page-5.jpg",
  ],
};
