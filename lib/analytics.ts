"use client";

import { track as vercelTrack } from "@vercel/analytics";
import { analyticsMarket, entryVariant } from "./attribution";
import { referralCodeFor } from "./site";
import { posthog } from "./posthog";

/**
 * Fire a custom event to BOTH Vercel Analytics (counts, already set up) and
 * PostHog (funnels, session replay, path analysis). One call site, one event
 * name — use this instead of importing either tracker directly.
 *
 * market and entry_variant are added on every event so Atlanta and
 * Dallas–Fort Worth stay distinguishable when this build is shared.
 */
export function trackEvent(
  name: string,
  properties?: Record<string, string | number | boolean | null>
) {
  const payload = {
    market: analyticsMarket(),
    entry_variant: entryVariant(),
    referral_code: referralCodeFor(),
    ...properties,
  };
  vercelTrack(name, payload);
  posthog.capture(name, payload);
}
