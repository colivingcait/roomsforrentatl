import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

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

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #0E7C66 0%, #0a5a49 100%)",
          color: "white",
          padding: "70px",
          fontFamily: "Inter",
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
          <div style={{ display: "flex", fontSize: "30px", color: "rgba(255,255,255,0.85)", marginTop: "22px" }}>
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
                background: "rgba(255,255,255,0.15)",
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
