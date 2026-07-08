"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { initPosthog, posthog } from "@/lib/posthog";

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
