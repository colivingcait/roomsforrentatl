import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // PadSplit-style palette for a consistent hand-off to their apply flow.
        brand: {
          DEFAULT: "#2563EB", // primary blue
          dark: "#1D4ED8",
          light: "#3B82F6",
        },
        gold: {
          DEFAULT: "#F5B301", // secondary yellow
          dark: "#B8860B",
        },
        accent: {
          DEFAULT: "#E23744", // tertiary red — urgency / "New!"
          dark: "#C81E2C",
        },
        ink: "#0F172A",
        muted: "#64748B",
      },
      fontFamily: {
        sans: ["system-ui", "-apple-system", "Segoe UI", "Roboto", "Helvetica", "Arial", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px rgba(15,23,42,0.08), 0 8px 24px rgba(15,23,42,0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
