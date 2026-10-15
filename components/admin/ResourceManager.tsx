"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { deleteRecord, saveRecord } from "@/app/admin/actions";
import { CloseIcon } from "@/components/icons";
import { getResource, type FieldDef, type ResourceDef } from "@/lib/resources";
import { FieldInput } from "./FieldInput";
import {
  defaultFormValue,
  displayValue,
  fromFormValue,
  toFormValue,
  type FormValue,
  type RelationOptions,
} from "./fieldValues";

type Row = Record<string, unknown>;
type Editing = { id: string | null; values: Record<string, FormValue>; raw: Row };

function initialValues(def: ResourceDef, row: Row | null): Record<string, FormValue> {
  const values: Record<string, FormValue> = {};
  for (const f of def.fields) {
    values[f.name] = row ? toFormValue(f, row[f.name]) : defaultFormValue(f);
  }
  return values;
}

function payloadFrom(def: ResourceDef, values: Record<string, FormValue>): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  for (const f of def.fields) {
    if (f.readOnly) continue;
    payload[f.name] = fromFormValue(f, values[f.name] ?? "");
  }
  return payload;
}

function scheduleStatus(def: ResourceDef, row: Row): "Scheduled" | "Expired" | null {
  if (!def.schedule) return null;
  const now = Date.now();
  const start = row[def.schedule.start];
  const end = row[def.schedule.end];
  if (typeof start === "string" && new Date(start).getTime() > now) return "Scheduled";
  if (typeof end === "string" && new Date(end).getTime() <= now) return "Expired";
  return null;
}

/** The form used both in the pop-up editor and for one-page settings. */
function RecordForm({
  def,
  editing,
  setValue,
  relationOptions,
  error,
  pending,
  onSubmit,
  onCancel,
  submitLabel,
}: {
  def: ResourceDef;
  editing: Editing;
  setValue: (name: string, value: FormValue) => void;
  relationOptions: RelationOptions;
  error: string | null;
  pending: boolean;
  onSubmit: () => void;
  onCancel?: () => void;
  submitLabel: string;
}) {
  const hasEditable = def.fields.some((f) => !f.readOnly);
  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="flex flex-col gap-6"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        {def.fields.map((field: FieldDef) => (
          <div key={field.name} className={field.wide || field.type === "textarea" ? "sm:col-span-2" : ""}>
            <FieldInput
              field={field}
              value={editing.values[field.name] ?? ""}
              rawValue={editing.raw[field.name]}
              onChange={(v) => setValue(field.name, v)}
              relationOptions={relationOptions}
              idPrefix={`${def.key}-${editing.id ?? "new"}`}
            />
          </div>
        ))}
      </div>
      {error && (
        <p role="alert" className="rounded-[3px] border border-danger/60 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-3 border-t border-line pt-5">
        {hasEditable && (
          <button type="submit" className="btn btn-gold min-h-11" disabled={pending}>
            {pending ? "Saving…" : submitLabel}
          </button>
        )}
        {onCancel && (
          <button type="button" className="btn btn-outline min-h-11" onClick={onCancel} disabled={pending}>
            {hasEditable ? "Cancel" : "Close"}
          </button>
        )}
      </div>
    </form>
  );
}

export function ResourceManager({
  resourceKey,
  rows,
  relationOptions,
  loadError,
}: {
  resourceKey: string;
  rows: Row[];
  relationOptions: RelationOptions;
  loadError?: string | null;
}) {
  const def = getResource(resourceKey);
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState<Editing | null>(() =>
    def?.singleton ? { id: "1", values: initialValues(def, rows[0] ?? null), raw: rows[0] ?? {} } : null,
  );
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Keep the settings form in sync after a save refreshes the data.
  useEffect(() => {
    if (def?.singleton) setEditing({ id: "1", values: initialValues(def, rows[0] ?? null), raw: rows[0] ?? {} });
  }, [def, rows]);

  useEffect(() => {
    if (!notice) return;
    const t = window.setTimeout(() => setNotice(null), 3500);
    return () => window.clearTimeout(t);
  }, [notice]);

  const modalOpen = !!editing && !def?.singleton;
  const pendingRef = useRef(false);
  pendingRef.current = pending;
  useEffect(() => {
    if (!modalOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const first =
      dialogRef.current?.querySelector<HTMLElement>("form input:not([type=hidden]):not(.sr-only), form textarea, form select") ??
      dialogRef.current?.querySelector<HTMLElement>("button");
    first?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !pendingRef.current) setEditing(null);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [modalOpen]);

  const groups = useMemo(() => {
    if (!def) return [];
    const groupField = def.groupByField ? def.fields.find((f) => f.name === def.groupByField) : undefined;
    if (!groupField) return [{ label: "", rows }];
    const order = (relationOptions[groupField.name] ?? []).map((o) => o.label);
    const map = new Map<string, Row[]>();
    for (const row of rows) {
      const label = displayValue(groupField, row[groupField.name], relationOptions) || "Other";
      map.set(label, [...(map.get(label) ?? []), row]);
    }
    return [...map.entries()]
      .sort(([a], [b]) => {
        const ia = order.indexOf(a);
        const ib = order.indexOf(b);
        return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
      })
      .map(([label, groupRows]) => ({ label, rows: groupRows }));
  }, [def, rows, relationOptions]);

  if (!def) return <p className="text-danger">Unknown section.</p>;

  const setValue = (name: string, value: FormValue) =>
    setEditing((cur) => (cur ? { ...cur, values: { ...cur.values, [name]: value } } : cur));

  const save = () => {
    if (!editing) return;
    setError(null);
    const payload = payloadFrom(def, editing.values);
    startTransition(async () => {
      const res = await saveRecord(def.key, def.singleton ? "1" : editing.id, payload);
      if (res.ok) {
        if (!def.singleton) setEditing(null);
        setNotice(`${def.singular} saved. The website is updated.`);
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  };

  const toggle = (row: Row) => {
    if (!def.toggleField) return;
    const field = def.toggleField;
    startTransition(async () => {
      const res = await saveRecord(def.key, String(row.id), { [field]: !row[field] }, true);
      if (res.ok) {
        setNotice("Updated.");
        router.refresh();
      } else setNotice(res.error);
    });
  };

  const remove = (row: Row) => {
    const name = String(row[def.titleField] ?? def.singular);
    if (!window.confirm(`Delete “${name}”? This can't be undone.`)) return;
    startTransition(async () => {
      const res = await deleteRecord(def.key, String(row.id));
      if (res.ok) {
        setNotice(`${def.singular} deleted.`);
        router.refresh();
      } else setNotice(res.error);
    });
  };

  const openEditor = (row: Row | null) => {
    setError(null);
    setEditing({ id: row ? String(row.id) : null, values: initialValues(def, row), raw: row ?? {} });
  };

  const hasEditable = def.fields.some((f) => !f.readOnly);
  const summaryFields = (def.summaryFields ?? [])
    .map((name) => def.fields.find((f) => f.name === name))
    .filter((f): f is FieldDef => !!f);
  const titleFieldDef = def.fields.find((f) => f.name === def.titleField);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-4 border-b border-line pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-4xl font-semibold text-cream">{def.title}</h1>
          <p className="max-w-2xl text-mist">{def.description}</p>
        </div>
        {!def.singleton && def.allowCreate !== false && (
          <button type="button" className="btn btn-gold min-h-11 shrink-0" onClick={() => openEditor(null)}>
            + Add {def.singular.toLowerCase()}
          </button>
        )}
      </header>

      {loadError && (
        <p role="alert" className="rounded-[3px] border border-danger/60 bg-danger/10 px-4 py-3 text-sm text-danger">
          Couldn&apos;t load this section: {loadError}. Check that schema.sql has been run in Supabase.
        </p>
      )}

      <div role="status" aria-live="polite" className="pointer-events-none fixed bottom-6 left-1/2 z-[80] -translate-x-1/2">
        {notice && (
          <p className="animate-fade-in rounded-[3px] border border-gold/50 bg-forest px-5 py-3 text-sm text-cream shadow-2xl">
            {notice}
          </p>
        )}
      </div>

      {def.singleton && editing ? (
        <div className="card p-5 sm:p-8">
          <RecordForm
            def={def}
            editing={editing}
            setValue={setValue}
            relationOptions={relationOptions}
            error={error}
            pending={pending}
            onSubmit={save}
            submitLabel="Save settings"
          />
        </div>
      ) : rows.length === 0 ? (
        <div className="card p-8 text-mist">
          Nothing here yet.{" "}
          {def.allowCreate !== false && (
            <button type="button" className="link-gold" onClick={() => openEditor(null)}>
              Add your first {def.singular.toLowerCase()}
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {groups.map((group) => (
            <section key={group.label || "all"} className="flex flex-col gap-3">
              {group.label && <h2 className="eyebrow">{group.label}</h2>}
              <ul className="flex flex-col gap-3">
                {group.rows.map((row) => {
                  const id = String(row.id);
                  const thumbRaw = def.thumbField ? row[def.thumbField] : null;
                  const thumb = Array.isArray(thumbRaw) ? thumbRaw[0] : thumbRaw;
                  const toggleOn = def.toggleField ? row[def.toggleField] === true : false;
                  const status = scheduleStatus(def, row);
                  const title =
                    (titleFieldDef ? displayValue(titleFieldDef, row[def.titleField], relationOptions) : "") ||
                    `Untitled ${def.singular.toLowerCase()}`;
                  return (
                    <li key={id} className="card flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5">
                      {def.thumbField && (
                        <div className="h-16 w-20 shrink-0 overflow-hidden rounded-[3px] border border-line bg-ink">
                          {typeof thumb === "string" && thumb ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={thumb} alt="" className="h-full w-full object-cover" />
                          ) : null}
                        </div>
                      )}
                      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                        <p className="font-semibold text-cream">{title}</p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-mist">
                          {summaryFields.map((f) => {
                            const v = row[f.name];
                            if (f.type === "boolean") {
                              return v === true ? (
                                <span key={f.name} className="text-gold-2">
                                  {f.short ?? f.label}
                                </span>
                              ) : null;
                            }
                            const shown = displayValue(f, v, relationOptions);
                            if (!shown) return null;
                            return (
                              <span key={f.name} className="max-w-full truncate">
                                {f.short === "" ? shown : `${f.short ?? f.label}: ${shown}`}
                              </span>
                            );
                          })}
                          {status && <span className="text-gold-2">{status}</span>}
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-wrap items-center gap-2">
                        {def.toggleField && (
                          <button
                            type="button"
                            onClick={() => toggle(row)}
                            disabled={pending}
                            aria-pressed={toggleOn}
                            className={`inline-flex min-h-11 items-center gap-2 rounded-[3px] border px-3 text-xs font-bold uppercase tracking-[0.12em] transition ${
                              toggleOn ? "border-gold/60 bg-forest text-gold-2" : "border-line text-mist hover:text-cream"
                            }`}
                          >
                            <span
                              className={`h-2 w-2 rounded-full ${toggleOn ? "bg-gold" : "bg-mist/50"}`}
                              aria-hidden="true"
                            />
                            {toggleOn ? def.toggleOn ?? "On" : def.toggleOff ?? "Off"}
                          </button>
                        )}
                        <button type="button" className="btn btn-outline min-h-11 px-4" onClick={() => openEditor(row)}>
                          {hasEditable && def.key !== "inquiries" ? "Edit" : "Open"}
                        </button>
                        {def.allowDelete !== false && (
                          <button
                            type="button"
                            className="btn min-h-11 px-3 text-mist hover:text-danger"
                            onClick={() => remove(row)}
                            disabled={pending}
                            aria-label={`Delete ${title}`}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}

      {modalOpen && editing && (
        <div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-ink/80 backdrop-blur-sm sm:items-center sm:p-6"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !pending) setEditing(null);
          }}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="editor-title"
            className="max-h-[92svh] w-full max-w-3xl overflow-y-auto rounded-t-[6px] border border-line bg-coal p-5 shadow-2xl sm:rounded-[6px] sm:p-8"
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <h2 id="editor-title" className="font-display text-3xl font-semibold text-cream">
                {editing.id ? (hasEditable ? `Edit ${def.singular.toLowerCase()}` : def.singular) : `New ${def.singular.toLowerCase()}`}
              </h2>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center text-mist hover:text-cream"
                aria-label="Close"
                disabled={pending}
              >
                <CloseIcon />
              </button>
            </div>
            <RecordForm
              def={def}
              editing={editing}
              setValue={setValue}
              relationOptions={relationOptions}
              error={error}
              pending={pending}
              onSubmit={save}
              onCancel={() => setEditing(null)}
              submitLabel={editing.id ? "Save changes" : `Add ${def.singular.toLowerCase()}`}
            />
          </div>
        </div>
      )}
    </div>
  );
}
