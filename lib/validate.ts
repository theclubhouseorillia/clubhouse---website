// Server-side validation for everything saved from the admin dashboard.
// Only fields defined in lib/resources.ts can ever be written.

import type { FieldDef, ResourceDef } from "./resources";

export type ValidationResult =
  | { ok: true; data: Record<string, unknown> }
  | { ok: false; error: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

class FieldError extends Error {}

/** "Stop showing (optional)" → "Stop showing" for error messages. */
function nameOf(field: Pick<FieldDef, "label">): string {
  return field.label.replace(/\s*\(.*\)\s*$/, "");
}

function isEmpty(v: unknown): boolean {
  return v === null || v === undefined || (typeof v === "string" && v.trim() === "");
}

function isValidLink(value: string): boolean {
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  if (value.startsWith("#")) return true;
  if (/^(tel|mailto):/i.test(value)) return value.length > 4;
  try {
    const u = new URL(value);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

function coerce(field: FieldDef, raw: unknown): unknown {
  const fail = (msg: string): never => {
    throw new FieldError(`${nameOf(field)}: ${msg}`);
  };

  if (field.type === "boolean") {
    return raw === true || raw === "true" || raw === "on" || raw === 1 || raw === "1";
  }

  if (field.type === "list") {
    const items = Array.isArray(raw) ? raw : typeof raw === "string" ? raw.split(/\r?\n/) : [];
    const clean = items
      .map((i) => (typeof i === "string" ? i.trim() : ""))
      .filter((i) => i.length > 0);
    if (clean.length > 40) fail("please keep this to 40 lines or fewer.");
    if (clean.some((i) => i.length > 300)) fail("each line must be 300 characters or fewer.");
    if (field.required && clean.length === 0) fail("add at least one line.");
    return clean;
  }

  if (field.type === "images") {
    const items = Array.isArray(raw) ? raw : typeof raw === "string" ? raw.split(/\r?\n/) : [];
    const urls = items
      .map((i) => (typeof i === "string" ? i.trim() : ""))
      .filter((i) => i.length > 0);
    const max = field.maxItems ?? 12;
    if (urls.length > max) fail(`please keep this to ${max} photos or fewer.`);
    if (urls.some((u) => !/^https:\/\//i.test(u) || u.length > 1000)) fail("please upload the photos again.");
    if (field.required && urls.length === 0) fail("add at least one photo.");
    return urls;
  }

  if (isEmpty(raw)) {
    if (field.required) fail("this field is required.");
    // e.g. a cleared "Display order" goes back to its default instead of failing.
    if (field.type === "number" && typeof field.default === "number") return field.default;
    return null;
  }

  const str = typeof raw === "string" ? raw.trim() : String(raw);

  switch (field.type) {
    case "text":
    case "textarea":
    case "tel": {
      const max = field.max ?? (field.type === "textarea" ? 5000 : 300);
      if (str.length > max) fail(`please keep this under ${max} characters.`);
      if (field.type === "tel" && !/^[\d\s()+.\-x]{7,30}$/i.test(str)) fail("enter a valid phone number.");
      return str;
    }
    case "email":
      if (!EMAIL_RE.test(str) || str.length > 200) fail("enter a valid email address.");
      return str;
    case "url":
      if (str.length > 1000 || !isValidLink(str)) {
        fail("enter a full web address starting with https://, or a page on this site starting with /.");
      }
      return str;
    case "image":
      if (!/^https:\/\//i.test(str) || str.length > 1000) fail("please upload the image again.");
      return str;
    case "number":
    case "money": {
      const n = Number(str.replace(/[$,\s]/g, ""));
      if (!Number.isFinite(n)) fail("enter a number.");
      if (field.integer && !Number.isInteger(n)) fail("enter a whole number.");
      const min = field.min ?? (field.type === "money" ? 0 : -1_000_000);
      const max = field.max ?? (field.type === "money" ? 100_000 : 1_000_000);
      if (n < min || n > max) fail(`enter a number between ${min} and ${max}.`);
      return field.type === "money" ? Math.round(n * 100) / 100 : n;
    }
    case "date": {
      const d = new Date(`${str}T00:00:00Z`);
      if (!DATE_RE.test(str) || Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== str) {
        fail("enter a valid date.");
      }
      return str;
    }
    case "time":
      if (!TIME_RE.test(str)) fail("enter a valid time.");
      return str.slice(0, 5);
    case "datetime": {
      const t = Date.parse(str);
      if (Number.isNaN(t)) fail("enter a valid date and time.");
      return new Date(t).toISOString();
    }
    case "select": {
      const allowed = (field.options ?? []).map((o) => o.value);
      if (!allowed.includes(str)) fail("choose one of the options.");
      return str;
    }
    case "relation":
      if (!UUID_RE.test(str)) fail("choose one of the options.");
      return str;
    default:
      return fail("unsupported field.");
  }
}

/**
 * Validates submitted values against a resource definition.
 * With `partial`, only the fields present in `values` are checked and returned
 * (used by quick on/off toggles).
 */
export function validateRecord(
  def: ResourceDef,
  values: Record<string, unknown>,
  partial = false,
): ValidationResult {
  const data: Record<string, unknown> = {};
  try {
    for (const field of def.fields) {
      if (field.readOnly) continue;
      if (partial && !(field.name in values)) continue;
      data[field.name] = coerce(field, values[field.name]);
    }

    for (const field of def.fields) {
      if (!field.after) continue;
      const later = data[field.name];
      const earlier = data[field.after];
      if (typeof later === "string" && typeof earlier === "string" && later < earlier) {
        const otherField = def.fields.find((f) => f.name === field.after);
        const other = otherField ? nameOf(otherField) : field.after;
        throw new FieldError(`${nameOf(field)} must be after ${other}.`);
      }
    }
  } catch (err) {
    if (err instanceof FieldError) return { ok: false, error: err.message };
    throw err;
  }

  if (Object.keys(data).length === 0) return { ok: false, error: "Nothing to save." };
  return { ok: true, data };
}
