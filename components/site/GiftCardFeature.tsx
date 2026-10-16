import Link from "next/link";
import { CheckIcon, ExternalIcon } from "@/components/icons";
import { real } from "@/lib/format";
import type { GiftCards } from "@/lib/types";
import { PhotoSlot } from "./PhotoSlot";

/**
 * Gift cards in "What's happening" on the homepage, beside the membership.
 * Uses the photo, intro, highlights and online shop link from Admin → Gift cards.
 */
export function GiftCardFeature({ giftCards }: { giftCards: GiftCards }) {
  const intro = real(giftCards.intro) ?? "Looking for a gift for the golfer in your life?";
  const highlights = giftCards.highlights.slice(0, 6);
  const amounts = giftCards.amounts;

  return (
    <article className="card group flex h-full flex-col overflow-hidden transition-colors duration-300 hover:border-gold/50">
      <div className="relative">
        <PhotoSlot
          src={giftCards.photo_url}
          alt={`${giftCards.heading}: The Clubhouse gift card`}
          label="Gift card"
          className="aspect-[16/10] bg-coal-2 md:aspect-[4/3]"
          imageClassName="object-contain p-5 transition-transform duration-700 group-hover:scale-[1.02]"
          sizes="(min-width: 768px) 45vw, 100vw"
        />
        <span className="absolute right-4 top-4 bg-ink/85 px-3 py-1.5 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-gold-2">
          {giftCards.heading}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-4 p-6 sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-gold">
          {giftCards.buy_url ? "Buy online in minutes" : "Call or email to order"}
        </p>
        <h3 className="font-display text-4xl font-semibold leading-tight text-cream">Give the gift of golf</h3>
        <p className="leading-relaxed text-mist">
          {intro} {giftCards.buy_url ? "Buy one online in minutes, or call or email us." : "Call or email us to order."}
        </p>
        {amounts.length > 0 && (
          <p className="text-sm text-cream/90">
            <span className="text-mist">Available in </span>
            {amounts.join(", ")}
          </p>
        )}
        {highlights.length > 0 && (
          <ul className="grid gap-y-2.5">
            {highlights.map((h) => (
              <li key={h} className="flex items-start gap-2.5 text-sm leading-snug text-cream/90">
                <CheckIcon width={16} height={16} className="mt-0.5 shrink-0 text-gold" />
                <span>{h}</span>
              </li>
            ))}
          </ul>
        )}
        {giftCards.buy_url && giftCards.qr_image_url && (
          // For people on a computer: scan with a phone to open the online shop.
          <div className="mt-2 hidden items-center gap-5 border border-line p-4 md:flex">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={giftCards.qr_image_url}
              alt="QR code to buy a gift card online"
              width={96}
              height={96}
              loading="lazy"
              className="h-24 w-24 shrink-0 bg-white"
            />
            <p className="text-sm leading-relaxed text-mist">
              <span className="block font-semibold text-cream">Scan to buy an eGift card</span>
              Point your phone&apos;s camera at the code to open our online gift card shop.
            </p>
          </div>
        )}
        <div className="mt-auto flex flex-col gap-3 pt-3 sm:flex-row md:flex-col lg:flex-row">
          {giftCards.buy_url ? (
            <>
              <a href={giftCards.buy_url} target="_blank" rel="noopener noreferrer" className="btn btn-gold w-full sm:flex-1 md:flex-none lg:flex-1">
                Buy a Gift Card
                <ExternalIcon width={16} height={16} />
              </a>
              <Link href="/gift-cards" className="btn btn-outline w-full sm:w-auto md:w-full lg:w-auto">
                More info
              </Link>
            </>
          ) : (
            <Link href="/gift-cards" className="btn btn-gold w-full">
              {giftCards.heading}
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
