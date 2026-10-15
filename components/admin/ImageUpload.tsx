"use client";

import { useRef, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon, ImageIcon } from "@/components/icons";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

const MAX_SIDE = 2000;
const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPT = "image/jpeg,image/png,image/webp,image/gif,image/avif";

/** Shrinks large photos in the browser before upload so the site stays fast. */
async function prepareImage(file: File): Promise<Blob> {
  const resizable = ["image/jpeg", "image/png", "image/webp", "image/avif"].includes(file.type);
  if (!resizable || typeof createImageBitmap !== "function") return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size < 1.5 * 1024 * 1024) {
      bitmap.close();
      return file;
    }
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.85));
    return blob && blob.size < file.size ? blob : file;
  } catch {
    return file;
  }
}

function extensionFor(type: string): string {
  switch (type) {
    case "image/webp":
      return "webp";
    case "image/png":
      return "png";
    case "image/gif":
      return "gif";
    case "image/avif":
      return "avif";
    default:
      return "jpg";
  }
}

/** Resizes and uploads one photo to storage, returning its public web address. */
async function uploadImage(file: File, folder: string): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error(`“${file.name}” isn't a photo. Please choose JPG, PNG or WebP files.`);
  }
  const blob = await prepareImage(file);
  if (blob.size > MAX_BYTES) {
    throw new Error(`“${file.name}” is too large. Please use photos under 10 MB.`);
  }
  const type = blob.type || file.type;
  const unique =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const path = `${folder}/${new Date().getFullYear()}/${unique}.${extensionFor(type)}`;

  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.storage
    .from("media")
    .upload(path, blob, { contentType: type, cacheControl: "31536000", upsert: false });
  if (error) {
    throw new Error(
      /mime|type/i.test(error.message)
        ? `“${file.name}” isn't a supported file type. Please upload JPG, PNG or WebP photos.`
        : `Upload failed: ${error.message}`,
    );
  }
  return supabase.storage.from("media").getPublicUrl(path).data.publicUrl;
}

/** A single photo field. */
export function ImageUpload({
  id,
  value,
  onChange,
  folder = "uploads",
  describedBy,
}: {
  id: string;
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  describedBy?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setBusy(true);
    try {
      onChange(await uploadImage(file, folder));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex h-28 w-40 shrink-0 items-center justify-center overflow-hidden rounded-[3px] border border-line bg-ink">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <ImageIcon width={28} height={28} className="text-mist" />
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            ref={inputRef}
            id={id}
            type="file"
            accept={ACCEPT}
            className="sr-only"
            aria-describedby={describedBy}
            onChange={(e) => handleFile(e.target.files?.[0])}
            disabled={busy}
          />
          <label
            htmlFor={id}
            className={`btn btn-outline min-h-11 cursor-pointer px-4 ${busy ? "pointer-events-none opacity-60" : ""}`}
          >
            {busy ? "Uploading…" : value ? "Replace photo" : "Upload photo"}
          </label>
          {value && !busy && (
            <button type="button" className="btn min-h-11 px-4 text-mist hover:text-danger" onClick={() => onChange("")}>
              Remove
            </button>
          )}
        </div>
      </div>
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

/** A set of photos: add several at once, reorder, remove. The first photo is shown first. */
export function MultiImageUpload({
  id,
  value,
  onChange,
  folder = "uploads",
  describedBy,
  max = 12,
}: {
  id: string;
  value: string[];
  onChange: (urls: string[]) => void;
  folder?: string;
  describedBy?: string;
  max?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const busy = progress !== null;
  const room = max - value.length;

  async function handleFiles(list: FileList | null) {
    if (!list || list.length === 0) return;
    const files = Array.from(list).slice(0, Math.max(0, room));
    const skipped = list.length - files.length;
    const problems: string[] = skipped > 0 ? [`Only ${max} photos fit here, so ${skipped} weren't added.`] : [];
    const added: string[] = [];
    setErrors([]);
    setProgress({ done: 0, total: files.length });
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        added.push(await uploadImage(file, folder));
      } catch (err) {
        problems.push(err instanceof Error ? err.message : `Couldn't upload “${file.name}”.`);
      }
      setProgress({ done: i + 1, total: files.length });
    }
    if (added.length) onChange([...value, ...added]);
    setErrors(problems);
    setProgress(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <div className="flex flex-col gap-3">
      {value.length > 0 ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {value.map((url, i) => (
            <li key={url} className="overflow-hidden rounded-[3px] border border-line bg-ink">
              <div className="relative aspect-[4/3]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="h-full w-full object-cover" />
                {i === 0 && (
                  <span className="absolute left-2 top-2 bg-ink/85 px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-gold">
                    Shown first
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between gap-1 px-1 py-1">
                <div className="flex">
                  <button
                    type="button"
                    onClick={() => move(i, -1)}
                    disabled={i === 0 || busy}
                    className="inline-flex h-10 w-10 items-center justify-center text-mist hover:text-cream disabled:opacity-30"
                    aria-label={`Move photo ${i + 1} earlier`}
                  >
                    <ChevronLeftIcon width={18} height={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(i, 1)}
                    disabled={i === value.length - 1 || busy}
                    className="inline-flex h-10 w-10 items-center justify-center text-mist hover:text-cream disabled:opacity-30"
                    aria-label={`Move photo ${i + 1} later`}
                  >
                    <ChevronRightIcon width={18} height={18} />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => onChange(value.filter((_, j) => j !== i))}
                  disabled={busy}
                  className="inline-flex h-10 w-10 items-center justify-center text-mist hover:text-danger"
                  aria-label={`Remove photo ${i + 1}`}
                >
                  <CloseIcon width={18} height={18} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex h-28 items-center justify-center gap-3 rounded-[3px] border border-dashed border-line bg-ink text-sm text-mist">
          <ImageIcon width={24} height={24} />
          No photos yet
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept={ACCEPT}
          multiple
          className="sr-only"
          aria-describedby={describedBy}
          onChange={(e) => handleFiles(e.target.files)}
          disabled={busy || room <= 0}
        />
        <label
          htmlFor={id}
          className={`btn btn-outline min-h-11 cursor-pointer px-4 ${busy || room <= 0 ? "pointer-events-none opacity-60" : ""}`}
        >
          {progress
            ? `Uploading ${Math.min(progress.done + 1, progress.total)} of ${progress.total}…`
            : value.length
              ? "Add more photos"
              : "Upload photos"}
        </label>
        <span className="text-xs text-mist">
          {value.length} of {max} · You can select several at once
        </span>
      </div>
      {errors.length > 0 && (
        <ul className="field-error flex flex-col gap-1" role="alert">
          {errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Uploads a PDF (like a menu) to storage, returning its public web address. */
async function uploadPdf(file: File, folder: string): Promise<string> {
  if (file.type !== "application/pdf" && !/\.pdf$/i.test(file.name)) {
    throw new Error(`“${file.name}” isn't a PDF. Please choose a .pdf file.`);
  }
  if (file.size > MAX_BYTES) {
    throw new Error(`“${file.name}” is too large. Please use a PDF under 10 MB.`);
  }
  const unique =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const path = `${folder}/${new Date().getFullYear()}/${unique}.pdf`;
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.storage
    .from("media")
    .upload(path, file, { contentType: "application/pdf", cacheControl: "31536000", upsert: false });
  if (error) throw new Error(`Upload failed: ${error.message}`);
  return supabase.storage.from("media").getPublicUrl(path).data.publicUrl;
}

/** A single PDF field (for example, the menu). */
export function FileUpload({
  id,
  value,
  onChange,
  folder = "uploads",
  describedBy,
}: {
  id: string;
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  describedBy?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setBusy(true);
    try {
      onChange(await uploadPdf(file, folder));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        {value ? (
          <a href={value} target="_blank" rel="noopener noreferrer" className="link-gold text-sm">
            View current PDF
          </a>
        ) : (
          <span className="text-sm text-mist">No PDF uploaded yet.</span>
        )}
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept="application/pdf,.pdf"
          className="sr-only"
          aria-describedby={describedBy}
          onChange={(e) => handleFile(e.target.files?.[0])}
          disabled={busy}
        />
        <label
          htmlFor={id}
          className={`btn btn-outline min-h-11 cursor-pointer px-4 ${busy ? "pointer-events-none opacity-60" : ""}`}
        >
          {busy ? "Uploading…" : value ? "Replace PDF" : "Upload PDF"}
        </label>
        {value && !busy && (
          <button type="button" className="btn min-h-11 px-4 text-mist hover:text-danger" onClick={() => onChange("")}>
            Remove
          </button>
        )}
      </div>
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
