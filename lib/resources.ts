// Describes every editable section of the admin dashboard.
// The dashboard screens, the form fields and the server-side validation are all
// generated from these definitions, so adding a field here is all it takes.

import { GALLERY_CATEGORIES } from "./defaults";

export type FieldType =
  | "text"
  | "textarea"
  | "url"
  | "email"
  | "tel"
  | "number"
  | "money"
  | "date"
  | "time"
  | "datetime"
  | "boolean"
  | "select"
  | "relation"
  | "list"
  | "image"
  | "images";

export type FieldDefault = string | number | boolean | null;

export interface FieldDef {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  help?: string;
  placeholder?: string;
  max?: number; // max length for text, max value for numbers
  min?: number;
  integer?: boolean;
  options?: { value: string; label: string }[];
  relation?: { table: string; labelField: string };
  default?: FieldDefault;
  readOnly?: boolean;
  /** For date/datetime fields: must be after this other field. */
  after?: string;
  /** Storage folder for image uploads. */
  folder?: string;
  /** Most photos allowed in an "images" field. */
  maxItems?: number;
  /** Span the full width of the form. */
  wide?: boolean;
  /** Short label for the list view. Empty string = show the value on its own. */
  short?: string;
}

export type ResourceGroup = "Website" | "Golf" | "Events" | "Food & drink" | "Hours" | "Inbox";

export interface ResourceDef {
  key: string;
  table: string;
  title: string;
  singular: string;
  description: string;
  group: ResourceGroup;
  fields: FieldDef[];
  orderBy: { column: string; ascending?: boolean }[];
  titleField: string;
  summaryFields?: string[];
  thumbField?: string;
  toggleField?: string;
  toggleOn?: string;
  toggleOff?: string;
  /** Group the list by this field's value (e.g. menu items by category). */
  groupByField?: string;
  /** Show Live / Scheduled / Expired based on these datetime fields. */
  schedule?: { start: string; end: string };
  singleton?: boolean;
  allowCreate?: boolean;
  allowDelete?: boolean;
  touchUpdatedAt?: boolean;
}

const sortOrder: FieldDef = {
  name: "sort_order",
  label: "Display order",
  type: "number",
  integer: true,
  min: -1000,
  max: 1000,
  default: 0,
  help: "Lower numbers appear first.",
};

export const RESOURCES: ResourceDef[] = [
  {
    key: "settings",
    table: "site_settings",
    title: "Business settings",
    singular: "Settings",
    description: "Your business details, homepage headlines, booking link and where form submissions are emailed.",
    group: "Website",
    singleton: true,
    allowCreate: false,
    allowDelete: false,
    touchUpdatedAt: true,
    orderBy: [{ column: "id" }],
    titleField: "business_name",
    fields: [
      { name: "business_name", label: "Business name", type: "text", required: true, max: 120 },
      { name: "logo_url", label: "Logo", type: "image", folder: "branding", help: "Optional. A wide logo on a transparent background works best." },
      {
        name: "hero_headline",
        label: "Homepage main headline",
        type: "text",
        max: 120,
        help: "Leave blank to use your business name.",
      },
      { name: "hero_subheadline", label: "Homepage secondary headline", type: "text", max: 200, wide: true },
      { name: "slogan", label: "Marketing slogan", type: "text", max: 200, wide: true, help: "Shown prominently above the homepage headline." },
      { name: "show_slogan", label: "Show the slogan on the homepage", type: "boolean", default: true },
      { name: "booking_url", label: "Online booking link", type: "url", wide: true, help: "Every “Book a Simulator” button uses this link. If blank, buttons call your phone number." },
      { name: "inquiry_email", label: "Send form submissions to", type: "email", wide: true, help: "Private event and contact form submissions are emailed here." },
      { name: "street_address", label: "Street address", type: "text", max: 200 },
      { name: "city", label: "City", type: "text", max: 100 },
      { name: "province", label: "Province", type: "text", max: 100 },
      { name: "postal_code", label: "Postal code", type: "text", max: 20 },
      { name: "phone", label: "Phone number", type: "tel", max: 30 },
      { name: "public_email", label: "Public email address", type: "email", help: "Optional. Shown on the contact page." },
      { name: "website_url", label: "Website address", type: "url" },
      { name: "facebook_url", label: "Facebook page link", type: "url" },
      { name: "instagram_url", label: "Instagram link", type: "url" },
      { name: "tiktok_url", label: "TikTok link", type: "url" },
      { name: "bar_heading", label: "Sports bar section heading", type: "text", max: 120, wide: true },
      { name: "bar_text", label: "Sports bar section text", type: "textarea", max: 1200, wide: true },
      { name: "highlights", label: "Venue highlights", type: "list", wide: true, help: "One per line. Shown as a checklist on the homepage." },
      { name: "pricing_season_label", label: "Pricing season label", type: "text", max: 60, placeholder: "Winter pricing" },
      { name: "pricing_note", label: "Pricing note", type: "text", max: 200 },
      { name: "hours_season_label", label: "Hours season label", type: "text", max: 60, placeholder: "Winter hours" },
      { name: "packages_note", label: "Private events note", type: "text", max: 300, wide: true },
      { name: "seo_description", label: "Search engine description", type: "textarea", max: 300, wide: true, help: "One or two sentences Google may show under your site name." },
    ],
  },
  {
    key: "homepage-photos",
    table: "homepage_photos",
    title: "Homepage photos",
    singular: "Homepage photos",
    description:
      "Photos for each section of your homepage. Add several to any section and visitors can swipe through them. Use the arrows on a photo to choose which shows first.",
    group: "Website",
    singleton: true,
    allowCreate: false,
    allowDelete: false,
    touchUpdatedAt: true,
    orderBy: [{ column: "id" }],
    titleField: "id",
    fields: [
      {
        name: "hero_photos",
        label: "Top of the page (behind your headline)",
        type: "images",
        folder: "homepage",
        maxItems: 12,
        wide: true,
        help: "Wide landscape photos work best. With more than one, they slowly fade from one to the next.",
      },
      {
        name: "bar_photos",
        label: "Sports bar & lounge section",
        type: "images",
        folder: "homepage",
        maxItems: 12,
        wide: true,
        help: "If empty, your first “Bar & lounge” gallery photo is used.",
      },
      {
        name: "events_photos",
        label: "Private events section",
        type: "images",
        folder: "homepage",
        maxItems: 12,
        wide: true,
        help: "Parties, corporate nights and big groups. Shown above the packages.",
      },
      {
        name: "league_photos",
        label: "Winter league section",
        type: "images",
        folder: "homepage",
        maxItems: 12,
        wide: true,
        help: "League nights, leaderboards, teams.",
      },
      {
        name: "visit_photos",
        label: "Visit us section (bottom of the page)",
        type: "images",
        folder: "homepage",
        maxItems: 12,
        wide: true,
        help: "Your entrance, building or the space as people walk in.",
      },
    ],
  },
  {
    key: "announcements",
    table: "announcements",
    title: "Announcement banner",
    singular: "Announcement",
    description: "Messages that rotate in the banner at the very top of every page.",
    group: "Website",
    orderBy: [{ column: "sort_order" }, { column: "created_at" }],
    titleField: "message",
    summaryFields: ["link_url", "starts_at", "ends_at"],
    toggleField: "enabled",
    toggleOn: "On",
    toggleOff: "Off",
    schedule: { start: "starts_at", end: "ends_at" },
    fields: [
      { name: "message", label: "Message", type: "text", required: true, max: 160, wide: true, help: "Keep it short so it fits on a phone." },
      { name: "link_url", label: "Link (optional)", type: "url", help: "A page on your site like /events, or a full web address.", short: "Links to" },
      { name: "link_label", label: "Link text", type: "text", max: 40, placeholder: "Learn more" },
      { name: "enabled", label: "Show this announcement", type: "boolean", default: true },
      sortOrder,
      { name: "starts_at", label: "Start showing (optional)", type: "datetime", short: "From", help: "Uses your device's time zone." },
      { name: "ends_at", label: "Stop showing (optional)", type: "datetime", after: "starts_at", short: "Until" },
    ],
  },
  {
    key: "gallery",
    table: "gallery_images",
    title: "Photo gallery",
    singular: "Photo",
    description:
      "Photos on the gallery page. “Live entertainment” and “Private parties” photos also show as past-event highlights on the Events and Private Events pages.",
    group: "Website",
    orderBy: [{ column: "sort_order" }, { column: "created_at", ascending: false }],
    titleField: "alt_text",
    summaryFields: ["category", "caption"],
    thumbField: "image_url",
    fields: [
      { name: "image_url", label: "Photo", type: "image", required: true, folder: "gallery", wide: true },
      {
        name: "alt_text",
        label: "Photo description",
        type: "text",
        required: true,
        max: 200,
        wide: true,
        help: "Describe the photo in a few words, e.g. “Friends playing in the private simulator bay”. Helps blind visitors and Google.",
      },
      { name: "caption", label: "Caption (optional)", type: "text", max: 200, wide: true, short: "" },
      {
        name: "category",
        label: "Category",
        short: "",
        type: "select",
        required: true,
        default: GALLERY_CATEGORIES[0],
        options: GALLERY_CATEGORIES.map((c) => ({ value: c, label: c })),
      },
      sortOrder,
    ],
  },
  {
    key: "pricing",
    table: "pricing_rates",
    title: "Simulator pricing",
    singular: "Price row",
    description: "Hourly rates per bay. Each row is a day or time period.",
    group: "Golf",
    orderBy: [{ column: "sort_order" }],
    titleField: "label",
    summaryFields: ["open_bay", "semi_private", "private_bay"],
    fields: [
      { name: "label", label: "Day / time", type: "text", required: true, max: 80, wide: true, placeholder: "Monday–Thursday, 11 AM–4 PM" },
      { name: "open_bay", label: "Open Bay ($/hr)", type: "money", short: "Open" },
      { name: "semi_private", label: "Semi-Private ($/hr)", type: "money", short: "Semi" },
      { name: "private_bay", label: "Private ($/hr)", type: "money", short: "Private" },
      sortOrder,
    ],
  },
  {
    key: "bays",
    table: "bay_types",
    title: "Simulator bays",
    singular: "Bay type",
    description: "Each bay's photos, description and features. Shown on the homepage and pricing page.",
    group: "Golf",
    orderBy: [{ column: "sort_order" }],
    titleField: "name",
    summaryFields: ["summary"],
    thumbField: "photos",
    fields: [
      { name: "name", label: "Name", type: "text", required: true, max: 80 },
      sortOrder,
      {
        name: "photos",
        label: "Photos of this bay",
        type: "images",
        folder: "bays",
        maxItems: 12,
        wide: true,
        help: "Visitors can swipe through these on the homepage and pricing page. Landscape photos work best; use the arrows to choose which shows first.",
      },
      {
        name: "price_column",
        label: "Show price range from",
        type: "select",
        options: [
          { value: "open_bay", label: "Open Bay column" },
          { value: "semi_private", label: "Semi-Private column" },
          { value: "private_bay", label: "Private column" },
        ],
        help: "The card shows this bay's lowest to highest hourly price from Simulator pricing. Choose “—” to hide it.",
      },
      { name: "summary", label: "Short description", type: "textarea", max: 400, wide: true, short: "" },
      { name: "details", label: "Key features", type: "list", wide: true, help: "One per line." },
    ],
  },
  {
    key: "pool",
    table: "pool_table",
    title: "Pool table",
    singular: "Pool table",
    description: "Your pool table's photos, price and booking button. Shown on the homepage and pricing page.",
    group: "Golf",
    singleton: true,
    allowCreate: false,
    allowDelete: false,
    touchUpdatedAt: true,
    orderBy: [{ column: "id" }],
    titleField: "title",
    fields: [
      { name: "enabled", label: "Show the pool table on the website", type: "boolean", default: true, wide: true },
      { name: "title", label: "Title", type: "text", required: true, max: 80 },
      { name: "price_label", label: "Price", type: "text", required: true, max: 40, placeholder: "$20" },
      { name: "price_note", label: "Price note", type: "text", max: 80, placeholder: "per hour" },
      {
        name: "booking_url",
        label: "Booking link for the pool table (optional)",
        type: "url",
        help: "Leave blank to use your main online booking link from Business settings.",
      },
      { name: "description", label: "Description", type: "textarea", max: 800, wide: true },
      { name: "features", label: "Highlights", type: "list", wide: true, help: "One per line." },
      {
        name: "photos",
        label: "Photos",
        type: "images",
        folder: "pool",
        maxItems: 12,
        wide: true,
        help: "If empty, any “Pool table” photos from your gallery are used.",
      },
    ],
  },
  {
    key: "league",
    table: "league_settings",
    title: "Winter league",
    singular: "League page",
    description: "The Winter Golf League page: description, season, schedule and the email people use to join.",
    group: "Golf",
    singleton: true,
    allowCreate: false,
    allowDelete: false,
    touchUpdatedAt: true,
    orderBy: [{ column: "id" }],
    titleField: "title",
    fields: [
      { name: "enabled", label: "Show the league page on the website", type: "boolean", default: true, wide: true },
      { name: "title", label: "Page title", type: "text", required: true, max: 80 },
      { name: "season", label: "Season dates", type: "text", max: 120, placeholder: "January 6 – March 31" },
      { name: "schedule", label: "League night and time", type: "text", max: 120, placeholder: "Tuesdays at 7 PM" },
      {
        name: "email",
        label: "Email for league sign-ups",
        type: "email",
        help: "The “Email us to join” button opens a message to this address. If blank, it goes to your contact page.",
      },
      { name: "email_subject", label: "Email subject line", type: "text", max: 120, placeholder: "Winter Golf League inquiry" },
      { name: "intro", label: "Introduction", type: "textarea", max: 1200, wide: true },
      { name: "highlights", label: "League details", type: "list", wide: true, help: "One per line: format, prizes, what's included." },
      { name: "note", label: "Note under the pricing", type: "text", max: 300, wide: true },
    ],
  },
  {
    key: "league-options",
    table: "league_options",
    title: "League pricing",
    singular: "League option",
    description: "Pricing options on the Winter Golf League page, e.g. individual or team.",
    group: "Golf",
    orderBy: [{ column: "sort_order" }],
    titleField: "name",
    summaryFields: ["price_label", "price_note", "featured"],
    fields: [
      { name: "name", label: "Option name", type: "text", required: true, max: 100, wide: true, placeholder: "Individual" },
      { name: "price_label", label: "Price", type: "text", required: true, max: 60, placeholder: "$199", short: "" },
      { name: "price_note", label: "Price note", type: "text", max: 120, placeholder: "per player, per season", short: "" },
      { name: "description", label: "Short description", type: "textarea", max: 500, wide: true },
      { name: "features", label: "What's included", type: "list", wide: true, help: "One per line." },
      {
        name: "photos",
        label: "Photos (optional)",
        type: "images",
        folder: "league",
        maxItems: 8,
        wide: true,
        help: "Shown at the top of this option's card.",
      },
      { name: "featured", label: "Highlight as most popular", type: "boolean", default: false, short: "Most popular" },
      sortOrder,
    ],
  },
  {
    key: "events",
    table: "events",
    title: "Events",
    singular: "Event",
    description: "Karaoke, DJs, live music, tournaments and parties. Weekly events repeat automatically.",
    group: "Events",
    orderBy: [{ column: "event_date", ascending: false }],
    titleField: "title",
    summaryFields: ["event_date", "start_time", "repeats_weekly", "featured"],
    thumbField: "image_url",
    toggleField: "published",
    toggleOn: "Published",
    toggleOff: "Hidden",
    fields: [
      { name: "title", label: "Event name", type: "text", required: true, max: 120, wide: true },
      { name: "event_date", label: "Date", type: "date", required: true, help: "For weekly events, the first date it happens.", short: "Date" },
      { name: "repeats_weekly", label: "Repeats every week on this day", type: "boolean", default: false, short: "Weekly" },
      { name: "start_time", label: "Start time", type: "time", short: "Starts" },
      { name: "end_time", label: "End time", type: "time" },
      { name: "repeat_until", label: "Weekly event ends on (optional)", type: "date", after: "event_date" },
      { name: "admission", label: "Admission", type: "text", max: 120, placeholder: "Free entry / $10 at the door" },
      { name: "description", label: "Description", type: "textarea", max: 2000, wide: true, short: "" },
      { name: "image_url", label: "Flyer or photo", type: "image", folder: "events", wide: true },
      { name: "button_label", label: "Button text", type: "text", max: 40, placeholder: "Get tickets" },
      { name: "button_url", label: "Button link (booking or tickets)", type: "url", help: "If blank, the button goes to your contact page." },
      { name: "featured", label: "Feature on the homepage", type: "boolean", default: false, short: "On homepage" },
      { name: "published", label: "Published (visible on the website)", type: "boolean", default: true },
    ],
  },
  {
    key: "packages",
    table: "event_packages",
    title: "Private event packages",
    singular: "Package",
    description: "Packages on the Private Events page.",
    group: "Events",
    orderBy: [{ column: "sort_order" }],
    titleField: "name",
    summaryFields: ["price_label", "price_note", "featured"],
    fields: [
      { name: "name", label: "Package name", type: "text", required: true, max: 100, wide: true },
      { name: "price_label", label: "Price", type: "text", required: true, max: 60, placeholder: "Inquire for pricing", help: "A price like “From $1,199”, or wording like “Inquire for pricing”.", short: "" },
      { name: "price_note", label: "Price note", type: "text", max: 120, placeholder: "plus taxes · 3-hour minimum", short: "" },
      { name: "description", label: "Short description", type: "textarea", max: 500, wide: true, short: "" },
      { name: "features", label: "What's included", type: "list", wide: true, help: "One per line." },
      {
        name: "photos",
        label: "Photos (optional)",
        type: "images",
        folder: "packages",
        maxItems: 8,
        wide: true,
        help: "Shown at the top of this package's card. Visitors can swipe through them.",
      },
      { name: "featured", label: "Highlight as most popular", type: "boolean", default: false, short: "Most popular" },
      sortOrder,
    ],
  },
  {
    key: "menu-items",
    table: "menu_items",
    title: "Menu items",
    singular: "Menu item",
    description: "Food and drinks on the menu page.",
    group: "Food & drink",
    orderBy: [{ column: "sort_order" }, { column: "name" }],
    titleField: "name",
    summaryFields: ["price", "description"],
    groupByField: "category_id",
    thumbField: "image_url",
    toggleField: "available",
    toggleOn: "Available",
    toggleOff: "Hidden",
    fields: [
      { name: "category_id", label: "Category", type: "relation", required: true, relation: { table: "menu_categories", labelField: "name" } },
      { name: "name", label: "Name", type: "text", required: true, max: 120 },
      { name: "price", label: "Price ($)", type: "money", help: "Leave blank to hide the price.", short: "" },
      sortOrder,
      { name: "description", label: "Description", type: "textarea", max: 500, wide: true, short: "" },
      { name: "image_url", label: "Photo (optional)", type: "image", folder: "menu", wide: true },
      { name: "available", label: "Show on the menu", type: "boolean", default: true },
    ],
  },
  {
    key: "menu-categories",
    table: "menu_categories",
    title: "Menu categories",
    singular: "Category",
    description: "Sections of your menu, like Appetizers or Cocktails. Deleting a category also deletes its items.",
    group: "Food & drink",
    orderBy: [{ column: "sort_order" }],
    titleField: "name",
    summaryFields: ["description"],
    fields: [
      { name: "name", label: "Name", type: "text", required: true, max: 80 },
      sortOrder,
      { name: "description", label: "Description (optional)", type: "text", max: 200, wide: true, short: "" },
    ],
  },
  {
    key: "hours",
    table: "business_hours",
    title: "Weekly hours",
    singular: "Day",
    description: "Your regular opening hours. Use Holiday & special hours for one-off changes.",
    group: "Hours",
    allowCreate: false,
    allowDelete: false,
    orderBy: [{ column: "id" }],
    titleField: "day_name",
    summaryFields: ["opens", "closes", "closed"],
    fields: [
      { name: "day_name", label: "Day", type: "text", readOnly: true },
      { name: "closed", label: "Closed all day", type: "boolean", default: false, short: "Closed" },
      { name: "opens", label: "Opens", type: "time", short: "Opens" },
      { name: "closes", label: "Closes", type: "time", help: "If you close after midnight, enter the closing time (e.g. 1:00 AM).", short: "Closes" },
    ],
  },
  {
    key: "special-hours",
    table: "special_hours",
    title: "Holiday & special hours",
    singular: "Special day",
    description: "Holiday closures or changed hours for a specific date. Past dates are hidden automatically.",
    group: "Hours",
    orderBy: [{ column: "date" }],
    titleField: "label",
    summaryFields: ["date", "closed", "opens", "closes"],
    fields: [
      { name: "date", label: "Date", type: "date", required: true, short: "" },
      { name: "label", label: "Name", type: "text", required: true, max: 80, placeholder: "Christmas Day" },
      { name: "closed", label: "Closed all day", type: "boolean", default: true, short: "Closed" },
      { name: "opens", label: "Opens (if open)", type: "time", short: "Opens" },
      { name: "closes", label: "Closes (if open)", type: "time", short: "Closes" },
    ],
  },
  {
    key: "inquiries",
    table: "inquiries",
    title: "Inquiries",
    singular: "Inquiry",
    description: "Everything sent through your website forms. A copy is also emailed to you.",
    group: "Inbox",
    allowCreate: false,
    orderBy: [{ column: "created_at", ascending: false }],
    titleField: "name",
    summaryFields: ["kind", "created_at", "preferred_date", "guest_count", "email"],
    toggleField: "handled",
    toggleOn: "Handled",
    toggleOff: "New",
    fields: [
      {
        name: "kind",
        label: "Type",
        short: "",
        type: "select",
        readOnly: true,
        options: [
          { value: "event", label: "Private event" },
          { value: "contact", label: "Contact" },
        ],
      },
      { name: "created_at", label: "Received", type: "datetime", readOnly: true, short: "Received" },
      { name: "name", label: "Name", type: "text", readOnly: true },
      { name: "email", label: "Email", type: "email", readOnly: true, short: "" },
      { name: "phone", label: "Phone", type: "tel", readOnly: true },
      { name: "preferred_date", label: "Preferred date", type: "date", readOnly: true, short: "Event date" },
      { name: "guest_count", label: "Guests", type: "number", readOnly: true, short: "Guests" },
      { name: "package", label: "Package", type: "text", readOnly: true },
      { name: "message", label: "Message", type: "textarea", readOnly: true, wide: true },
      { name: "email_sent", label: "Email notification sent", type: "boolean", readOnly: true, short: "Emailed" },
      { name: "handled", label: "Mark as handled", type: "boolean", default: false },
    ],
  },
];

export function getResource(key: string): ResourceDef | undefined {
  return RESOURCES.find((r) => r.key === key);
}

export const RESOURCE_GROUPS: ResourceGroup[] = ["Website", "Golf", "Events", "Food & drink", "Hours", "Inbox"];
