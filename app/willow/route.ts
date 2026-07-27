import { NextResponse } from "next/server";

/** Short, memorable link for sharing Willow's page — roomsforrentatl.com/willow instead of /house/39708. */
export function GET(req: Request) {
  const url = new URL(req.url);
  url.pathname = "/house/39708";
  return NextResponse.redirect(url, 302);
}
