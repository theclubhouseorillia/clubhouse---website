import type { NextConfig } from "next";

// Uploaded photos live in Supabase Storage. Allow Next.js to optimise them.
function supabaseHostname(): string | undefined {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    return url ? new URL(url).hostname : undefined;
  } catch {
    return undefined;
  }
}

const host = supabaseHostname();

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: host
      ? [{ protocol: "https", hostname: host, pathname: "/storage/v1/object/public/**" }]
      : [],
  },
  eslint: {
    // Linting is optional for this project; don't block deployments on it.
    ignoreDuringBuilds: true,
  },
  async redirects() {
    return [
      {
        // Short link printed on receipts and bay cards: opens the Google review box for the venue.
        source: "/review",
        destination: "https://search.google.com/local/writereview?placeid=ChIJ43879x-vKk0RYnAn8ontIOA",
        permanent: false,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
