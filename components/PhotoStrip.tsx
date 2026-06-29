import Image from "next/image";

/**
 * Horizontal, swipeable photo strip (pure CSS scroll-snap — works inside a Link:
 * a swipe scrolls, a tap follows the link). Falls back to a single image.
 */
export default function PhotoStrip({
  images,
  alt,
  sizes = "(max-width: 768px) 100vw, 50vw",
  priority = false,
}: {
  images: string[];
  alt: string;
  sizes?: string;
  priority?: boolean;
}) {
  const pics = images.filter(Boolean);
  if (pics.length <= 1) {
    return (
      <Image
        src={pics[0] ?? "/icon.svg"}
        alt={alt}
        fill
        priority={priority}
        sizes={sizes}
        className="object-cover"
      />
    );
  }
  return (
    <div className="flex h-full w-full snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {pics.map((src, i) => (
        <div key={i} className="relative h-full w-full shrink-0 snap-center">
          <Image src={src} alt={`${alt} photo ${i + 1}`} fill priority={priority && i === 0} sizes={sizes} className="object-cover" />
        </div>
      ))}
      {/* dots */}
      <div className="pointer-events-none absolute inset-x-0 bottom-2 flex justify-center gap-1">
        {pics.slice(0, 8).map((_, i) => (
          <span key={i} className="h-1.5 w-1.5 rounded-full bg-white/70 shadow" />
        ))}
      </div>
    </div>
  );
}
