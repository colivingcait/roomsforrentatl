"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { initPosthog, posthog } from "@/lib/posthog";
import { getVariant } from "@/lib/ab";
import { analyticsMarket, entryVariant, isPadsplitHref, linkContext } from "@/lib/attribution";
import { referralCodeFor } from "@/lib/site";
import { trackEvent } from "@/lib/analytics";

/**
 * Initializes PostHog once, then fires a $pageview on every route change.
 * App Router doesn't emit full page loads on client-side navigation, so
 * PostHog's own autocapture won't see those — we capture them manually.
 *
 * Atlanta's /covilla redirect is recorded from covilla-landing, which other
 * market builds do not include.
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
    posthog.register({
      market: analyticsMarket(),
      entry_variant: entryVariant(),
      referral_code: referralCodeFor(),
    });
    if (process.env.NEXT_PUBLIC_MARKET === "atl") {
      require("@/components/covilla-landing").captureEntryLanding();
    }
  }, []);

  useEffect(() => {
    if (!pathname) return;
    let url = window.origin + pathname;
    const qs = searchParams?.toString();
    if (qs) url += `?${qs}`;
    posthog.capture("$pageview", { $current_url: url, $pathname: pathname });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const anchor = anchorFrom(event);
      if (!anchor || anchor.dataset.phTracked === "true") return;
      if (!isPadsplitHref(anchor.href)) return;
      const ctx = linkContext(anchor.href);
      trackEvent("outbound_padsplit", {
        href: anchor.href,
        referral_code: ctx.referral_code,
        house: ctx.house,
        room: ctx.room,
        section: anchor.dataset.phSection || "other",
      });
    };
    document.addEventListener("click", onClick, true);
    document.addEventListener("auxclick", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("auxclick", onClick, true);
    };
  }, []);

  return null;
}

function anchorFrom(event: Event): HTMLAnchorElement | null {
  const target = event.target;
  if (!(target instanceof Element)) return null;
  return target.closest("a");
}
