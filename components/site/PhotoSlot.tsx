import { FlagIcon } from "@/components/icons";
import { SmartImage } from "./SmartImage";

/** A photo, or an elegant labelled placeholder until one is uploaded. */
export function PhotoSlot({
  src,
  alt,
  label,
  sizes,
  className = "",
  imageClassName,
  priority,
}: {
  src: string | null | undefined;
  alt: string;
  label: string;
  sizes?: string;
  className?: string;
  imageClassName?: string;
  priority?: boolean;
}) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {src ? (
        <SmartImage src={src} alt={alt} sizes={sizes} className={imageClassName} priority={priority} />
      ) : (
        <div className="dimples absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center" role="img" aria-label={`${label} (photo coming soon)`}>
          <FlagIcon width={28} height={28} className="text-gold" />
          <span className="text-xs font-semibold uppercase tracking-[0.24em] text-mist">{label}</span>
        </div>
      )}
    </div>
  );
}
