import { NextResponse } from "next/server";
import { REFERRAL_COOKIE } from "@/lib/site";

/**
 * Short link for traffic you want credited to the Covilla PadSplit profile —
 * roomsforrentatl.com/covilla instead of a long tagged URL. Used when
 * replying to Messenger conversations, so it also carries the same UTM tag
 * as /m. Sets a 30-day cookie so every "Book" link this visitor sees uses
 * that referral code, then redirects to the homepage.
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
  return res;
}
