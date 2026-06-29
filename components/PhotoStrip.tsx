"use client";

import { useRef, useState } from "react";
import Image from "next/image";

/**
 * Photo carousel that is both SWIPEABLE and CLICKABLE inside a Link.
 * - Drag/swipe horizontally to flip photos (finger-follows, snaps on release).
 * - A tap (no real movement) falls through to the surrounding Link.
 * - Vertical swipes are ignored so the page still scrolls.
 * - Side arrows work too; they don't trigger the Link.
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
  const [index, setIndex] = useState(0);
  const [drag, setDrag] = useState(0);
  const [dragging, setDragging] = useState(false);
  const start = useRef<{ x: number; y: number } | null>(null);
  const moved = useRef(false);
  const horizontal = useRef(false);

  if (pics.length <= 1) {
    return (
      <Image src={pics[0] ?? "/icon.svg"} alt={alt} fill priority={priority} sizes={sizes} className="object-cover" />
    );
  }

  const clamp = (i: number) => Math.max(0, Math.min(pics.length - 1, i));
  const go = (dir: 1 | -1) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIndex((i) => clamp(i + dir));
  };

  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    start.current = { x: t.clientX, y: t.clientY };
    moved.current = false;
    horizontal.current = false;
    setDragging(true);
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (!start.current) return;
    const dx = e.touches[0].clientX - start.current.x;
    const dy = e.touches[0].clientY - start.current.y;
    if (!horizontal.current && Math.abs(dx) < Math.abs(dy)) {
      // Vertical intent — let the page scroll, stop tracking this gesture.
      start.current = null;
      setDragging(false);
      setDrag(0);
      return;
    }
    horizontal.current = true;
    if (Math.abs(dx) > 8) moved.current = true;
    setDrag(dx);
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!start.current) {
      setDragging(false);
      return;
    }
    const dx = e.changedTouches[0].clientX - start.current.x;
    start.current = null;
    setDragging(false);
    setDrag(0);
    if (Math.abs(dx) > 50) setIndex((i) => clamp(i + (dx < 0 ? 1 : -1)));
  };
  // Swallow the click that follows a swipe so the card's Link doesn't fire.
  const onClickCapture = (e: React.MouseEvent) => {
    if (moved.current) {
      e.preventDefault();
      e.stopPropagation();
      moved.current = false;
    }
  };

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onClickCapture={onClickCapture}
    >
      <div
        className={"flex h-full w-full " + (dragging ? "" : "transition-transform duration-300 ease-out")}
        style={{ transform: `translateX(calc(${-index * 100}% + ${drag}px))` }}
      >
        {pics.map((src, i) => (
          <div key={i} className="relative h-full w-full shrink-0">
            <Image
              src={src}
              alt={`${alt} photo ${i + 1}`}
              fill
              priority={priority && i === 0}
              sizes={sizes}
              draggable={false}
              className="object-cover"
            />
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={go(-1)}
        aria-label="Previous photo"
        className={
          "absolute left-2 top-1/2 z-10 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-2xl leading-none text-ink shadow transition active:scale-95 " +
          (index === 0 ? "pointer-events-none opacity-0" : "")
        }
      >
        ‹
      </button>
      <button
        type="button"
        onClick={go(1)}
        aria-label="Next photo"
        className={
          "absolute right-2 top-1/2 z-10 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-2xl leading-none text-ink shadow transition active:scale-95 " +
          (index === pics.length - 1 ? "pointer-events-none opacity-0" : "")
        }
      >
        ›
      </button>

      <div className="pointer-events-none absolute inset-x-0 bottom-2 flex justify-center gap-1">
        {pics.slice(0, 12).map((_, i) => (
          <span
            key={i}
            className={
              "h-1.5 rounded-full shadow transition-all " + (i === index ? "w-4 bg-white" : "w-1.5 bg-white/60")
            }
          />
        ))}
      </div>
    </div>
  );
}
