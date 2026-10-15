import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckIcon, ExternalIcon, MailIcon, PhoneIcon } from "@/components/icons";
import { PhotoSlot } from "@/components/site/PhotoSlot";
import { Reveal } from "@/components/site/Reveal";
import { PageHeader } from "@/components/site/SectionHeading";
import { getGiftCards, getSettings } from "@/lib/data";
import { real, telHref } from "@/lib/format";
import { giftCardEmailHref } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const [gift, settings] = await Promise.all([getGiftCards(), getSettings()]);
  const how = gift.buy_url ? "Buy one online or call us." : "Call or email us to order.";
  return {
    title: gift.heading,
    description: real(gift.intro)?.slice(0, 160) ?? `Give the gift of golf with a ${settings.business_name} gift card. ${how}`,
    alternates: { canonical: "/gift-cards" },
  };
}

export default async function GiftCardsPage() {
  const [gift, settings] = await Promise.all([getGiftCards(), getSettings()]);
  if (!gift.enabled) notFound();

  const phone = real(settings.phone);
  const tel = telHref(settings.phone);
  const email = real(settings.public_email);
  const emailHref = giftCardEmailHref(settings.public_email);
  const howToOrder = real(gift.how_to_order);
  const buyUrl = gift.buy_url;

  const contactButtons = (tel || emailHref) && (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
      {tel && phone && (
        <a href={tel} className={`btn ${buyUrl ? "btn-outline" : "btn-gold"} w-full sm:w-auto`}>
          <PhoneIcon width={18} height={18} />
          Call {phone}
        </a>
      )}
      {emailHref && email && (
        <a href={emailHref} className="btn btn-outline w-full sm:w-auto">
          <MailIcon width={18} height={18} />
          Email us
        </a>
      )}
    </div>
  );

  return (
    <>
      <PageHeader eyebrow="Give the gift of golf" title={gift.heading} intro={real(gift.intro) ?? undefined} />

      <section aria-labelledby="order-title" className="py-20 sm:py-24">
        <div className="container-site grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal className="card flex flex-col gap-7 p-7 sm:p-10">
            {buyUrl ? (
              <>
                <div className="flex flex-col gap-3">
                  <span className="eyebrow">Buy online</span>
                  <h2 id="order-title" className="font-display text-4xl font-semibold text-cream">
                    Send a gift card in minutes
                  </h2>
                  <p className="text-lg leading-relaxed text-mist">
                    Choose an amount, add a personal message and we&apos;ll send it by email or text.
                  </p>
                </div>
                <a href={buyUrl} target="_blank" rel="noopener noreferrer" className="btn btn-gold w-full sm:w-auto sm:self-start">
                  Buy a gift card online
                  <ExternalIcon width={18} height={18} />
                </a>

                {gift.qr_image_url && (
                  <div className="flex items-center gap-5 border-t border-line pt-6">
                    <div className="shrink-0 rounded-[4px] bg-white p-2">
                      <img
                        src={gift.qr_image_url}
                        alt="QR code that opens our online gift card shop"
                        width={132}
                        height={132}
                        className="block h-[132px] w-[132px]"
                        style={{ imageRendering: "pixelated" }}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <h3 className="font-display text-2xl font-semibold text-cream">On your phone?</h3>
                      <p className="text-mist">Scan the code with your camera to open the gift card shop.</p>
                    </div>
                  </div>
                )}

                {contactButtons && (
                  <div className="flex flex-col gap-4 border-t border-line pt-6">
                    <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-mist">Prefer to order by phone or email?</h3>
                    {howToOrder && <p className="leading-relaxed whitespace-pre-line text-mist">{howToOrder}</p>}
                    {contactButtons}
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="flex flex-col gap-3">
                  <span className="eyebrow">How to order</span>
                  <h2 id="order-title" className="font-display text-4xl font-semibold text-cream">
                    Call or email us
                  </h2>
                  {howToOrder && <p className="text-lg leading-relaxed whitespace-pre-line text-mist">{howToOrder}</p>}
                </div>
                {contactButtons}
                {email && emailHref && <p className="-mt-3 text-sm text-mist">{email}</p>}
                {!tel && !emailHref && (
                  <Link href="/contact" className="btn btn-gold self-start">
                    Contact us to order
                  </Link>
                )}
              </>
            )}

            {gift.amounts.length > 0 && (
              <div className="flex flex-col gap-3 border-t border-line pt-6">
                <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-mist">Popular amounts</h3>
                <ul className="flex flex-wrap gap-2">
                  {gift.amounts.map((amount) => (
                    <li
                      key={amount}
                      className="rounded-sm border border-gold/50 px-4 py-2 font-display text-xl font-semibold text-gold"
                    >
                      {amount}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {gift.highlights.length > 0 && (
              <ul className="flex flex-col gap-3 border-t border-line pt-6">
                {gift.highlights.map((h) => (
                  <li key={h} className="flex gap-3 text-cream/90">
                    <CheckIcon width={20} height={20} className="mt-0.5 shrink-0 text-gold" />
                    {h}
                  </li>
                ))}
              </ul>
            )}
          </Reveal>

          <Reveal delay={100} className="overflow-hidden rounded-[18px] border border-line">
            <PhotoSlot
              src={gift.photo_url}
              alt={`${settings.business_name} gift card`}
              label="Gift cards"
              className="aspect-[16/10] bg-coal"
              sizes="(min-width: 1024px) 50vw, 100vw"
            />
          </Reveal>
        </div>
      </section>
    </>
  );
}
