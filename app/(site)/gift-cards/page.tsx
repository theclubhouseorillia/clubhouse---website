import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckIcon, MailIcon, PhoneIcon } from "@/components/icons";
import { PhotoSlot } from "@/components/site/PhotoSlot";
import { Reveal } from "@/components/site/Reveal";
import { PageHeader } from "@/components/site/SectionHeading";
import { getGiftCards, getSettings } from "@/lib/data";
import { real, telHref } from "@/lib/format";
import { giftCardEmailHref } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const [gift, settings] = await Promise.all([getGiftCards(), getSettings()]);
  return {
    title: gift.heading,
    description:
      real(gift.intro)?.slice(0, 160) ?? `Give the gift of golf with a ${settings.business_name} gift card. Call or email us to order.`,
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

  return (
    <>
      <PageHeader eyebrow="Give the gift of golf" title={gift.heading} intro={real(gift.intro) ?? undefined} />

      <section aria-labelledby="order-title" className="py-20 sm:py-24">
        <div className="container-site grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal className="card flex flex-col gap-7 p-7 sm:p-10">
            <div className="flex flex-col gap-3">
              <span className="eyebrow">How to order</span>
              <h2 id="order-title" className="font-display text-4xl font-semibold text-cream">
                Call or email us
              </h2>
              {howToOrder && <p className="text-lg leading-relaxed whitespace-pre-line text-mist">{howToOrder}</p>}
            </div>

            {(tel || emailHref) && (
              <div className="flex flex-col gap-3">
                {tel && phone && (
                  <a href={tel} className="btn btn-gold w-full sm:w-auto sm:self-start">
                    <PhoneIcon width={18} height={18} />
                    Call {phone}
                  </a>
                )}
                {emailHref && email && (
                  <a href={emailHref} className="btn btn-outline w-full break-all sm:w-auto sm:self-start">
                    <MailIcon width={18} height={18} />
                    Email us
                  </a>
                )}
                {email && <p className="text-sm text-mist">{email}</p>}
              </div>
            )}
            {!tel && !emailHref && (
              <Link href="/contact" className="btn btn-gold self-start">
                Contact us to order
              </Link>
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

          <Reveal delay={100} className="overflow-hidden rounded-[4px] border border-line">
            <PhotoSlot
              src={gift.photo_url}
              alt={`${settings.business_name} gift card`}
              label="Gift cards"
              className="aspect-[4/3] bg-coal"
              sizes="(min-width: 1024px) 50vw, 100vw"
            />
          </Reveal>
        </div>
      </section>
    </>
  );
}
