import "server-only";
import { cache } from "react";

// Latest Instagram posts through a Behold.so JSON feed (https://behold.so). The owner
// connects their Instagram on Behold once and pastes the feed link in
// Admin → Settings → "Instagram feed link (Behold)". No Instagram passwords or tokens
// are stored on this site.

export interface InstagramPost {
  id: string;
  permalink: string;
  imageUrl: string;
  alt: string;
}

/** Re-check the feed at most every 30 minutes. */
const REVALIDATE_SECONDS = 1800;

type BeholdSize = { mediaUrl?: string };
type BeholdPost = {
  id?: string;
  permalink?: string;
  mediaType?: string;
  mediaUrl?: string;
  thumbnailUrl?: string;
  altText?: string;
  prunedCaption?: string;
  caption?: string;
  sizes?: { small?: BeholdSize; medium?: BeholdSize; large?: BeholdSize };
};

export function isBeholdFeedUrl(url: string | null | undefined): url is string {
  return !!url && /^https:\/\/feeds\.behold\.so\/[A-Za-z0-9_-]+\/?$/.test(url.trim());
}

function toPost(p: BeholdPost): InstagramPost | null {
  if (!p.id || !p.permalink || !/^https:\/\/(www\.)?instagram\.com\//.test(p.permalink)) return null;
  // Behold's resized images; videos fall back to their cover image.
  const imageUrl = p.sizes?.medium?.mediaUrl || p.sizes?.small?.mediaUrl || p.thumbnailUrl || (p.mediaType === "VIDEO" ? "" : p.mediaUrl) || "";
  if (!/^https:\/\//.test(imageUrl)) return null;
  const words = (p.altText || p.prunedCaption || p.caption || "").replace(/\s+/g, " ").trim();
  const alt = words ? (words.length > 120 ? `${words.slice(0, 117)}…` : words) : "Instagram post";
  return { id: p.id, permalink: p.permalink, imageUrl, alt };
}

/** The newest posts, or [] if no feed is set up or it can't be reached. */
export const getInstagramPosts = cache(async (feedUrl: string | null | undefined, limit = 6): Promise<InstagramPost[]> => {
  if (!isBeholdFeedUrl(feedUrl)) return [];
  try {
    const res = await fetch(feedUrl.trim(), { next: { revalidate: REVALIDATE_SECONDS }, signal: AbortSignal.timeout(5000) });
    if (!res.ok) return [];
    const json: unknown = await res.json();
    // v2 feeds: { posts: [...] }; older v1 feeds: [...]
    const raw = Array.isArray(json) ? json : (json as { posts?: unknown })?.posts;
    if (!Array.isArray(raw)) return [];
    return raw
      .map((p) => toPost(p as BeholdPost))
      .filter((p): p is InstagramPost => p !== null)
      .slice(0, limit);
  } catch {
    return [];
  }
});
