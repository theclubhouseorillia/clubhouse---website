// Shapes member records into the membership spreadsheet (Admin page, Excel
// download and the private Google Sheets link). No server-only imports.

export const SHEET_TIMEZONE = "America/Toronto";

/** One calendar month after `from`, in Toronto time ("YYYY-MM-DD"), e.g. Jan 31 -> Feb 28. */
export function oneMonthAfter(from: Date): string {
  const [y, m, d] = new Intl.DateTimeFormat("en-CA", { timeZone: SHEET_TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit" })
    .format(from)
    .split("-")
    .map(Number);
  const month = m === 12 ? 1 : m + 1;
  const year = m === 12 ? y + 1 : y;
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const day = Math.min(d, lastDay);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** A timestamp as "YYYY-MM-DD" in Toronto time. */
export function torontoDate(value: string | Date | null | undefined): string | null {
  if (!value) return null;
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat("en-CA", { timeZone: SHEET_TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

export interface MemberSheetSource {
  name: string | null;
  email: string;
  phone: string | null;
  golfer_name: string | null;
  plan: string | null;
  status: string;
  created_at: string | null;
  member_code: string | null;
  renews_on: string | null;
  canceled_on: string | null;
  added_to_ygb: boolean | null;
}

export interface MemberSheetRow {
  name: string;
  email: string;
  phone: string;
  golfer: string;
  plan: string;
  status: string;
  orderedOn: string;
  code: string;
  codeValidUntil: string;
  renewsOrEnds: string;
  canceledOn: string;
  setUpInYgb: string;
}

const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  ending: "Cancelled (active until end date)",
  canceled: "Ended",
  past_due: "Payment failed",
  paused: "Paused",
};

export const SHEET_COLUMNS: { key: keyof MemberSheetRow; label: string }[] = [
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "golfer", label: "Golfer (if different)" },
  { key: "plan", label: "Plan" },
  { key: "status", label: "Status" },
  { key: "orderedOn", label: "Ordered on" },
  { key: "code", label: "Member code" },
  { key: "codeValidUntil", label: "Code valid until" },
  { key: "renewsOrEnds", label: "Renews / ends on" },
  { key: "canceledOn", label: "Cancelled on" },
  { key: "setUpInYgb", label: "Set up in YGB" },
];

/** "+17055550123" -> "(705) 555-0123"; anything else is returned as typed. */
export function readablePhone(raw: string | null | undefined): string {
  const v = (raw ?? "").trim();
  const d = v.replace(/\D/g, "");
  const ten = d.length === 11 && d.startsWith("1") ? d.slice(1) : d;
  return ten.length === 10 ? `(${ten.slice(0, 3)}) ${ten.slice(3, 6)}-${ten.slice(6)}` : v;
}

export function toSheetRow(m: MemberSheetSource): MemberSheetRow {
  const orderedOn = torontoDate(m.created_at) ?? "";
  const renews = m.renews_on ? m.renews_on.slice(0, 10) : "";
  const validUntil = renews || (m.created_at ? oneMonthAfter(new Date(m.created_at)) : "");
  const code = m.member_code?.trim() ?? "";
  const ended = m.status === "canceled";
  return {
    name: m.name ?? "",
    email: m.email,
    phone: readablePhone(m.phone),
    golfer: m.golfer_name ?? "",
    plan: m.plan ?? "",
    status: STATUS_LABELS[m.status] ?? m.status,
    orderedOn,
    code: code || (ended ? "" : "Waiting for code"),
    codeValidUntil: code ? validUntil : "",
    renewsOrEnds: renews || validUntil,
    canceledOn: m.canceled_on ? m.canceled_on.slice(0, 10) : "",
    setUpInYgb: m.added_to_ygb ? "Yes" : "No",
  };
}

function csvCell(value: string): string {
  // Guard against spreadsheet formula injection from customer-entered text.
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export function toCsv(rows: MemberSheetRow[]): string {
  const header = SHEET_COLUMNS.map((c) => csvCell(c.label)).join(",");
  const lines = rows.map((r) => SHEET_COLUMNS.map((c) => csvCell(r[c.key])).join(","));
  return [header, ...lines].join("\r\n") + "\r\n";
}
