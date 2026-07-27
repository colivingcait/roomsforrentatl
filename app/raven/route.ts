import { NextResponse } from "next/server";

/** Short, memorable link for sharing Raven's page — roomsforrentatl.com/raven instead of /house/11889. */
export function GET(req: Request) {
  const url = new URL(req.url);
  url.pathname = "/house/11889";
  return NextResponse.redirect(url, 302);
}
