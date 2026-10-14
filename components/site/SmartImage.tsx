import Image from "next/image";

const SUPABASE_HOST = (() => {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    return url ? new URL(url).hostname : null;
  } catch {
    return null;
  }
})();

/**
 * Fills its (relatively positioned) parent. Photos uploaded through the admin
 * dashboard are resized and served in modern formats by Next.js.
 */
export function SmartImage({
  src,
  alt,
  sizes = "100vw",
  className = "object-cover",
  priority = false,
}: {
  src: string;
  alt: string;
  sizes?: string;
  className?: string;
  priority?: boolean;
}) {
  let optimisable = false;
  try {
    optimisable = !!SUPABASE_HOST && new URL(src).hostname === SUPABASE_HOST;
  } catch {
    optimisable = false;
  }

  if (optimisable) {
    return <Image src={src} alt={alt} fill sizes={sizes} className={className} priority={priority} />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      className={`absolute inset-0 h-full w-full ${className}`}
    />
  );
}
