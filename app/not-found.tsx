import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-ink px-6 py-24 text-center">
      <div className="dimples pointer-events-none fixed inset-0 opacity-30" aria-hidden="true" />
      <div className="relative flex max-w-md flex-col items-center gap-6">
        <p className="eyebrow">404</p>
        <h1 className="font-display text-5xl font-semibold text-cream">Out of bounds</h1>
        <p className="text-mist">We couldn&apos;t find that page. It may have moved.</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn btn-gold">
            Back to home
          </Link>
          <Link href="/events" className="btn btn-outline">
            See events
          </Link>
        </div>
      </div>
    </main>
  );
}
