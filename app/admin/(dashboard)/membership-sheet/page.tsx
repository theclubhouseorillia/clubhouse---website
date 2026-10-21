import Link from "next/link";
import { DownloadIcon } from "@/components/icons";
import { requireAdmin } from "@/lib/auth";
import { SHEET_COLUMNS, SHEET_SELECT, toSheetRow, type MemberSheetSource } from "@/lib/member-sheet";

export const dynamic = "force-dynamic";

export default async function MembershipSheetPage() {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from("members")
    .select(SHEET_SELECT)
    .not("stripe_checkout_id", "like", "cs_test_%")
    .order("created_at", { ascending: false });

  const source = (data ?? []) as MemberSheetSource[];
  const rows = source.map(toSheetRow);
  const memberships = source.filter((m) => m.kind !== "pack");
  const packs = source.length - memberships.length;
  const active = memberships.filter((m) => m.status === "active").length;
  const waiting = memberships.filter((m) => (m.status === "active" || m.status === "ending") && !m.member_code?.trim()).length;
  const cancelled = memberships.filter((m) => m.status === "ending" || m.status === "canceled").length;

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://theclubhouseorillia.ca").replace(/\/+$/, "");
  const key = process.env.MEMBERS_SHEET_KEY;
  const sheetUrl = key ? `${siteUrl}/api/members/sheet?key=${encodeURIComponent(key)}` : null;

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-3 border-b border-line pb-6">
        <h1 className="font-display text-4xl font-semibold text-cream">Membership &amp; 10-hour pack spreadsheet</h1>
        <p className="max-w-3xl text-mist">
          Every membership and 10-hour pack bought online, with codes and dates. It updates automatically when someone
          joins, buys a pack, renews, cancels or a payment fails, and when you save a code in{" "}
          <Link href="/admin/members" className="link-gold">
            Members &amp; pack buyers
          </Link>
          . Test purchases are left out.
        </p>
      </header>

      {error && <p className="card p-4 text-danger">Couldn&apos;t load members: {error.message}</p>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Active members", value: active },
          { label: "Waiting for a code", value: waiting },
          { label: "Cancelled or ended", value: cancelled },
          { label: "10-hour packs sold", value: packs },
        ].map((s) => (
          <div key={s.label} className="card flex flex-col gap-1 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-mist">{s.label}</p>
            <p className="font-display text-4xl font-semibold text-cream">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <a href="/admin/membership-sheet/download" className="btn btn-gold">
          <DownloadIcon width={18} height={18} />
          Download for Excel
        </a>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[1200px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-line">
              {SHEET_COLUMNS.map((c) => (
                <th key={c.key} scope="col" className="whitespace-nowrap px-4 py-3 text-xs font-bold uppercase tracking-[0.14em] text-mist">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={SHEET_COLUMNS.length} className="px-4 py-8 text-mist">
                  No purchases yet. Memberships and 10-hour packs appear here as soon as someone buys one online.
                </td>
              </tr>
            ) : (
              rows.map((r, i) => (
                <tr key={`${r.email}-${i}`} className="border-b border-line/60 last:border-b-0">
                  {SHEET_COLUMNS.map((c) => (
                    <td
                      key={c.key}
                      className={`whitespace-nowrap px-4 py-3 ${
                        c.key === "code" && r.code === "Waiting for code"
                          ? "font-semibold text-gold-2"
                          : c.key === "name"
                            ? "font-semibold text-cream"
                            : "text-cream/85"
                      }`}
                    >
                      {r[c.key] || "—"}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <section className="card flex flex-col gap-4 p-5 sm:p-8">
        <h2 className="font-display text-2xl font-semibold text-cream">Keep a Google Sheet that updates itself</h2>
        {sheetUrl ? (
          <>
            <ol className="flex list-decimal flex-col gap-2 pl-5 text-mist">
              <li>
                Open{" "}
                <a href="https://sheets.new" target="_blank" rel="noopener noreferrer" className="link-gold">
                  a new Google Sheet
                </a>{" "}
                and click cell A1.
              </li>
              <li>Copy the formula below, paste it into A1 and press Enter.</li>
              <li>That&apos;s it. Google refreshes it automatically (about once an hour), so new members, 10-hour pack buyers and cancellations show up on their own.</li>
            </ol>
            <label className="flex flex-col gap-2 text-sm text-mist">
              Formula
              <textarea
                readOnly
                rows={3}
                value={`=IMPORTDATA("${sheetUrl}")`}
                className="w-full rounded-[3px] border border-line bg-ink p-3 font-mono text-xs text-cream"
              />
            </label>
            <p className="text-sm text-mist">
              Using Excel instead? In Excel go to <strong className="text-cream">Data → From Web</strong>, paste the link
              inside the quotes, then set it to refresh every 60 minutes under Query Properties. Keep this link private:
              anyone with it can see your members&apos; details.
            </p>
          </>
        ) : (
          <p className="text-mist">The private sheet link isn&apos;t set up yet (MEMBERS_SHEET_KEY is missing).</p>
        )}
      </section>
    </div>
  );
}
