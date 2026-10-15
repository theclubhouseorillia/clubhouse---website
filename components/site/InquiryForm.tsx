"use client";

import { Suspense, startTransition, useActionState, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { submitInquiry, type InquiryState } from "@/app/actions/inquiry";
import { PackageFromQuery } from "./PackageFromQuery";
import { Turnstile } from "./Turnstile";

const initialState: InquiryState = { status: "idle", message: "", fieldErrors: {}, submissionId: 0 };

function Field({
  id,
  label,
  error,
  required,
  children,
  className = "",
}: {
  id: string;
  label: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="field-label">
        {label}
        {required ? (
          <span className="text-gold" aria-hidden="true">
            {" "}
            *
          </span>
        ) : (
          <span className="font-normal text-mist"> (optional)</span>
        )}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="field-error">
          {error}
        </p>
      )}
    </div>
  );
}

export function InquiryForm({
  kind,
  packages = [],
}: {
  kind: "event" | "contact";
  packages?: string[];
}) {
  const [state, formAction, pending] = useActionState(submitInquiry, initialState);
  const [startedAt, setStartedAt] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const prefix = kind === "event" ? "ev" : "ct";
  const err = state.fieldErrors;

  const packageRef = useRef<HTMLSelectElement>(null);

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

  // Submitting via onSubmit (rather than <form action>) stops React from
  // clearing what the visitor typed when there's a validation error.
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    startTransition(() => formAction(data));
  };

  const describe = (name: string) => (err[name] ? `${prefix}-${name}-error` : undefined);
  const invalid = (name: string) => (err[name] ? true : undefined);

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="relative flex flex-col gap-5">
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="started_at" value={startedAt} />
      {/* Honeypot: hidden from people, irresistible to bots. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor={`${prefix}-company_website`}>Leave this field empty</label>
        <input id={`${prefix}-company_website`} name="company_website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id={`${prefix}-name`} label="Name" required error={err.name}>
          <input
            id={`${prefix}-name`}
            name="name"
            type="text"
            autoComplete="name"
            required
            maxLength={120}
            className="field"
            aria-invalid={invalid("name")}
            aria-describedby={describe("name")}
          />
        </Field>
        <Field id={`${prefix}-email`} label="Email" required error={err.email}>
          <input
            id={`${prefix}-email`}
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength={200}
            className="field"
            aria-invalid={invalid("email")}
            aria-describedby={describe("email")}
          />
        </Field>
        <Field id={`${prefix}-phone`} label="Phone number" required={kind === "event"} error={err.phone}>
          <input
            id={`${prefix}-phone`}
            name="phone"
            type="tel"
            autoComplete="tel"
            required={kind === "event"}
            maxLength={40}
            className="field"
            aria-invalid={invalid("phone")}
            aria-describedby={describe("phone")}
          />
        </Field>

        {kind === "event" && (
          <>
            <Suspense fallback={null}>
              <PackageFromQuery selectRef={packageRef} packages={packages} />
            </Suspense>
            <Field id={`${prefix}-preferred_date`} label="Preferred date" error={err.preferred_date}>
              <input
                id={`${prefix}-preferred_date`}
                name="preferred_date"
                type="date"
                className="field"
                aria-invalid={invalid("preferred_date")}
                aria-describedby={describe("preferred_date")}
              />
            </Field>
            <Field id={`${prefix}-guest_count`} label="Estimated number of guests" error={err.guest_count}>
              <input
                id={`${prefix}-guest_count`}
                name="guest_count"
                type="number"
                inputMode="numeric"
                min={1}
                max={1000}
                className="field"
                aria-invalid={invalid("guest_count")}
                aria-describedby={describe("guest_count")}
              />
            </Field>
            <Field id={`${prefix}-package`} label="Package" error={err.package}>
              <select ref={packageRef} id={`${prefix}-package`} name="package" defaultValue="" className="field">
                <option value="">Not sure yet</option>
                {packages.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </Field>
          </>
        )}
      </div>

      <Field
        id={`${prefix}-message`}
        label={kind === "event" ? "Tell us about your event" : "Message"}
        required={kind === "contact"}
        error={err.message}
      >
        <textarea
          id={`${prefix}-message`}
          name="message"
          rows={5}
          maxLength={4000}
          required={kind === "contact"}
          className="field resize-y"
          placeholder={kind === "event" ? "Occasion, timing, food and drink needs, anything else we should know" : ""}
          aria-invalid={invalid("message")}
          aria-describedby={describe("message")}
        />
      </Field>

      <Turnstile resetKey={state.submissionId} />

      <div
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

      <div>
        <button type="submit" className="btn btn-gold w-full sm:w-auto" disabled={pending || !startedAt}>
          {pending ? "Sending…" : kind === "event" ? "Send event inquiry" : "Send message"}
        </button>
        <p className="mt-4 text-xs text-mist">
          We only use your details to reply to you. See our{" "}
          <a href="/privacy" className="underline underline-offset-4 transition hover:text-gold-2">
            privacy policy
          </a>
          .
        </p>
      </div>
    </form>
  );
}
