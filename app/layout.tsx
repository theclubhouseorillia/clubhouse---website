import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import type { ReactNode } from "react";
import { getHomepagePhotos, getSettings } from "@/lib/data";
import { real } from "@/lib/format";
import { siteUrl } from "@/lib/site";
import "./globals.css";

const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display-face",
  display: "swap",
});

const body = Manrope({
  subsets: ["latin"],
  variable: "--font-body-face",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#0a0b0a",
  colorScheme: "dark",
};

export async function generateMetadata(): Promise<Metadata> {
  const [settings, photos] = await Promise.all([getSettings(), getHomepagePhotos()]);
  const name = settings.business_name;
  const shareImage = photos.hero_photos[0] ?? settings.hero_image_url;
  const description =
    real(settings.seo_description) ??
    real(settings.hero_subheadline) ??
    `Golf simulators, a full sports bar and private events at ${name}.`;

  return {
    metadataBase: new URL(siteUrl()),
    title: { default: name, template: `%s | ${name}` },
    description,
    applicationName: name,
    openGraph: {
      type: "website",
      locale: "en_CA",
      siteName: name,
      title: name,
      description,
      images: shareImage ? [{ url: shareImage }] : undefined,
    },
    twitter: { card: "summary_large_image", title: name, description },
  };
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-CA" className={`${display.variable} ${body.variable}`} suppressHydrationWarning>
      <head>
        {/* Enables scroll animations only when JavaScript runs. */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
