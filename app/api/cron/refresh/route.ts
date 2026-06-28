import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getAllHouseIds } from "@/lib/houses";

export const dynamic = "force-dynamic";

/**
 * On-demand revalidation endpoint. The daily scraper commits fresh availability
 * (which redeploys on Vercel), but this lets you force the homepage and house
 * pages to re-render immediately. Protected by CRON_SECRET.
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
  for (const id of getAllHouseIds()) {
    revalidatePath(`/house/${id}`);
  }

  return NextResponse.json({
    ok: true,
    revalidated: ["/", ...getAllHouseIds().map((id) => `/house/${id}`)],
    at: new Date().toISOString(),
  });
}
