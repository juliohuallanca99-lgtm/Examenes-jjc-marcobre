import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: { 950: "#0A1930", 900: "#0F2138", 800: "#16304F", 700: "#1E3E63", 600: "#2C5583" },
        gold: { 500: "#C9932E", 600: "#B07E22", 100: "#F6E9D2" },
        ink: "#1C2430",
        paper: "#F7F7F5",
        line: "#E4E2DC",
      },
      fontFamily: {
        display: ["var(--font-manrope)", "sans-serif"],
        body: ["var(--font-inter)", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
