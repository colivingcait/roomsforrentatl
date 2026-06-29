"use client";

import { useRef } from "react";
import Image from "next/image";

/**
 * Swipeable photo strip with clickable side arrows. Lives happily inside a Link:
 * arrow clicks stop propagation so they scroll instead of following the link,
 * and a swipe scrolls naturally.
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
  const ref = useRef<HTMLDivElement>(null);
  const pics = images.filter(Boolean);

  if (pics.length <= 1) {
    return (
      <Image src={pics[0] ?? "/icon.svg"} alt={alt} fill priority={priority} sizes={sizes} className="object-cover" />
    );
  }

  const scroll = (dir: 1 | -1) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const el = ref.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth, behavior: "smooth" });
  };

  return (
    <>
      <div
        ref={ref}
        className="flex h-full w-full snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {pics.map((src, i) => (
          <div key={i} className="relative h-full w-full shrink-0 snap-center">
            <Image src={src} alt={`${alt} photo ${i + 1}`} fill priority={priority && i === 0} sizes={sizes} className="object-cover" />
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={scroll(-1)}
        aria-label="Previous photo"
        className="absolute left-2 top-1/2 z-10 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-2xl leading-none text-ink shadow active:scale-95"
      >
        ‹
      </button>
      <button
        type="button"
        onClick={scroll(1)}
        aria-label="Next photo"
        className="absolute right-2 top-1/2 z-10 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-2xl leading-none text-ink shadow active:scale-95"
      >
        ›
      </button>

      <div className="pointer-events-none absolute inset-x-0 bottom-2 flex justify-center gap-1">
        {pics.slice(0, 12).map((_, i) => (
          <span key={i} className="h-1.5 w-1.5 rounded-full bg-white/70 shadow" />
        ))}
      </div>
    </>
  );
}
