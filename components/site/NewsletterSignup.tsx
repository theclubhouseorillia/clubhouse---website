"use client";

import { usePathname } from "next/navigation";
import { startTransition, useActionState, useEffect, useRef, useState, type FormEvent } from "react";
import { subscribeNewsletter, type NewsletterState } from "@/app/actions/newsletter";
import { newsletterConsentText } from "@/lib/newsletter";

const initialState: NewsletterState = { status: "idle", message: "", fieldErrors: {}, submissionId: 0 };

/** "Stay in the loop" email sign-up band at the top of the footer. */
export function NewsletterSignup({ businessName }: { businessName: string }) {
  const [state, formAction, pending] = useActionState(subscribeNewsletter, initialState);
  const [startedAt, setStartedAt] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const err = state.fieldErrors;

  useEffect(() => {
    setStartedAt(String(Date.now()));
  }, []);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
      setStartedAt(String(Date.now()));
    }
    if (state.status !== "idle") statusRef.current?.focus();
  }, [state]);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    startTransition(() => formAction(data));
  };

  return (
    <section aria-labelledby="newsletter-title" className="border-b border-line">
      <div className="container-site grid gap-8 py-14 lg:grid-cols-[1fr_1.25fr] lg:items-center lg:gap-16">
        <div className="flex flex-col gap-3">
          <p className="eyebrow">Stay in the loop</p>
          <h2 id="newsletter-title" className="font-display text-3xl font-semibold uppercase tracking-[0.04em] text-cream sm:text-4xl">
            Leagues, events and specials in your inbox
          </h2>
          <p className="max-w-md text-mist">Be first to hear about new leagues, holiday events and special offers. No spam, ever.</p>
        </div>

        <form ref={formRef} onSubmit={onSubmit} noValidate className="relative flex flex-col gap-4">
          <input type="hidden" name="started_at" value={startedAt} />
          <input type="hidden" name="source" value={pathname ?? ""} />
          <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
            <label htmlFor="nl-company_website">Leave this field empty</label>
            <input id="nl-company_website" name="company_website" type="text" tabIndex={-1} autoComplete="off" />
          </div>

          {/* Phones: name, email, consent, button. Wider screens: name | email | button, consent underneath. */}
          <div className="grid gap-3 sm:grid-cols-[11rem_minmax(0,1fr)_auto]">
            <div>
              <label htmlFor="nl-first_name" className="sr-only">
                First name (optional)
              </label>
              <input
                id="nl-first_name"
                name="first_name"
                type="text"
                autoComplete="given-name"
                maxLength={60}
                placeholder="First name"
                className="field"
              />
            </div>
            <div className="min-w-0">
              <label htmlFor="nl-email" className="sr-only">
                Email address
              </label>
              <input
                id="nl-email"
                name="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                required
                maxLength={200}
                placeholder="Your email address"
                className="field"
                aria-invalid={err.email ? true : undefined}
                aria-describedby={err.email ? "nl-status" : undefined}
              />
            </div>
            <label
              htmlFor="nl-consent"
              className="mt-1 flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-mist sm:col-span-3 sm:row-start-2"
            >
              <input
                id="nl-consent"
                name="consent"
                type="checkbox"
                value="yes"
                required
                className="mt-1 h-4 w-4 shrink-0 accent-gold"
                aria-invalid={err.consent ? true : undefined}
                aria-describedby={err.consent ? "nl-status" : undefined}
              />
              <span>
                {newsletterConsentText(businessName)}{" "}
                <a href="/privacy" className="underline underline-offset-4 transition hover:text-gold-2">
                  Privacy policy
                </a>
              </span>
            </label>
            <button
              type="submit"
              className="btn btn-gold mt-1 sm:col-start-3 sm:row-start-1 sm:mt-0"
              disabled={pending || !startedAt}
            >
              {pending ? "Signing up…" : "Sign me up"}
            </button>
          </div>

          <div
            id="nl-status"
            ref={statusRef}
            tabIndex={-1}
            role={state.status === "error" ? "alert" : "status"}
            aria-live="polite"
            className="outline-none"
          >
            {state.status === "success" && (
              <p className="rounded-[3px] border border-gold/50 bg-forest px-4 py-3 text-cream">{state.message}</p>
            )}
            {state.status === "error" && (
              <p className="rounded-[3px] border border-danger/60 bg-danger/10 px-4 py-3 text-danger">{state.message}</p>
            )}
          </div>
        </form>
      </div>
    </section>
  );
}
