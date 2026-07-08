"use client";

import { track as vercelTrack } from "@vercel/analytics";
import { posthog } from "./posthog";

/**
 * Fire a custom event to BOTH Vercel Analytics (counts, already set up) and
 * PostHog (funnels, session replay, path analysis). One call site, one event
 * name — use this instead of importing either tracker directly.
 */
export function trackEvent(
  name: string,
  properties?: Record<string, string | number | boolean | null>
) {
  vercelTrack(name, properties);
  posthog.capture(name, properties ?? undefined);
}
