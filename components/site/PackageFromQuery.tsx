"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, type RefObject } from "react";

/** Pre-selects a package when a visitor clicks "Inquire" on a package (?package=…). */
export function PackageFromQuery({
  selectRef,
  packages,
}: {
  selectRef: RefObject<HTMLSelectElement | null>;
  packages: string[];
}) {
  const requested = useSearchParams().get("package");
  // Only re-apply when the link or the package list actually changes, so a
  // visitor's own choice isn't overwritten when the form re-renders.
  const packageKey = packages.join("|");

  useEffect(() => {
    if (requested && selectRef.current && packageKey.split("|").includes(requested)) {
      selectRef.current.value = requested;
    }
  }, [requested, selectRef, packageKey]);

  return null;
}
