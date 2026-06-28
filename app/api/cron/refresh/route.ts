import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getAllSlugs } from "@/lib/listings";

export const dynamic = "force-dynamic";

/**
 * Scheduled refresh endpoint. Vercel Cron (see vercel.json) hits this on a
 * schedule to force the homepage and every room page to re-pull live PadSplit
 * pricing/availability, so changes show up without waiting for organic traffic.
 *
 * Protected by CRON_SECRET so randoms can't trigger it. Set CRON_SECRET in your
 * Vercel project settings; Vercel Cron automatically sends it as a Bearer token.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }
  }

  revalidatePath("/");
  for (const slug of getAllSlugs()) {
    revalidatePath(`/room/${slug}`);
  }

  return NextResponse.json({
    ok: true,
    revalidated: ["/", ...getAllSlugs().map((s) => `/room/${s}`)],
    at: new Date().toISOString(),
  });
}
