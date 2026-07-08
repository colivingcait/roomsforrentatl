"use client";

import { posthog } from "./posthog";

/**
 * Stable client-side A/B assignment, persisted in localStorage so a visitor
 * keeps seeing the same variant across visits. Registers the assignment as a
 * PostHog "super property" so every event from this visitor (chat_opened,
 * chat_message_sent, book_click, ...) is automatically tagged with it — no
 * need to thread the variant through each trackEvent call site.
 */
export function getVariant(testKey: string, variants: [string, string]): string {
  if (typeof window === "undefined") return variants[0];
  const storageKey = `rfr_ab_${testKey}`;
  try {
    let variant = localStorage.getItem(storageKey);
    if (variant !== variants[0] && variant !== variants[1]) {
      variant = Math.random() < 0.5 ? variants[0] : variants[1];
      localStorage.setItem(storageKey, variant);
    }
    posthog.register({ [`ab_${testKey}`]: variant });
    return variant;
  } catch {
    return variants[0];
  }
}
