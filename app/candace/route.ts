import { NextResponse } from "next/server";

/** Short, memorable link for sharing Candace's page — roomsforrentatl.com/candace instead of /house/8299. */
export function GET(req: Request) {
  const url = new URL(req.url);
  url.pathname = "/house/8299";
  return NextResponse.redirect(url, 302);
}
