import type { Metadata } from "next";
import { DownloadIcon } from "@/components/icons";
import { PageHeader } from "@/components/site/SectionHeading";
import { SmartImage } from "@/components/site/SmartImage";
import { getMenuSettings, getSettings } from "@/lib/data";
import { real } from "@/lib/format";

export const metadata: Metadata = {
  title: "Food & Drink Menu",
  description: "Our full food and drink menu: starters, wings, pizza, hot dogs, beer, cocktails, shots and more.",
  alternates: { canonical: "/menu" },
};

export default async function MenuPage() {
  const [menu, settings] = await Promise.all([getMenuSettings(), getSettings()]);
  const pdf = menu.pdf_url;
  const pages = menu.page_images;

  return (
    <>
      <PageHeader eyebrow="Food & drink" title={menu.heading} intro={real(menu.intro) ?? undefined} />

      <section aria-label="Menu" className="py-12 sm:py-16">
        <div className="container-site flex flex-col items-center gap-8 sm:gap-10">
          {pdf && (
            <a href={pdf} target="_blank" rel="noopener noreferrer" className="btn btn-gold">
              <DownloadIcon width={18} height={18} />
              Open or download the menu (PDF)
            </a>
          )}

          {pages.length > 0 ? (
            <ol aria-label="Menu pages" className="flex w-full max-w-[860px] flex-col gap-6 sm:gap-8">
              {pages.map((src, i) => (
                <li
                  key={`${src}-${i}`}
                  className="relative aspect-[17/22] overflow-hidden rounded-[4px] border border-line bg-[#F6F0E1] shadow-[0_24px_60px_-28px_rgba(0,0,0,0.75)]"
                >
                  <SmartImage
                    src={src}
                    alt={`${settings.business_name} menu, page ${i + 1} of ${pages.length}`}
                    sizes="(min-width: 920px) 860px, 100vw"
                    className="object-contain"
                    priority={i === 0}
                  />
                </li>
              ))}
            </ol>
          ) : pdf ? (
            <object
              data={pdf}
              type="application/pdf"
              aria-label={`${settings.business_name} menu`}
              className="h-[80vh] w-full max-w-[860px] rounded-[4px] border border-line bg-coal"
            >
              <p className="p-8 text-mist">
                Your browser can&apos;t show the menu here.{" "}
                <a href={pdf} className="link-gold">
                  Open the menu (PDF)
                </a>
                .
              </p>
            </object>
          ) : (
            <p className="card max-w-xl p-8 text-center text-mist">
              Our menu is being updated. Please ask your server, or give us a call.
            </p>
          )}

          {pdf && pages.length > 1 && (
            <a href={pdf} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
              <DownloadIcon width={18} height={18} />
              Download the menu (PDF)
            </a>
          )}
        </div>
      </section>
    </>
  );
}
