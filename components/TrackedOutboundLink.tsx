"use client";

import { useEffect, useState } from "react";
import { trackEvent } from "@/lib/analytics";
import { linkContext } from "@/lib/attribution";
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
  ariaLabel,
  dataAttr,
  capture,
}: {
  href: string;
  event: string;
  properties?: Record<string, string | number | boolean | null>;
  className?: string;
  children: React.ReactNode;
  target?: string;
  rel?: string;
  ariaLabel?: string;
  /** Autocapture name. The project reads the data-attr attribute. */
  dataAttr?: string;
  /** Extra autocapture properties, sent as data-ph-capture-attribute-*. */
  capture?: Record<string, string | number | null | undefined>;
}) {
  // The server-rendered href always uses the site-wide default referral code
  // (pages are statically generated, so they can't vary per visitor). Once
  // hydrated, swap in the visitor's ref_override cookie if they have one —
  // this runs before any click/right-click can happen, so "copy link" and
  // "open in new tab" get the right code too, not just a direct click.
  // A document listener in the root layout also rewrites the href on
  // pointerdown, which covers a tap that lands before this effect.
  const [resolvedHref, setResolvedHref] = useState(href);
  useEffect(() => {
    setResolvedHref(applyReferralOverride(href));
  }, [href]);

  const captureProps: Record<string, string> = {};
  if (capture) {
    for (const [key, value] of Object.entries(capture)) {
      if (value != null && value !== "") captureProps[`data-ph-capture-attribute-${key}`] = String(value);
    }
  }

  const track = (anchor: HTMLAnchorElement) => {
    const next = anchor.href || resolvedHref;
    const ctx = linkContext(next);
    trackEvent(event, {
      ...properties,
      href: next,
      referral_code: ctx.referral_code,
      ...(event === "book_click"
        ? {
            house: properties?.house ?? ctx.house,
            room: properties?.room ?? ctx.room,
            section: properties?.section ?? "card",
          }
        : {}),
    });
  };

  return (
    <a
      href={resolvedHref}
      target={target}
      rel={rel}
      className={className}
      aria-label={ariaLabel}
      data-attr={dataAttr}
      data-ph-tracked="true"
      {...captureProps}
      onClick={(e) => track(e.currentTarget)}
      onAuxClick={(e) => track(e.currentTarget)}
    >
      {children}
    </a>
  );
}
