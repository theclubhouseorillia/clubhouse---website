import type { Metadata } from "next";
import { PhotoSlot } from "@/components/site/PhotoSlot";
import { Reveal } from "@/components/site/Reveal";
import { PageHeader } from "@/components/site/SectionHeading";
import { getGallery, getMenu } from "@/lib/data";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = {
  title: "Food & Drink Menu",
  description: "Appetizers, wings, mains, craft beer, cocktails, spirits and non-alcoholic drinks.",
  alternates: { canonical: "/menu" },
};

function slug(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default async function MenuPage() {
  const [menu, gallery] = await Promise.all([getMenu(), getGallery()]);
  const foodPhotos = gallery.filter((g) => g.category === "Food & drinks").slice(0, 3);

  return (
    <>
      <PageHeader
        eyebrow="Food & drink"
        title="Eat, drink & stay a while"
        intro="Shareable bites, wings and mains from the kitchen, with craft beer, cocktails and spirits from the bar."
      />

      <div className="container-site grid gap-3 py-12 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <PhotoSlot
            key={i}
            src={foodPhotos[i]?.image_url}
            alt={foodPhotos[i]?.alt_text ?? ""}
            label={i === 1 ? "Cocktails" : "Food"}
            className={`aspect-[4/3] rounded-[3px] border border-line ${i > 0 ? "hidden sm:block" : ""}`}
            imageClassName="object-cover"
            sizes="(min-width: 640px) 33vw, 100vw"
          />
        ))}
      </div>

      {menu.length > 0 && (
        <nav aria-label="Menu sections" className="sticky top-[4.5rem] z-30 border-y border-line bg-ink/95 backdrop-blur-md lg:top-20">
          <ul className="container-site flex gap-2 overflow-x-auto py-3">
            {menu.map((cat) => (
              <li key={cat.id} className="shrink-0">
                <a
                  href={`#${slug(cat.name)}`}
                  className="inline-flex min-h-11 items-center rounded-sm border border-line px-4 text-sm font-semibold text-cream/90 transition hover:border-gold hover:text-gold-2"
                >
                  {cat.name}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}

      <div className="container-site flex flex-col gap-20 py-16 sm:py-24">
        {menu.map((cat) => (
          <section key={cat.id} id={slug(cat.name)} aria-labelledby={`${slug(cat.name)}-title`} className="scroll-mt-40">
            <Reveal>
              <div className="mb-8 flex flex-col gap-2 border-b border-gold/40 pb-5">
                <h2 id={`${slug(cat.name)}-title`} className="font-display text-4xl font-semibold text-cream sm:text-5xl">
                  {cat.name}
                </h2>
                {cat.description && <p className="text-mist">{cat.description}</p>}
              </div>
              {cat.items.length > 0 ? (
                <ul className="grid gap-x-14 gap-y-8 md:grid-cols-2">
                  {cat.items.map((item) => (
                    <li key={item.id} className="flex gap-5">
                      {item.image_url && (
                        <PhotoSlot
                          src={item.image_url}
                          alt={item.name}
                          label={item.name}
                          className="h-24 w-24 shrink-0 rounded-[3px] border border-line"
                          imageClassName="object-cover"
                          sizes="96px"
                        />
                      )}
                      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                        <div className="flex items-baseline gap-3">
                          <h3 className="text-lg font-semibold text-cream">{item.name}</h3>
                          <span className="min-w-6 flex-1 border-b border-dotted border-line" aria-hidden="true" />
                          {item.price !== null && (
                            <span className="font-display text-2xl font-semibold text-gold">{formatPrice(item.price)}</span>
                          )}
                        </div>
                        {item.description && <p className="text-sm leading-relaxed text-mist">{item.description}</p>}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-mist">Menu items coming soon.</p>
              )}
            </Reveal>
          </section>
        ))}
      </div>
    </>
  );
}
