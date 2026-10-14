"use client";

import { useEffect, useState } from "react";
import { ClockIcon } from "@/components/icons";
import { todayISO, todayWeekdayId } from "@/lib/format";
import { hoursForDate } from "@/lib/hours";
import type { HoursRow, SpecialHours } from "@/lib/types";

/** "Open today · 11 AM – 10 PM", worked out in the visitor's browser so it's never stale. */
export function OpenToday({ hours, special }: { hours: HoursRow[]; special: SpecialHours[] }) {
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    const today = hoursForDate(todayWeekdayId(), todayISO(), hours, special);
    if (!today.value) return;
    const prefix = today.closed ? "Closed today" : "Open today";
    const note = today.note ? ` (${today.note})` : "";
    setText(today.closed ? `${prefix}${note}` : `${prefix} · ${today.value}${note}`);
  }, [hours, special]);

  if (!text) return null;
  return (
    <span className="inline-flex items-center gap-2">
      <ClockIcon width={16} height={16} className="text-gold" />
      {text}
    </span>
  );
}
