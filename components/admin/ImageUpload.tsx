"use client";

import { useRef, useState } from "react";
import { ImageIcon } from "@/components/icons";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

const MAX_SIDE = 2000;
const MAX_BYTES = 10 * 1024 * 1024;

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
    if (!file.type.startsWith("image/")) {
      setError("Please choose a photo (JPG, PNG or WebP).");
      return;
    }
    setBusy(true);
    try {
      const blob = await prepareImage(file);
      if (blob.size > MAX_BYTES) {
        setError("That photo is too large. Please use one under 10 MB.");
        return;
      }
      const type = blob.type || file.type;
      const unique =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const path = `${folder}/${new Date().getFullYear()}/${unique}.${extensionFor(type)}`;

      const supabase = createSupabaseBrowserClient();
      const { error: uploadError } = await supabase.storage
        .from("media")
        .upload(path, blob, { contentType: type, cacheControl: "31536000", upsert: false });
      if (uploadError) {
        setError(
          /mime|type/i.test(uploadError.message)
            ? "That file type isn't supported. Please upload a JPG, PNG or WebP photo."
            : `Upload failed: ${uploadError.message}`,
        );
        return;
      }
      const { data } = supabase.storage.from("media").getPublicUrl(path);
      onChange(data.publicUrl);
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
            accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
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
