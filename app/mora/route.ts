import { NextResponse } from "next/server";

/** Short, memorable link for sharing Mora's page — roomsforrentatl.com/mora instead of /house/35011. */
export function GET(req: Request) {
  const url = new URL(req.url);
  url.pathname = "/house/35011";
  return NextResponse.redirect(url, 302);
}
