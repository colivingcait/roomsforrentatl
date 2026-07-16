import { NextResponse } from "next/server";

/**
 * Short, clean link for pasting into Facebook Messenger chats —
 * roomsforrentatl.com/m instead of a long ?utm_source=... URL that renders as
 * ugly raw underlined text in Messenger. Redirects to the homepage with the
 * UTM tag attached server-side, invisible to whoever clicks it.
 */
export function GET(req: Request) {
  const url = new URL(req.url);
  url.pathname = "/";
  url.search = "?utm_source=messenger&utm_medium=chat";
  return NextResponse.redirect(url, 302);
}
