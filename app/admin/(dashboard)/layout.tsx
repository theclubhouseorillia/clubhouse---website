import Link from "next/link";
import type { ReactNode } from "react";
import { AdminNav } from "@/components/admin/AdminNav";
import { ExternalIcon } from "@/components/icons";
import { requireAdmin } from "@/lib/auth";
import { signOut } from "../actions";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const { user } = await requireAdmin();

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[270px_minmax(0,1fr)]">
      <aside className="border-b border-line bg-coal lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between gap-4 px-5 py-5">
          <Link href="/admin" className="font-display text-2xl font-semibold text-cream">
            Dashboard
          </Link>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-gold hover:text-gold-2"
          >
            View site <ExternalIcon width={14} height={14} />
          </a>
        </div>
        <AdminNav />
        <div className="hidden border-t border-line px-5 py-5 text-xs text-mist lg:block">
          <p className="mb-3 break-all">Signed in as {user.email}</p>
          <form action={signOut}>
            <button type="submit" className="link-gold">
              Sign out
            </button>
          </form>
        </div>
      </aside>
      <div className="min-w-0">
        <div className="flex items-center justify-end gap-4 border-b border-line px-5 py-3 text-xs text-mist lg:hidden">
          <span className="truncate">{user.email}</span>
          <form action={signOut}>
            <button type="submit" className="link-gold min-h-11">
              Sign out
            </button>
          </form>
        </div>
        <main className="mx-auto w-full max-w-5xl px-5 py-8 sm:px-8 lg:py-12">{children}</main>
      </div>
    </div>
  );
}
