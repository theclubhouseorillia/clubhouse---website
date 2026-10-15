"use client";

import { useEffect, useState } from "react";
import { SmartImage } from "./SmartImage";

const SLIDE_MS = 6000;

/** Hero background: one photo, or several that slowly cross-fade. */
export function HeroBackground({ photos }: { photos: string[] }) {
  const [index, setIndex] = useState(0);
  const count = photos.length;

  useEffect(() => {
    if (count < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % count), SLIDE_MS);
    return () => window.clearInterval(id);
  }, [count]);

  if (count === 0) return <div className="dimples absolute inset-0 opacity-60" />;

  return (
    <>
      {photos.map((src, i) => (
        <div
          key={src}
          className={`absolute inset-0 transition-opacity duration-[1500ms] ease-in-out ${
            i === index ? "opacity-100" : "opacity-0"
          }`}
          aria-hidden="true"
        >
          <SmartImage src={src} alt="" priority={i === 0} sizes="100vw" className="object-cover" />
        </div>
      ))}
      <div className="absolute inset-0 bg-ink/65" />
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-ink to-transparent" />
    </>
  );
}
