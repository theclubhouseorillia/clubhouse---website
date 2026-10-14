"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-ink px-6 py-24 text-center">
      <div className="flex max-w-md flex-col items-center gap-6">
        <p className="eyebrow">Something went wrong</p>
        <h1 className="font-display text-5xl font-semibold text-cream">We hit a snag</h1>
        <p className="text-mist">Sorry, this page didn&apos;t load properly. Please try again in a moment.</p>
        <div className="flex flex-wrap justify-center gap-3">
          <button type="button" onClick={reset} className="btn btn-gold">
            Try again
          </button>
          <Link href="/" className="btn btn-outline">
            Go home
          </Link>
        </div>
      </div>
    </main>
  );
}
