import { NextResponse } from "next/server";

/**
 * Short, clean link for Facebook Marketplace listings —
 * roomsforrentatl.com/l instead of a long ?utm_source=... URL that looks
 * spammy pasted into a listing. Redirects to the homepage with the UTM tag
 * attached server-side, invisible to whoever clicks it.
 */
export function GET(req: Request) {
  const url = new URL(req.url);
  url.pathname = "/";
  url.search = "?utm_source=marketplace&utm_medium=listing";
  return NextResponse.redirect(url, 302);
}
