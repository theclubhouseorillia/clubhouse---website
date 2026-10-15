import type { InstagramPost } from "@/lib/instagram";
import { SectionHeading } from "./SectionHeading";

/** "https://www.instagram.com/theclubhouseorillia?utm…" → "theclubhouseorillia" */
export function instagramHandle(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (!/(^|\.)instagram\.com$/.test(u.hostname)) return null;
    const handle = u.pathname.split("/").filter(Boolean)[0];
    return handle && /^[A-Za-z0-9._]+$/.test(handle) ? handle : null;
  } catch {
    return null;
  }
}

/** The latest Instagram posts as a row of square photos, each opening the post on Instagram. */
export function InstagramStrip({ posts, profileUrl }: { posts: InstagramPost[]; profileUrl: string | null }) {
  const handle = instagramHandle(profileUrl);
  return (
    <section aria-labelledby="instagram-title" className="border-t border-line py-24 sm:py-28">
      <div className="container-site">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading id="instagram-title" eyebrow="Instagram" title={handle ? `Follow along @${handle}` : "Follow along on Instagram"} />
          {profileUrl && (
            <a href={profileUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
              Follow us on Instagram
            </a>
          )}
        </div>
        <ul className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {posts.map((post) => (
            <li key={post.id}>
              <a
                href={post.permalink}
                target="_blank"
                rel="noopener noreferrer"
                className="group block aspect-square overflow-hidden rounded-[4px] border border-line bg-coal"
              >
                <img
                  src={post.imageUrl}
                  alt={post.alt}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
                <span className="sr-only"> (opens Instagram)</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
