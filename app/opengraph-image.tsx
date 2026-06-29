import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import housesData from "@/data/houses.json";

export const alt = "RoomsForRentATL — Furnished rooms for rent in Atlanta, move in today";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Branded link-preview card shown when roomsforrentatl.com is shared.
export default async function OpengraphImage() {
  const chips = ["Fully furnished", "Utilities + WiFi included", "Flexible weekly lease"];

  const fontsDir = join(process.cwd(), "app", "_fonts");
  const [interSemiBold, interExtraBold] = await Promise.all([
    readFile(join(fontsDir, "inter-600.woff")),
    readFile(join(fontsDir, "inter-800.woff")),
  ]);

  // Use a real listing photo as the background. Bounded by a timeout and a
  // size cap, and fully guarded, so it can NEVER break the build — it simply
  // falls back to the brand gradient if the photo can't be embedded safely.
  let bg: string | null = null;
  const photoUrl = (housesData.houses as Array<{ heroPhoto?: string }>).find((h) => h.heroPhoto)?.heroPhoto;
  if (photoUrl) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 6000);
      const res = await fetch(photoUrl, { signal: ctrl.signal });
      clearTimeout(timer);
      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer());
        if (buf.byteLength > 0 && buf.byteLength <= 3_000_000) {
          bg = `data:image/jpeg;base64,${buf.toString("base64")}`;
        }
      }
    } catch {
      bg = null;
    }
  }

  return new ImageResponse(
    (
      <div style={{ position: "relative", display: "flex", width: "100%", height: "100%", fontFamily: "Inter" }}>
        {/* Background photo (if available) */}
        {bg && (
          <img
            src={bg}
            width={1200}
            height={630}
            style={{ position: "absolute", top: 0, left: 0, width: "1200px", height: "630px", objectFit: "cover" }}
          />
        )}

        {/* Scrim for text legibility (or the full brand gradient as fallback) */}
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

        {/* Content */}
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
          {/* Wordmark */}
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
              R
            </div>
            <div style={{ display: "flex", fontSize: "36px", fontWeight: 800 }}>
              <span>Rooms</span>
              <span style={{ color: "#bff0e3" }}>For</span>
              <span>Rent</span>
              <span style={{ color: "#FF6B35" }}>ATL</span>
            </div>
          </div>

          {/* Headline */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: "78px", fontWeight: 600, lineHeight: 1.05 }}>
              Furnished rooms in Atlanta.
            </div>
            <div style={{ display: "flex", fontSize: "78px", fontWeight: 800, lineHeight: 1.05, color: "#FF6B35" }}>
              Next Day Move In
            </div>
            <div style={{ display: "flex", fontSize: "30px", color: "rgba(255,255,255,0.88)", marginTop: "22px" }}>
              All-in weekly pricing · utilities &amp; WiFi included
            </div>
          </div>

          {/* Feature chips */}
          <div style={{ display: "flex", gap: "16px" }}>
            {chips.map((c) => (
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
