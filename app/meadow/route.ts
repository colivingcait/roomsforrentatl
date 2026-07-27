import { NextResponse } from "next/server";

/** Short, memorable link for sharing Meadow's page — roomsforrentatl.com/meadow instead of /house/30251. */
export function GET(req: Request) {
  const url = new URL(req.url);
  url.pathname = "/house/30251";
  return NextResponse.redirect(url, 302);
}
