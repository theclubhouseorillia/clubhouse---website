import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MailIcon, PhoneIcon } from "@/components/icons";
import { PageHeader } from "@/components/site/SectionHeading";
import { getFaqs, getSettings } from "@/lib/data";
import { hasPlaceholderText, real, telHref } from "@/lib/format";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return {
    title: "FAQ",
    description: `Answers to common questions about golf simulators, bookings, rental clubs, food and private events at ${settings.business_name}.`,
    alternates: { canonical: "/faq" },
  };
}

export default async function FaqPage() {
  const [faqs, settings] = await Promise.all([getFaqs(), getSettings()]);
  // Questions whose answer still has a [placeholder] stay hidden until it's filled in.
  const answered = faqs.filter((f) => f.question.trim() && !hasPlaceholderText(f.answer));
  if (answered.length === 0) notFound();

  const phone = real(settings.phone);
  const tel = telHref(settings.phone);
  const email = real(settings.public_email);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: answered.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };

  return (
    <>
      <PageHeader
        eyebrow="Good to know"
        title="Frequently asked questions"
        intro="Everything you need to know before your visit. Can't find your answer? Just give us a call."
      />

      <section className="py-16 sm:py-24">
        <div className="container-site max-w-4xl">
          <div className="flex flex-col divide-y divide-line border-y border-line">
            {answered.map((faq) => (
              <details key={faq.id} className="group">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-6 text-left [&::-webkit-details-marker]:hidden">
                  <h2 className="font-display text-2xl font-semibold text-cream transition group-hover:text-gold-2 sm:text-[1.7rem]">
                    {faq.question}
                  </h2>
                  <span
                    aria-hidden="true"
                    className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line text-xl leading-none text-gold transition-transform duration-200 group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="max-w-3xl pb-7 text-lg leading-relaxed whitespace-pre-line text-mist">{faq.answer}</p>
              </details>
            ))}
          </div>

          <div className="mt-14 flex flex-col items-start gap-6 border border-gold/40 bg-forest p-8 sm:p-10">
            <div className="flex flex-col gap-2">
              <h2 className="font-display text-3xl font-semibold text-cream">Still have a question?</h2>
              <p className="text-cream/85">We&apos;re happy to help.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              {tel && phone && (
                <a href={tel} className="btn btn-gold">
                  <PhoneIcon width={16} height={16} />
                  Call {phone}
                </a>
              )}
              {email && (
                <a href={`mailto:${email}`} className="btn btn-outline">
                  <MailIcon width={16} height={16} />
                  Email us
                </a>
              )}
              <Link href="/contact" className="btn btn-outline">
                Contact page
              </Link>
            </div>
          </div>
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
    </>
  );
}
