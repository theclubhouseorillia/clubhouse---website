"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, options: Record<string, unknown>) => string;
      remove: (widgetId: string) => void;
    };
  }
}

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

/** Cloudflare Turnstile bot check. Renders nothing unless a site key is configured. */
export function Turnstile({ resetKey }: { resetKey: number }) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const ref = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!siteKey) return;
    if (window.turnstile) {
      setReady(true);
      return;
    }
    const onLoad = () => setReady(true);
    let script = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
    if (!script) {
      script = document.createElement("script");
      script.src = SCRIPT_SRC;
      script.async = true;
      document.head.appendChild(script);
    }
    script.addEventListener("load", onLoad);
    // In case it finished loading between the checks above.
    const poll = window.setInterval(() => {
      if (window.turnstile) {
        setReady(true);
        window.clearInterval(poll);
      }
    }, 500);
    return () => {
      script?.removeEventListener("load", onLoad);
      window.clearInterval(poll);
    };
  }, [siteKey]);

  useEffect(() => {
    if (!siteKey || !ready || !ref.current || !window.turnstile) return;
    const id = window.turnstile.render(ref.current, { sitekey: siteKey, theme: "dark" });
    return () => {
      try {
        window.turnstile?.remove(id);
      } catch {
        /* widget already gone */
      }
    };
  }, [siteKey, ready, resetKey]);

  if (!siteKey) return null;
  return <div ref={ref} className="min-h-[65px]" />;
}
