"use client";

import { useCallback, useRef, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";
import { PhotoSlot } from "./PhotoSlot";
import { SmartImage } from "./SmartImage";

/**
 * A set of photos: swipe on phones, arrows and dots on any screen. One photo
 * shows on its own. With no photos it shows a labelled placeholder, or nothing
 * when `hideWhenEmpty` is set.
 */
export function PhotoCarousel({
  photos,
  label,
  sizes = "(min-width: 1024px) 33vw, 100vw",
  className = "aspect-[4/3]",
  hideWhenEmpty = false,
}: {
  photos: string[];
  /** What the photos show, e.g. "Private Bay". Used for descriptions and the placeholder. */
  label: string;
  sizes?: string;
  className?: string;
  hideWhenEmpty?: boolean;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const count = photos.length;

  const goTo = useCallback((i: number) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollTo({ left: i * track.clientWidth, behavior: "smooth" });
  }, []);

  const onScroll = () => {
    const track = trackRef.current;
    if (!track || !track.clientWidth) return;
    setIndex(Math.round(track.scrollLeft / track.clientWidth));
  };

  if (count === 0 && hideWhenEmpty) return null;

  if (count <= 1) {
    return (
      <PhotoSlot
        src={photos[0]}
        alt={label}
        label={label}
        className={className}
        imageClassName="object-cover"
        sizes={sizes}
      />
    );
  }

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label={`${label} photos`}
      className={`group/photos relative overflow-hidden bg-coal-2 ${className}`}
    >
      <div
        ref={trackRef}
        onScroll={onScroll}
        className="no-scrollbar absolute inset-0 flex snap-x snap-mandatory overflow-x-auto scroll-smooth"
      >
        {photos.map((src, i) => (
          <div
            key={src}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${count}`}
            className="relative h-full w-full shrink-0 snap-center"
          >
            <SmartImage src={src} alt={`${label}, photo ${i + 1} of ${count}`} sizes={sizes} className="object-cover" />
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => goTo(Math.max(0, index - 1))}
        disabled={index === 0}
        className="absolute left-2 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-ink/75 text-cream transition hover:text-gold-2 disabled:opacity-0"
        aria-label={`Previous photo: ${label}`}
      >
        <ChevronLeftIcon width={22} height={22} />
      </button>
      <button
        type="button"
        onClick={() => goTo(Math.min(count - 1, index + 1))}
        disabled={index >= count - 1}
        className="absolute right-2 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-ink/75 text-cream transition hover:text-gold-2 disabled:opacity-0"
        aria-label={`Next photo: ${label}`}
      >
        <ChevronRightIcon width={22} height={22} />
      </button>

      <div className="absolute inset-x-0 bottom-2 flex justify-center gap-1">
        {photos.map((src, i) => (
          <button
            key={src}
            type="button"
            onClick={() => goTo(i)}
            aria-label={`Show photo ${i + 1} of ${count}`}
            aria-current={i === index ? "true" : undefined}
            className="inline-flex h-6 w-6 items-center justify-center"
          >
            <span
              className={`block h-2 rounded-full transition-all ${i === index ? "w-5 bg-gold" : "w-2 bg-cream/60"}`}
              aria-hidden="true"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
