"use client";

import { trackEvent } from "@/lib/analytics";

/**
 * A normal outbound <a> that fires an analytics event (Vercel Analytics +
 * PostHog) just before navigating (PadSplit "Book this room", TurboTenant
 * "Apply", etc.). Fire-and-forget, so it never delays or blocks navigation.
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
      onClick={() => trackEvent(event, properties)}
    >
      {children}
    </a>
  );
}
