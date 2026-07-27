import { NextResponse } from "next/server";

/** Short, memorable link for sharing Chestnut's page — roomsforrentatl.com/chestnut instead of /house/152. */
export function GET(req: Request) {
  const url = new URL(req.url);
  url.pathname = "/house/152";
  return NextResponse.redirect(url, 302);
}
