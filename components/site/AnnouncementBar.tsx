"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRightIcon, ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";
import type { Announcement } from "@/lib/types";
import { SmartLink } from "./SmartLink";

const ROTATE_MS = 6000;

function isLive(a: Announcement, now: number): boolean {
  if (a.starts_at && new Date(a.starts_at).getTime() > now) return false;
  if (a.ends_at && new Date(a.ends_at).getTime() <= now) return false;
  return true;
}

export function AnnouncementBar({ items }: { items: Announcement[] }) {
  // Before hydration, trust the server's list; afterwards re-check start/end times
  // in case the page was cached.
  const [now, setNow] = useState<number | null>(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [userNavigated, setUserNavigated] = useState(false);

  useEffect(() => {
    setNow(Date.now());
    const tick = window.setInterval(() => setNow(Date.now()), 60_000);
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", onChange);
    return () => {
      window.clearInterval(tick);
      mq.removeEventListener("change", onChange);
    };
  }, []);

  const active = useMemo(() => (now === null ? items : items.filter((a) => isLive(a, now))), [items, now]);
  const count = active.length;
  const current = count ? active[index % count] : null;

  const go = useCallback(
    (delta: number) => {
      if (!count) return;
      setUserNavigated(true);
      setIndex((i) => (i + delta + count) % count);
    },
    [count],
  );

  useEffect(() => {
    if (count < 2 || paused || reducedMotion) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % count), ROTATE_MS);
    return () => window.clearInterval(id);
  }, [count, paused, reducedMotion]);

  if (!current) return null;

  const content = (
    <>
      <span>{current.message}</span>
      {current.link_url && (
        <span className="inline-flex shrink-0 items-center gap-1 font-semibold text-gold-2 underline-offset-4 group-hover:underline">
          {current.link_label || "Learn more"}
          <ArrowRightIcon width={14} height={14} />
        </span>
      )}
    </>
  );

  return (
    <section
      aria-label="Announcements"
      aria-roledescription="carousel"
      className="relative z-50 border-b border-gold/25 bg-forest text-cream"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="container-site flex min-h-11 items-center gap-1 sm:gap-3">
        {count > 1 && (
          <button
            type="button"
            onClick={() => go(-1)}
            className="-ml-2 inline-flex h-11 w-11 shrink-0 items-center justify-center text-cream/80 transition hover:text-gold-2"
            aria-label="Previous announcement"
          >
            <ChevronLeftIcon width={18} height={18} />
          </button>
        )}

        <div
          className="min-w-0 flex-1 py-2 text-center text-[0.8125rem] leading-snug sm:text-sm"
          aria-live={userNavigated || paused ? "polite" : "off"}
          aria-atomic="true"
        >
          <div key={current.id} className="animate-fade-in">
            {current.link_url ? (
              <SmartLink
                href={current.link_url}
                className="group inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5"
              >
                {content}
              </SmartLink>
            ) : (
              <span className="inline-flex flex-wrap items-center justify-center gap-x-2">{content}</span>
            )}
          </div>
        </div>

        {count > 1 && (
          <div className="flex shrink-0 items-center">
            <span className="hidden text-xs tabular-nums text-cream/60 sm:inline" aria-hidden="true">
              {(index % count) + 1} / {count}
            </span>
            <button
              type="button"
              onClick={() => go(1)}
              className="-mr-2 inline-flex h-11 w-11 items-center justify-center text-cream/80 transition hover:text-gold-2"
              aria-label="Next announcement"
            >
              <ChevronRightIcon width={18} height={18} />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
