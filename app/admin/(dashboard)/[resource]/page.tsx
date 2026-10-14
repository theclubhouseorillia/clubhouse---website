import { notFound } from "next/navigation";
import { ResourceManager } from "@/components/admin/ResourceManager";
import type { RelationOptions } from "@/components/admin/fieldValues";
import { requireAdmin } from "@/lib/auth";
import { getResource } from "@/lib/resources";

export const dynamic = "force-dynamic";

export default async function ResourcePage({ params }: { params: Promise<{ resource: string }> }) {
  const { resource } = await params;
  const def = getResource(resource);
  if (!def) notFound();

  const { supabase } = await requireAdmin();

  let query = supabase.from(def.table).select("*");
  for (const o of def.orderBy) {
    query = query.order(o.column, { ascending: o.ascending ?? true });
  }
  const { data, error } = await query;

  const relationOptions: RelationOptions = {};
  for (const field of def.fields) {
    if (field.type !== "relation" || !field.relation) continue;
    const { table, labelField } = field.relation;
    const { data: rel } = await supabase.from(table).select("*").order("sort_order");
    relationOptions[field.name] = ((rel ?? []) as Record<string, unknown>[]).map((r) => ({
      value: String(r.id),
      label: String(r[labelField] ?? ""),
    }));
  }

  return (
    <ResourceManager
      key={def.key}
      resourceKey={def.key}
      rows={(data ?? []) as Record<string, unknown>[]}
      relationOptions={relationOptions}
      loadError={error?.message ?? null}
    />
  );
}
