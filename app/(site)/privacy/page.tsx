import type { Metadata } from "next";
import { Fragment } from "react";
import { PageHeader } from "@/components/site/SectionHeading";
import { getPrivacyPolicy, getSettings } from "@/lib/data";
import { formatFullDate } from "@/lib/format";
import { toBlocks } from "@/lib/richText";
import { fillTokens } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "How we collect, use and protect the personal information you share through our website.",
  alternates: { canonical: "/privacy" },
};

export default async function PrivacyPage() {
  const [policy, settings] = await Promise.all([getPrivacyPolicy(), getSettings()]);
  const blocks = toBlocks(fillTokens(policy.content, settings));

  return (
    <>
      <PageHeader
        eyebrow="Policies"
        title="Privacy policy"
        intro={policy.updated_on ? `Last updated ${formatFullDate(policy.updated_on)}` : undefined}
      />
      <section className="py-16 sm:py-24">
        <div className="container-site flex max-w-3xl flex-col gap-5 text-lg leading-relaxed text-mist">
          {blocks.length === 0 && (
            <p>Questions about how we handle your information? Please contact us and we&apos;ll be happy to help.</p>
          )}
          {blocks.map((block, i) => (
            <Fragment key={i}>
              {block.kind === "heading" && (
                <h2 className="mt-6 font-display text-3xl font-semibold text-cream first:mt-0">{block.text}</h2>
              )}
              {block.kind === "list" && (
                <ul className="flex list-disc flex-col gap-2 pl-6 marker:text-gold">
                  {block.items.map((item, j) => (
                    <li key={j}>{item}</li>
                  ))}
                </ul>
              )}
              {block.kind === "paragraph" && <p className="whitespace-pre-line">{block.text}</p>}
            </Fragment>
          ))}
        </div>
      </section>
    </>
  );
}
