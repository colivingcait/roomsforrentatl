/**
 * Which referral a visitor should carry, and which market this build is.
 *
 * /covilla sets the ref_override cookie, then redirects home before any page
 * JS runs. The cookie is the source of truth for the code on PadSplit links.
 * A short-lived ref_landing cookie tells the browser that this load was that
 * redirect, so PostHog can record the /covilla landing once.
 *
 * NEXT_PUBLIC_MARKET is unset on Atlanta and "dfw" on the Dallas–Fort Worth
 * deployment. Referral codes themselves stay in lib/site.ts.
 */
import { MAIN_REFERRAL_CODE, REFERRAL_OVERRIDES, referralCodeFor, site } from "./site";

export const ENTRY_LANDING_COOKIE = "ref_landing";

export function analyticsMarket(): string {
  const raw = process.env.NEXT_PUBLIC_MARKET?.trim().toLowerCase();
  return raw || "atl";
}

export function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function clearCookie(name: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`;
}

/** "covilla" when that entry's override cookie is set, otherwise "main". */
export function entryVariantFromCookie(cookieValue: string | null | undefined): string {
  if (cookieValue && REFERRAL_OVERRIDES[cookieValue]) return cookieValue;
  return "main";
}

export function entryVariant(): string {
  return entryVariantFromCookie(readCookie("ref_override"));
}

export function isPadsplitHost(hostname: string): boolean {
  return hostname === "padsplit.com" || hostname.endsWith(".padsplit.com");
}

export function isPadsplitHref(href: string): boolean {
  try {
    return isPadsplitHost(new URL(href, "https://localhost").hostname);
  } catch {
    return false;
  }
}

export function linkContext(href: string): {
  house: string | null;
  room: string | null;
  referral_code: string;
} {
  const fallback = referralCodeFor();
  try {
    const u = new URL(href, "https://localhost");
    if (isPadsplitHost(u.hostname)) {
      const details = u.pathname.match(/\/room-details\/(\d+)\/(\d+)/);
      const listing = u.pathname.match(/\/listing\/(\d+)/);
      const roomFromHash = u.hash.match(/room-number-(\d+)/)?.[1] ?? null;
      const room = details?.[2] ?? u.searchParams.get("roomId") ?? roomFromHash;
      return {
        house: details?.[1] ?? listing?.[1] ?? null,
        room,
        referral_code: u.searchParams.get(site.referral.param) || fallback,
      };
    }
    const internal = u.pathname.match(/\/house\/([^/]+)(?:\/room\/([^/]+))?/);
    if (internal) {
      return { house: internal[1], room: internal[2] ?? null, referral_code: fallback };
    }
  } catch {
    // Fall through to the visitor's code with no house or room.
  }
  return { house: null, room: null, referral_code: fallback };
}

/** Point a PadSplit anchor at the code for this visitor's entry. No-op otherwise. */
export function rewritePadsplitAnchor(anchor: HTMLAnchorElement): string {
  if (!isPadsplitHref(anchor.href)) return anchor.href;
  try {
    const u = new URL(anchor.href);
    u.searchParams.set(site.referral.param, referralCodeFor());
    const next = u.toString();
    if (anchor.href !== next) anchor.href = next;
    return anchor.href;
  } catch {
    return anchor.href;
  }
}

/**
 * Runs before React hydrates, so a tap on a server-rendered Book link still
 * uses the entry's code. Codes come from lib/site.ts at build time, which is
 * the main code unless NEXT_PUBLIC_MARKET swaps them.
 */
export function referralRewriteScript(): string {
  const payload = JSON.stringify({
    param: site.referral.param,
    cookie: "ref_override",
    main: MAIN_REFERRAL_CODE,
    overrides: REFERRAL_OVERRIDES,
  }).replace(/</g, "\\u003c");
  return `(function(){var c=${payload};function code(){var m=document.cookie.match(new RegExp("(?:^|;\\\\s*)"+c.cookie+"=([^;]*)"));var key=m?decodeURIComponent(m[1]):"";return (key&&c.overrides[key])||c.main;}function rewrite(a){try{var u=new URL(a.href);if(u.hostname!=="padsplit.com"&&u.hostname.slice(-13)!==".padsplit.com")return;u.searchParams.set(c.param,code());var next=u.toString();if(a.href!==next)a.href=next;}catch(e){}}function from(e){var t=e.target;if(!t||!t.closest)return null;return t.closest("a");}function on(e){var a=from(e);if(a)rewrite(a);}document.addEventListener("pointerdown",on,true);document.addEventListener("focusin",on,true);document.addEventListener("contextmenu",on,true);})();`;
}
