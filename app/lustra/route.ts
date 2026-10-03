import { NextResponse } from "next/server";
import { REFERRAL_COOKIE } from "@/lib/site";

/**
 * Short link at /lustra. Sets a 30-day referral cookie, then redirects home.
 * The cookie keeps the main referral code. It is not a house name.
 */
export function GET(req: Request) {
  const url = new URL(req.url);
  url.pathname = "/";
  url.search = "";
  const res = NextResponse.redirect(url, 302);
  res.cookies.set(REFERRAL_COOKIE, "lustra", {
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
    sameSite: "lax",
  });
  return res;
}
