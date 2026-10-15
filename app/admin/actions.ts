"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getResource } from "@/lib/resources";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { validateRecord } from "@/lib/validate";

export type ActionResult = { ok: true } | { ok: false; error: string };

const STORAGE_PREFIX = "/storage/v1/object/public/media/";

function friendly(message: string): string {
  if (/row-level security|permission denied/i.test(message)) {
    return "Your account doesn't have permission to make this change.";
  }
  if (/violates foreign key/i.test(message)) return "That item is linked to something else and can't be changed this way.";
  if (/duplicate key/i.test(message)) return "That already exists.";
  return `Couldn't save: ${message}`;
}

/** Refresh every public page so changes appear immediately. */
function refreshSite() {
  revalidatePath("/", "layout");
}

export async function saveRecord(
  resourceKey: string,
  id: string | null,
  values: Record<string, unknown>,
  partial = false,
): Promise<ActionResult> {
  const def = getResource(resourceKey);
  if (!def) return { ok: false, error: "Unknown section." };

  const { supabase } = await requireAdmin();

  const result = validateRecord(def, values ?? {}, partial);
  if (!result.ok) return result;

  const data = { ...result.data };
  if (def.touchUpdatedAt) data.updated_at = new Date().toISOString();

  if (def.singleton) {
    const { error } = await supabase.from(def.table).upsert({ id: 1, ...data }).select("id");
    if (error) return { ok: false, error: friendly(error.message) };
  } else if (id) {
    const { data: updated, error } = await supabase.from(def.table).update(data).eq("id", id).select("id");
    if (error) return { ok: false, error: friendly(error.message) };
    if (!updated || updated.length === 0) {
      return { ok: false, error: "Nothing was saved. The item may have been deleted, or your account lacks permission." };
    }
  } else {
    if (def.allowCreate === false) return { ok: false, error: "New items can't be added here." };
    const { error } = await supabase.from(def.table).insert(data).select("id");
    if (error) return { ok: false, error: friendly(error.message) };
  }

  refreshSite();
  revalidatePath(`/admin/${def.key}`);
  return { ok: true };
}

export async function deleteRecord(resourceKey: string, id: string): Promise<ActionResult> {
  const def = getResource(resourceKey);
  if (!def) return { ok: false, error: "Unknown section." };
  if (def.singleton || def.allowDelete === false) return { ok: false, error: "This can't be deleted." };
  if (!id) return { ok: false, error: "Missing item." };

  const { supabase } = await requireAdmin();

  // Remember uploaded photos so we can tidy them up after deleting the row.
  const imageFields = def.fields.filter((f) => f.type === "image" || f.type === "images").map((f) => f.name);
  let imagePaths: string[] = [];
  if (imageFields.length) {
    const { data: row } = await supabase.from(def.table).select("*").eq("id", id).maybeSingle();
    if (row) {
      imagePaths = imageFields
        .flatMap((name) => {
          const v = (row as Record<string, unknown>)[name];
          return Array.isArray(v) ? v : [v];
        })
        .filter((v): v is string => typeof v === "string" && v.includes(STORAGE_PREFIX))
        .map((url) => decodeURIComponent(url.split(STORAGE_PREFIX)[1]?.split("?")[0] ?? ""))
        .filter(Boolean);
    }
  }

  const { data: deleted, error } = await supabase.from(def.table).delete().eq("id", id).select("id");
  if (error) return { ok: false, error: friendly(error.message) };
  if (!deleted || deleted.length === 0) return { ok: false, error: "Nothing was deleted." };

  if (imagePaths.length) {
    const { error: storageError } = await supabase.storage.from("media").remove(imagePaths);
    if (storageError) console.error("[admin] photo cleanup failed:", storageError.message);
  }

  refreshSite();
  revalidatePath(`/admin/${def.key}`);
  return { ok: true };
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
