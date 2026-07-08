import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { headers } from "next/headers";
import housesData from "@/data/houses.json";
import unitsData from "@/data/units.json";
import { getBrand } from "@/lib/brand";

export const alt = "Furnished rentals in Atlanta";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Branded link-preview card — brand-aware, so the homes domain previews the
// homes card and the rooms domain previews the rooms card.
export default async function OpengraphImage() {
  const brand = getBrand();
  const isHomes = brand.key === "homes";

  const copy = isHomes
    ? {
        letter: "H",
        word: "Homes",
        line1: "Furnished rentals in Atlanta.",
        line2: "Your own private space",
        sub: "Monthly lease · utilities included",
        chips: ["Fully furnished", "Utilities included", "A place that's all yours"],
        photoPath: (unitsData.units as Array<{ photos?: string[] }>).find((u) => u.photos && u.photos.length)
          ?.photos?.[0],
      }
    : {
        letter: "R",
        word: "Rooms",
        line1: "Furnished rooms in Atlanta.",
        line2: "Next Day Move In",
        sub: "All-in weekly pricing · utilities & WiFi included",
        chips: ["Fully furnished", "Utilities + WiFi included", "Stay as long as you need"],
        photoPath: (housesData.houses as Array<{ heroPhoto?: string }>).find((h) => h.heroPhoto)?.heroPhoto,
      };

  const fontsDir = join(process.cwd(), "app", "_fonts");
  const [interSemiBold, interExtraBold] = await Promise.all([
    readFile(join(fontsDir, "inter-600.woff")),
    readFile(join(fontsDir, "inter-800.woff")),
  ]);

  // Use a real listing photo as the background. photoPath may already be a
  // full URL (e.g. a PadSplit-hosted photo) or a same-site relative path (e.g.
  // /units/some-unit/photo.jpg) — only the latter needs the current host
  // prepended. Fully guarded (timeout + size cap) so it can NEVER break the
  // build — falls back to the brand gradient if the photo can't be embedded safely.
  let bg: string | null = null;
  if (copy.photoPath) {
    try {
      const isAbsolute = /^https?:\/\//i.test(copy.photoPath);
      const host = headers().get("host") ?? "";
      const abs = isAbsolute ? copy.photoPath : host ? `https://${host}${copy.photoPath}` : null;
      if (abs) {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 6000);
        const res = await fetch(abs, { signal: ctrl.signal });
        clearTimeout(timer);
        if (res.ok) {
          const buf = Buffer.from(await res.arrayBuffer());
          if (buf.byteLength > 0 && buf.byteLength <= 3_000_000) {
            bg = `data:image/jpeg;base64,${buf.toString("base64")}`;
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
            <div style={{ display: "flex", fontSize: "78px", fontWeight: 600, lineHeight: 1.05 }}>{copy.line1}</div>
            <div style={{ display: "flex", fontSize: "78px", fontWeight: 800, lineHeight: 1.05, color: "#FF6B35" }}>
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
      ...size,
      fonts: [
        { name: "Inter", data: interSemiBold, weight: 600, style: "normal" },
        { name: "Inter", data: interExtraBold, weight: 800, style: "normal" },
      ],
    }
  );
}
