"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { RESOURCES, RESOURCE_GROUPS } from "@/lib/resources";

function NavLinks({ pathname }: { pathname: string }) {
  const linkClass = (active: boolean) =>
    `block rounded-[3px] px-3 py-2.5 text-sm transition ${
      active ? "bg-forest font-semibold text-gold-2" : "text-cream/80 hover:bg-coal-2 hover:text-cream"
    }`;

  return (
    <div className="flex flex-col gap-6">
      <ul>
        <li>
          <Link href="/admin" className={linkClass(pathname === "/admin")} aria-current={pathname === "/admin" ? "page" : undefined}>
            Overview
          </Link>
        </li>
        <li>
          <Link
            href="/admin/membership-sheet"
            className={linkClass(pathname === "/admin/membership-sheet")}
            aria-current={pathname === "/admin/membership-sheet" ? "page" : undefined}
          >
            Membership spreadsheet
          </Link>
        </li>
      </ul>
      {RESOURCE_GROUPS.map((group) => (
        <div key={group}>
          <p className="mb-2 px-3 text-[0.65rem] font-bold uppercase tracking-[0.22em] text-mist">{group}</p>
          <ul className="flex flex-col gap-0.5">
            {RESOURCES.filter((r) => r.group === group).map((r) => {
              const href = `/admin/${r.key}`;
              const active = pathname === href;
              return (
                <li key={r.key}>
                  <Link href={href} className={linkClass(active)} aria-current={active ? "page" : undefined}>
                    {r.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
      <div>
        <p className="mb-2 px-3 text-[0.65rem] font-bold uppercase tracking-[0.22em] text-mist">Account</p>
        <ul>
          <li>
            <Link
              href="/admin/account"
              className={linkClass(pathname === "/admin/account")}
              aria-current={pathname === "/admin/account" ? "page" : undefined}
            >
              Change password
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
}

export function AdminNav() {
  const pathname = usePathname();
  const detailsRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    if (detailsRef.current) detailsRef.current.open = false;
  }, [pathname]);

  return (
    <>
      {/* Phones and tablets: collapsible menu */}
      <details ref={detailsRef} className="border-t border-line lg:hidden">
        <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-5 text-sm font-semibold uppercase tracking-[0.14em] text-cream">
          Menu
          <span aria-hidden="true" className="text-gold">
            ▾
          </span>
        </summary>
        <nav aria-label="Dashboard" className="px-3 pb-5">
          <NavLinks pathname={pathname} />
        </nav>
      </details>
      {/* Desktop: always visible */}
      <nav aria-label="Dashboard" className="hidden px-3 py-6 lg:block">
        <NavLinks pathname={pathname} />
      </nav>
    </>
  );
}
