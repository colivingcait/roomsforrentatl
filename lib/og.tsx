import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { headers } from "next/headers";

export const ogSize = { width: 1200, height: 630 };
export const ogContentType = "image/png";

export interface OgCardCopy {
  letter: string; // "R" or "H"
  word: string; // "Rooms" or "Homes"
  line1: string;
  line2: string;
  sub: string;
  chips: string[];
  /** A photo URL (absolute) or a same-site relative path (e.g. /units/foo/bar.jpg). */
  photoPath?: string | null;
}

/**
 * Shared branded link-preview card, used by the site-wide OG image and every
 * individual listing's (house/unit) OG image. Fully guarded (timeout + size
 * cap) so a bad photo can NEVER break the build — falls back to the brand
 * gradient if the photo can't be embedded safely.
 */
export async function renderOgCard(copy: OgCardCopy): Promise<ImageResponse> {
  const fontsDir = join(process.cwd(), "app", "_fonts");
  const [interSemiBold, interExtraBold] = await Promise.all([
    readFile(join(fontsDir, "inter-600.woff")),
    readFile(join(fontsDir, "inter-800.woff")),
  ]);

  let bg: string | null = null;
  if (copy.photoPath) {
    try {
      const isAbsolute = /^https?:\/\//i.test(copy.photoPath);
      const host = headers().get("host") ?? "";
      const abs = isAbsolute ? copy.photoPath : host ? `https://${host}${copy.photoPath}` : null;
      if (abs) {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 6000);
        const res = await fetch(abs, { signal: ctrl.signal, cache: "no-store" });
        clearTimeout(timer);
        if (res.ok) {
          const buf = Buffer.from(await res.arrayBuffer());
          const mime = res.headers.get("content-type")?.split(";")[0]?.trim() || "image/jpeg";
          if (buf.byteLength > 0 && buf.byteLength <= 3_000_000 && mime.startsWith("image/")) {
            bg = `data:${mime};base64,${buf.toString("base64")}`;
          }
        }
      }
    } catch {
      bg = null;
    }
  }

  return new ImageResponse(
    (
      <div style={{ position: "relative", display: "flex", width: "100%", height: "100%", fontFamily: "Inter" }}>
        {bg && (
          <img
            src={bg}
            width={1200}
            height={630}
            style={{ position: "absolute", top: 0, left: 0, width: "1200px", height: "630px", objectFit: "cover" }}
          />
        )}

        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            display: "flex",
            width: "1200px",
            height: "630px",
            background: bg
              ? "linear-gradient(105deg, rgba(7,42,34,0.95) 0%, rgba(7,42,34,0.80) 48%, rgba(7,42,34,0.55) 100%)"
              : "linear-gradient(135deg, #0E7C66 0%, #0a5a49 100%)",
          }}
        />

        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            height: "100%",
            padding: "70px",
            color: "white",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "66px",
                height: "66px",
                borderRadius: "16px",
                background: "white",
                color: "#0E7C66",
                fontSize: "42px",
                fontWeight: 800,
              }}
            >
              {copy.letter}
            </div>
            <div style={{ display: "flex", fontSize: "36px", fontWeight: 800 }}>
              <span>{copy.word}</span>
              <span style={{ color: "#bff0e3" }}>For</span>
              <span>Rent</span>
              <span style={{ color: "#FF6B35" }}>ATL</span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: "70px", fontWeight: 600, lineHeight: 1.1 }}>{copy.line1}</div>
            <div style={{ display: "flex", fontSize: "78px", fontWeight: 800, lineHeight: 1.1, color: "#FF6B35" }}>
              {copy.line2}
            </div>
            <div style={{ display: "flex", fontSize: "30px", color: "rgba(255,255,255,0.88)", marginTop: "22px" }}>
              {copy.sub}
            </div>
          </div>

          <div style={{ display: "flex", gap: "16px" }}>
            {copy.chips.map((c) => (
              <div
                key={c}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  flexShrink: 0,
                  background: "rgba(255,255,255,0.18)",
                  borderRadius: "12px",
                  padding: "14px 24px",
                  fontSize: "26px",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                }}
              >
                <div style={{ display: "flex", width: "13px", height: "13px", borderRadius: "50%", background: "#FF6B35" }} />
                {c}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    {
      ...ogSize,
      fonts: [
        { name: "Inter", data: interSemiBold, weight: 600, style: "normal" },
        { name: "Inter", data: interExtraBold, weight: 800, style: "normal" },
      ],
    }
  );
}
