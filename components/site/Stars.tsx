import { StarIcon } from "@/components/icons";

/** Five stars filled to match a rating (partial stars for ratings like 4.7). */
export function Stars({ rating, size = 18, className = "" }: { rating: number; size?: number; className?: string }) {
  const value = Math.min(5, Math.max(0, rating));
  const label = `Rated ${Number.isInteger(value) ? value : value.toFixed(1)} out of 5`;
  const row = (filled: boolean) => (
    <span className="flex shrink-0 gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <StarIcon
          key={i}
          width={size}
          height={size}
          className="shrink-0"
          fill={filled ? "currentColor" : "none"}
        />
      ))}
    </span>
  );
  return (
    <span role="img" aria-label={label} className={`relative inline-flex ${className}`}>
      <span className="text-line">{row(false)}</span>
      <span className="absolute inset-y-0 left-0 overflow-hidden text-gold" style={{ width: `${(value / 5) * 100}%` }}>
        {row(true)}
      </span>
    </span>
  );
}
