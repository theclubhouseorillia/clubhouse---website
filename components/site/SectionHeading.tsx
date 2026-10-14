import type { ReactNode } from "react";

export function SectionHeading({
  eyebrow,
  title,
  intro,
  align = "left",
  id,
  as: Tag = "h2",
}: {
  eyebrow?: string;
  title: ReactNode;
  intro?: ReactNode;
  align?: "left" | "center";
  id?: string;
  as?: "h1" | "h2";
}) {
  const centered = align === "center";
  return (
    <div className={`flex flex-col gap-4 ${centered ? "items-center text-center" : ""}`}>
      {eyebrow && (
        <div className={`flex items-center gap-4 ${centered ? "justify-center" : ""}`}>
          <span className="rule-gold" aria-hidden="true" />
          <span className="eyebrow">{eyebrow}</span>
        </div>
      )}
      <Tag
        id={id}
        className={`font-display font-semibold leading-[1.02] text-cream ${
          Tag === "h1" ? "text-5xl sm:text-6xl lg:text-7xl" : "text-4xl sm:text-5xl lg:text-[3.5rem]"
        }`}
      >
        {title}
      </Tag>
      {intro && <div className={`max-w-2xl text-lg leading-relaxed text-mist ${centered ? "mx-auto" : ""}`}>{intro}</div>}
    </div>
  );
}

/** Top-of-page banner used on inner pages. */
export function PageHeader({ eyebrow, title, intro }: { eyebrow: string; title: ReactNode; intro?: ReactNode }) {
  return (
    <header className="relative overflow-hidden border-b border-line bg-coal">
      <div className="dimples pointer-events-none absolute inset-0 opacity-40" aria-hidden="true" />
      <div className="container-site relative py-20 sm:py-28">
        <SectionHeading as="h1" eyebrow={eyebrow} title={title} intro={intro} />
      </div>
    </header>
  );
}
