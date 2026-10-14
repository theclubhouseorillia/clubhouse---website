import { PhoneIcon } from "@/components/icons";
import type { LinkTarget } from "@/lib/site";
import { SmartLink } from "./SmartLink";

/** Always-visible booking bar on phones. */
export function MobileBookBar({ booking, phoneHref }: { booking: LinkTarget; phoneHref: string | null }) {
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-ink/95 backdrop-blur-md md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex gap-2 px-3 py-2.5">
        {phoneHref && (
          <a href={phoneHref} className="btn btn-outline min-h-12 w-14 shrink-0 px-0" aria-label="Call us">
            <PhoneIcon width={18} height={18} />
          </a>
        )}
        <SmartLink href={booking.href} className="btn btn-gold min-h-12 flex-1">
          Book a Simulator
        </SmartLink>
      </div>
    </div>
  );
}
