"use client";

import { useEffect, useState } from "react";
import { trackEvent } from "@/lib/analytics";
import { applyReferralOverride } from "@/lib/site";

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
  // The server-rendered href always uses the site-wide default referral code
  // (pages are statically generated, so they can't vary per visitor). Once
  // hydrated, swap in the visitor's ref_override cookie if they have one —
  // this runs before any click/right-click can happen, so "copy link" and
  // "open in new tab" get the right code too, not just a direct click.
  const [resolvedHref, setResolvedHref] = useState(href);
  useEffect(() => {
    setResolvedHref(applyReferralOverride(href));
  }, [href]);

  return (
    <a
      href={resolvedHref}
      target={target}
      rel={rel}
      className={className}
      onClick={() => trackEvent(event, properties)}
    >
      {children}
    </a>
  );
}
