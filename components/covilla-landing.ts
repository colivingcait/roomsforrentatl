import { posthog } from "@/lib/posthog";
import { analyticsMarket, clearCookie, ENTRY_LANDING_COOKIE, readCookie } from "@/lib/attribution";
import { referralCodeFor } from "@/lib/site";

const LANDING_SENT = "rfr_covilla_pv";

/**
 * /covilla is a server redirect, so the browser only ever loads `/`.
 * ref_landing is set on that redirect and consumed here as one $pageview
 * whose path is /covilla. Atlanta-only; other builds do not import this module.
 */
export function captureEntryLanding() {
  if (readCookie(ENTRY_LANDING_COOKIE) !== "covilla") return;
  try {
    if (sessionStorage.getItem(LANDING_SENT)) {
      clearCookie(ENTRY_LANDING_COOKIE);
      return;
    }
    sessionStorage.setItem(LANDING_SENT, "1");
  } catch {
    // Private mode can block sessionStorage. The short-lived cookie still
    // limits a repeat to the next couple of minutes.
  }
  const url = `${window.location.origin}/covilla${window.location.search}`;
  const code = referralCodeFor();
  posthog.capture(
    "$pageview",
    {
      $current_url: url,
      $pathname: "/covilla",
      entry_variant: "covilla",
      referral_code: code,
      market: analyticsMarket(),
    },
    { $set_once: { $initial_pathname: "/covilla" } }
  );
  clearCookie(ENTRY_LANDING_COOKIE);
}
