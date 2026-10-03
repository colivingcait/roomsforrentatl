import { NextResponse } from "next/server";
import { ENTRY_LANDING_COOKIE } from "@/lib/attribution";
import { REFERRAL_COOKIE } from "@/lib/site";

/**
 * Short link for traffic you want credited to the Covilla PadSplit profile —
 * roomsforrentatl.com/covilla instead of a long tagged URL. Used when
 * replying to Messenger conversations, so it also carries the same UTM tag
 * as /m. Sets a 30-day cookie so every "Book" link this visitor sees uses
 * that referral code, then redirects to the homepage.
 *
 * The redirect happens before any browser JS, so PostHog never sees a
 * document at /covilla. ref_landing marks this one response. The client
 * records a single /covilla pageview from it, then deletes the cookie.
 * ref_override stays for 30 days and is what PadSplit links read.
 */
export function GET(req: Request) {
  const url = new URL(req.url);
  url.pathname = "/";
  url.search = "?utm_source=messenger&utm_medium=chat";
  const res = NextResponse.redirect(url, 302);
  res.cookies.set(REFERRAL_COOKIE, "covilla", {
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
    sameSite: "lax",
  });
  res.cookies.set(ENTRY_LANDING_COOKIE, "covilla", {
    maxAge: 120,
    path: "/",
    sameSite: "lax",
  });
  return res;
}
