import type { Metadata } from "next";
import { Gallery } from "@/components/site/Gallery";
import { PageHeader } from "@/components/site/SectionHeading";
import { getGallery } from "@/lib/data";
import { GALLERY_CATEGORIES } from "@/lib/defaults";

export const metadata: Metadata = {
  title: "Photo Gallery",
  description: "Golf simulator bays, the bar and lounge, live entertainment, private parties, food and drinks.",
  alternates: { canonical: "/gallery" },
};

export default async function GalleryPage() {
  const images = await getGallery();

  return (
    <>
      <PageHeader
        eyebrow="Gallery"
        title="Take a look around"
        intro="Simulator bays, the bar and lounge, live entertainment and private parties."
      />
      <section aria-label="Photos" className="py-16 sm:py-24">
        <div className="container-site">
          <Gallery images={images} categories={GALLERY_CATEGORIES} />
        </div>
      </section>
    </>
  );
}
