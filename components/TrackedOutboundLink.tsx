"use client";

import { track } from "@vercel/analytics";

/**
 * A normal outbound <a> that fires a Vercel Analytics custom event just
 * before navigating (PadSplit "Book this room", TurboTenant "Apply", etc.).
 * `track()` is fire-and-forget (uses sendBeacon), so it never delays or
 * blocks the actual navigation.
 */
export default function TrackedOutboundLink({
  href,
  event,
  properties,
  className,
  children,
  target,
  rel,
}: {
  href: string;
  event: string;
  properties?: Record<string, string | number | boolean | null>;
  className?: string;
  children: React.ReactNode;
  target?: string;
  rel?: string;
}) {
  return (
    <a
      href={href}
      target={target}
      rel={rel}
      className={className}
      onClick={() => track(event, properties)}
    >
      {children}
    </a>
  );
}
