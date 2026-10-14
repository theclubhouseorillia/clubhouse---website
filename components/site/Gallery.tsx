"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon } from "@/components/icons";
import type { GalleryImage } from "@/lib/types";
import { PhotoSlot } from "./PhotoSlot";

export function Gallery({ images, categories }: { images: GalleryImage[]; categories: readonly string[] }) {
  const [filter, setFilter] = useState<string>("All");
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const lastTrigger = useRef<HTMLButtonElement | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const touchStart = useRef<number | null>(null);

  const usedCategories = useMemo(
    () => categories.filter((c) => images.some((img) => img.category === c)),
    [categories, images],
  );
  const visible = useMemo(
    () => (filter === "All" ? images : images.filter((img) => img.category === filter)),
    [filter, images],
  );

  const close = useCallback(() => {
    setOpenIndex(null);
    lastTrigger.current?.focus();
  }, []);
  const step = useCallback(
    (delta: number) => setOpenIndex((i) => (i === null ? i : (i + delta + visible.length) % visible.length)),
    [visible.length],
  );

  const isOpen = openIndex !== null;

  // When the viewer opens: lock page scroll and move focus to Close (once, not on every photo).
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, close, step]);

  if (!images.length) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        {categories.map((c) => (
          <PhotoSlot key={c} src={null} alt="" label={c} className="aspect-[4/3] rounded-[3px]" />
        ))}
      </div>
    );
  }

  const current = openIndex !== null ? visible[openIndex] : null;

  return (
    <div>
      {usedCategories.length > 1 && (
        <div className="mb-8 flex flex-wrap gap-2" role="group" aria-label="Filter photos">
          {["All", ...usedCategories].map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setFilter(c)}
              aria-pressed={filter === c}
              className={`min-h-11 rounded-sm border px-4 text-sm font-semibold transition ${
                filter === c
                  ? "border-gold bg-gold text-ink"
                  : "border-line text-cream/85 hover:border-gold hover:text-gold-2"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        {visible.map((img, i) => (
          <li key={img.id}>
            <button
              type="button"
              className="group relative block w-full overflow-hidden rounded-[3px] bg-coal-2"
              onClick={(e) => {
                lastTrigger.current = e.currentTarget;
                setOpenIndex(i);
              }}
              aria-label={`View larger: ${img.alt_text}`}
            >
              <PhotoSlot
                src={img.image_url}
                alt={img.alt_text}
                label={img.category}
                className="aspect-[4/3]"
                imageClassName="object-cover transition-transform duration-700 group-hover:scale-105"
                sizes="(min-width: 1024px) 33vw, 50vw"
              />
              <span className="pointer-events-none absolute inset-0 bg-ink/0 transition-colors duration-500 group-hover:bg-ink/25" />
            </button>
          </li>
        ))}
      </ul>

      {current && openIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Photo viewer"
          className="fixed inset-0 z-[70] flex flex-col bg-ink/[0.97]"
          onTouchStart={(e) => {
            touchStart.current = e.touches[0]?.clientX ?? null;
          }}
          onTouchEnd={(e) => {
            const start = touchStart.current;
            const end = e.changedTouches[0]?.clientX;
            touchStart.current = null;
            if (start === null || end === undefined) return;
            if (Math.abs(end - start) > 50) step(end < start ? 1 : -1);
          }}
        >
          <div className="flex items-center justify-between px-4 py-3 text-sm text-mist">
            <span aria-live="polite">
              {openIndex + 1} / {visible.length}
            </span>
            <button
              ref={closeRef}
              type="button"
              onClick={close}
              className="inline-flex h-12 w-12 items-center justify-center text-cream hover:text-gold-2"
              aria-label="Close photo viewer"
            >
              <CloseIcon width={26} height={26} />
            </button>
          </div>
          <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 sm:px-16" onClick={close}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={current.id}
              src={current.image_url}
              alt={current.alt_text}
              className="max-h-full max-w-full animate-fade-in object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            {visible.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    step(-1);
                  }}
                  className="absolute left-2 top-1/2 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-ink/70 text-cream hover:text-gold-2 sm:left-4"
                  aria-label="Previous photo"
                >
                  <ChevronLeftIcon width={26} height={26} />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    step(1);
                  }}
                  className="absolute right-2 top-1/2 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-ink/70 text-cream hover:text-gold-2 sm:right-4"
                  aria-label="Next photo"
                >
                  <ChevronRightIcon width={26} height={26} />
                </button>
              </>
            )}
          </div>
          <div className="min-h-16 px-6 py-4 text-center">
            <p className="text-cream">{current.caption || current.alt_text}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.2em] text-mist">{current.category}</p>
          </div>
        </div>
      )}
    </div>
  );
}
