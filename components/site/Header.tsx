"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CloseIcon, MenuIcon, PhoneIcon } from "@/components/icons";
import { navLinks, type LinkTarget, type NavVisibility } from "@/lib/site";
import { SmartLink } from "./SmartLink";

export function Header({
  businessName,
  logoUrl,
  booking,
  phoneHref,
  phoneLabel,
  nav,
}: {
  businessName: string;
  logoUrl: string | null;
  booking: LinkTarget;
  phoneHref: string | null;
  phoneLabel: string | null;
  nav: NavVisibility;
}) {
  const pathname = usePathname();
  const links = navLinks(nav);
  const desktopLinks = links.filter((l) => l.desktop);
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the mobile menu when the page changes.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header
      className={`sticky top-0 z-40 border-b transition-colors duration-300 ${
        scrolled || open ? "border-line bg-ink/95 backdrop-blur-md" : "border-transparent bg-ink/70 backdrop-blur-sm"
      }`}
    >
      <div className="mx-auto flex h-[4.5rem] w-full max-w-[96rem] items-center justify-between gap-6 px-5 md:px-8 lg:h-20">
        <Link href="/" className="flex min-w-0 items-center gap-3" aria-label={`${businessName}, home`}>
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="" className="h-10 w-auto max-w-[11rem] object-contain lg:h-12" />
          ) : (
            <span className="block max-w-[13rem] font-display text-lg font-semibold uppercase leading-[1.05] tracking-[0.06em] text-cream sm:max-w-[16rem] sm:text-xl">
              {businessName}
            </span>
          )}
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-4 min-[1440px]:flex">
          {desktopLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(link.href) ? "page" : undefined}
              className={`relative whitespace-nowrap py-2 text-xs font-semibold uppercase tracking-[0.1em] transition-colors hover:text-gold-2 ${
                isActive(link.href) ? "text-gold" : "text-cream/85"
              }`}
            >
              {link.short}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <SmartLink href={booking.href} className="btn btn-gold hidden min-h-11 px-5 sm:inline-flex">
            Book a Simulator
          </SmartLink>
          <button
            ref={toggleRef}
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-sm border border-line text-cream min-[1440px]:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      <div
        id="mobile-menu"
        hidden={!open}
        className="max-h-[calc(100svh-4.5rem)] overflow-y-auto border-t border-line bg-ink min-[1440px]:hidden"
      >
        <nav aria-label="Mobile" className="container-site flex flex-col py-4">
          <Link
            href="/"
            aria-current={pathname === "/" ? "page" : undefined}
            className={`border-b border-line/60 py-4 font-display text-2xl ${pathname === "/" ? "text-gold" : "text-cream"}`}
          >
            Home
          </Link>
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              aria-current={isActive(link.href) ? "page" : undefined}
              className={`border-b border-line/60 py-4 font-display text-2xl ${isActive(link.href) ? "text-gold" : "text-cream"}`}
            >
              {link.label}
            </Link>
          ))}
          <div className="mt-6 flex flex-col gap-3 pb-4">
            <SmartLink href={booking.href} className="btn btn-gold w-full">
              Book a Simulator
            </SmartLink>
            {phoneHref && (
              <a href={phoneHref} className="btn btn-outline w-full">
                <PhoneIcon width={16} height={16} />
                {phoneLabel ? `Call ${phoneLabel}` : "Call us"}
              </a>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
