"use client";

import type { ReactNode } from "react";
import type { FieldDef } from "@/lib/resources";
import { displayValue, type FormValue, type RelationOptions } from "./fieldValues";
import { ImageUpload } from "./ImageUpload";

export function FieldInput({
  field,
  value,
  rawValue,
  onChange,
  relationOptions,
  idPrefix,
}: {
  field: FieldDef;
  value: FormValue;
  rawValue: unknown;
  onChange: (value: FormValue) => void;
  relationOptions: RelationOptions;
  idPrefix: string;
}) {
  const id = `${idPrefix}-${field.name}`;
  const helpId = field.help ? `${id}-help` : undefined;
  const str = typeof value === "string" ? value : "";

  const label = (
    <label htmlFor={field.type === "boolean" ? undefined : id} className="field-label">
      {field.label}
      {field.required && !field.readOnly && (
        <span className="text-gold" aria-hidden="true">
          {" "}
          *
        </span>
      )}
    </label>
  );

  const help = field.help ? (
    <p id={helpId} className="mt-1.5 text-xs leading-relaxed text-mist">
      {field.help}
    </p>
  ) : null;

  if (field.readOnly) {
    const shown = field.type === "boolean" ? (rawValue ? "Yes" : "No") : displayValueFull(field, rawValue, relationOptions);
    return (
      <div>
        <span className="field-label">{field.label}</span>
        <div className="min-h-[3rem] whitespace-pre-wrap break-words rounded-[3px] border border-line/60 bg-coal-2 px-3.5 py-3 text-cream">
          {field.type === "email" && shown ? (
            <a href={`mailto:${shown}`} className="link-gold">
              {shown}
            </a>
          ) : field.type === "tel" && shown ? (
            <a href={`tel:${shown.replace(/[^\d+]/g, "")}`} className="link-gold">
              {shown}
            </a>
          ) : (
            shown || <span className="text-mist">—</span>
          )}
        </div>
      </div>
    );
  }

  if (field.type === "boolean") {
    return (
      <div className="flex flex-col">
        <label htmlFor={id} className="flex min-h-12 cursor-pointer items-center gap-3 rounded-[3px] border border-line bg-ink px-4 py-3">
          <input
            id={id}
            type="checkbox"
            checked={value === true}
            onChange={(e) => onChange(e.target.checked)}
            className="h-5 w-5 shrink-0 accent-[#4fbf73]"
            aria-describedby={helpId}
          />
          <span className="text-sm font-semibold text-cream">{field.label}</span>
        </label>
        {help}
      </div>
    );
  }

  if (field.type === "image") {
    return (
      <div>
        <span className="field-label">
          {field.label}
          {field.required && (
            <span className="text-gold" aria-hidden="true">
              {" "}
              *
            </span>
          )}
        </span>
        <ImageUpload id={id} value={str} onChange={onChange} folder={field.folder} describedBy={helpId} />
        {help}
      </div>
    );
  }

  const common = {
    id,
    required: field.required,
    "aria-describedby": helpId,
    className: "field",
    placeholder: field.placeholder,
  };

  const { placeholder: _placeholder, ...selectCommon } = common;
  void _placeholder;

  let control: ReactNode;
  switch (field.type) {
    case "textarea":
      control = (
        <textarea {...common} rows={5} maxLength={field.max} value={str} onChange={(e) => onChange(e.target.value)} />
      );
      break;
    case "list":
      control = <textarea {...common} rows={6} value={str} onChange={(e) => onChange(e.target.value)} />;
      break;
    case "select":
      control = (
        <select {...selectCommon} value={str} onChange={(e) => onChange(e.target.value)}>
          {!field.required && <option value="">—</option>}
          {(field.options ?? []).map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      );
      break;
    case "relation": {
      const options = relationOptions[field.name] ?? [];
      control = (
        <select {...selectCommon} value={str} onChange={(e) => onChange(e.target.value)}>
          <option value="">Choose…</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      );
      break;
    }
    case "number":
    case "money":
      control = (
        <input
          {...common}
          type="number"
          inputMode="decimal"
          step={field.type === "money" ? "0.01" : field.integer ? "1" : "any"}
          min={field.min ?? (field.type === "money" ? 0 : undefined)}
          max={field.max}
          value={str}
          onChange={(e) => onChange(e.target.value)}
        />
      );
      break;
    case "date":
      control = <input {...common} type="date" value={str} onChange={(e) => onChange(e.target.value)} />;
      break;
    case "time":
      control = <input {...common} type="time" value={str} onChange={(e) => onChange(e.target.value)} />;
      break;
    case "datetime":
      control = <input {...common} type="datetime-local" value={str} onChange={(e) => onChange(e.target.value)} />;
      break;
    case "email":
      control = <input {...common} type="email" maxLength={200} value={str} onChange={(e) => onChange(e.target.value)} />;
      break;
    case "tel":
      control = <input {...common} type="tel" maxLength={field.max} value={str} onChange={(e) => onChange(e.target.value)} />;
      break;
    case "url":
      control = (
        <input {...common} type="text" inputMode="url" maxLength={1000} value={str} onChange={(e) => onChange(e.target.value)} />
      );
      break;
    default:
      control = <input {...common} type="text" maxLength={field.max} value={str} onChange={(e) => onChange(e.target.value)} />;
  }

  return (
    <div>
      {label}
      {control}
      {help}
    </div>
  );
}

function displayValueFull(field: FieldDef, value: unknown, relationOptions: RelationOptions): string {
  if (field.type === "textarea" || field.type === "text") {
    return value === null || value === undefined ? "" : String(value);
  }
  return displayValue(field, value, relationOptions);
}
