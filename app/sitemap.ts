import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const now = new Date();
  const pages: { path: string; priority: number; freq: "daily" | "weekly" | "monthly" }[] = [
    { path: "", priority: 1, freq: "weekly" },
    { path: "/pricing", priority: 0.9, freq: "monthly" },
    { path: "/league", priority: 0.8, freq: "weekly" },
    { path: "/events", priority: 0.9, freq: "daily" },
    { path: "/calendar", priority: 0.8, freq: "daily" },
    { path: "/private-events", priority: 0.9, freq: "monthly" },
    { path: "/menu", priority: 0.7, freq: "monthly" },
    { path: "/gallery", priority: 0.6, freq: "monthly" },
    { path: "/contact", priority: 0.8, freq: "monthly" },
    { path: "/sports", priority: 0.7, freq: "daily" },
    { path: "/courses", priority: 0.7, freq: "monthly" },
    { path: "/memberships", priority: 0.7, freq: "monthly" },
    { path: "/gift-cards", priority: 0.7, freq: "monthly" },
    { path: "/faq", priority: 0.6, freq: "monthly" },
    { path: "/privacy", priority: 0.2, freq: "monthly" },
  ];
  return pages.map((p) => ({
    url: `${base}${p.path}`,
    lastModified: now,
    changeFrequency: p.freq,
    priority: p.priority,
  }));
}
