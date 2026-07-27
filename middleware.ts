import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Makes our short share-links (roomsforrentatl.com/willow, /m, /covilla, etc.)
 * case-insensitive. Phone keyboards auto-capitalize the first letter when
 * these get typed into a text message or notes app (e.g. "/Willow"), which
 * would otherwise 404 since Next's routing is case-sensitive. This silently
 * rewrites the mis-cased path to the correct one internally — the matched
 * route's own logic (redirect, UTM tagging, cookie-setting) still runs
 * exactly as normal, just under the corrected path.
 */
const SHORT_LINKS = new Set([
  "m",
  "l",
  "lustra",
  "covilla",
  "willow",
  "mora",
  "candace",
  "raven",
  "meadow",
  "chestnut",
]);

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const seg = pathname.slice(1);
  if (seg && !seg.includes("/") && seg !== seg.toLowerCase() && SHORT_LINKS.has(seg.toLowerCase())) {
    const url = req.nextUrl.clone();
    url.pathname = `/${seg.toLowerCase()}`;
    return NextResponse.rewrite(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|opengraph-image|twitter-image|robots.txt|sitemap.xml|api/).*)",
  ],
};
