"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { initPosthog, posthog } from "@/lib/posthog";
import { getVariant } from "@/lib/ab";

/**
 * Initializes PostHog once, then fires a $pageview on every route change.
 * App Router doesn't emit full page loads on client-side navigation, so
 * PostHog's own autocapture won't see those — we capture them manually.
 */
export default function PostHogInit() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    initPosthog();
    // Register every running A/B assignment as early as possible, on every
    // page/device — not just when a test's own UI happens to mount — so every
    // event in the session (including this page's own pageview below) carries
    // the variant tag, instead of only sessions that land on one specific page.
    getVariant("mobile_cta", ["control", "urgent"]);
    getVariant("start_tab", ["chat", "faq"]);
  }, []);

  useEffect(() => {
    if (!pathname) return;
    let url = window.origin + pathname;
    const qs = searchParams?.toString();
    if (qs) url += `?${qs}`;
    posthog.capture("$pageview", { $current_url: url });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]);

  return null;
}
