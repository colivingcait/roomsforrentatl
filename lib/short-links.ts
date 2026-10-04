import { NextResponse } from "next/server";
import { getMarket } from "./market";

/** Atlanta house nicknames. Other markets have no shortHouses, so the path 404s. */
export function redirectHouse(req: Request, key: string) {
  const id = getMarket().shortHouses?.[key];
  if (!id) return new NextResponse(null, { status: 404 });
  const url = new URL(req.url);
  url.pathname = `/house/${id}`;
  return NextResponse.redirect(url, 302);
}
