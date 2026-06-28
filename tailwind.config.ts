import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#0E7C66", // Atlanta teal-green — fresh, trustworthy
          dark: "#0A5C4C",
          light: "#13A083",
        },
        accent: {
          DEFAULT: "#FF6B35", // warm orange — "book now" urgency
          dark: "#E2551F",
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
