import { TIMEZONE, formatPrice, formatShortDate, formatTime } from "@/lib/format";
import type { FieldDef } from "@/lib/resources";

export type FormValue = string | boolean;
export type RelationOptions = Record<string, { value: string; label: string }[]>;

function pad(n: number) {
  return String(n).padStart(2, "0");
}

/** ISO timestamp → value for <input type="datetime-local"> in the browser's time zone. */
function isoToLocalInput(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Database value → form field value. */
export function toFormValue(field: FieldDef, raw: unknown): FormValue {
  switch (field.type) {
    case "boolean":
      return raw === undefined || raw === null ? Boolean(field.default) : raw === true;
    case "list":
    case "images":
      return Array.isArray(raw) ? raw.join("\n") : "";
    case "datetime":
      return typeof raw === "string" && raw ? isoToLocalInput(raw) : "";
    case "time":
      return typeof raw === "string" ? raw.slice(0, 5) : "";
    default:
      return raw === null || raw === undefined ? "" : String(raw);
  }
}

/** Form field value → what we send to the server. */
export function fromFormValue(field: FieldDef, value: FormValue): unknown {
  if (field.type === "boolean") return value === true;
  if (typeof value !== "string") return value;
  if (field.type === "datetime") {
    if (!value) return null;
    const d = new Date(value); // interpreted in the browser's local time
    return Number.isNaN(d.getTime()) ? value : d.toISOString();
  }
  return value;
}

export function defaultFormValue(field: FieldDef): FormValue {
  return toFormValue(field, field.default ?? null);
}

/** Human-friendly value for the list view. */
export function displayValue(field: FieldDef, value: unknown, relationOptions: RelationOptions): string {
  if (value === null || value === undefined || value === "") return "";
  switch (field.type) {
    case "boolean":
      return value ? "Yes" : "No";
    case "money":
      return formatPrice(typeof value === "number" ? value : Number(value));
    case "date":
      return formatShortDate(String(value));
    case "time":
      return formatTime(String(value));
    case "datetime": {
      const d = new Date(String(value));
      return Number.isNaN(d.getTime())
        ? ""
        : d.toLocaleString("en-CA", { timeZone: TIMEZONE, dateStyle: "medium", timeStyle: "short" });
    }
    case "list":
      return Array.isArray(value) ? `${value.length} item${value.length === 1 ? "" : "s"}` : "";
    case "select":
      return field.options?.find((o) => o.value === value)?.label ?? String(value);
    case "relation":
      return relationOptions[field.name]?.find((o) => o.value === String(value))?.label ?? "";
    case "image":
      return "";
    case "images":
      return Array.isArray(value) && value.length ? `${value.length} photo${value.length === 1 ? "" : "s"}` : "";
    default: {
      const s = String(value);
      return s.length > 90 ? `${s.slice(0, 87)}…` : s;
    }
  }
}
