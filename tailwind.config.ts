import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F7F5F2",
        ink: "#241F2E",
        plum: {
          50: "#F1EDF7",
          100: "#E1D7EF",
          300: "#B79FDD",
          500: "#7A5AB8",
          700: "#56398C",
          900: "#2E1B57",
        },
        gold: {
          400: "#E8B84B",
          500: "#D9A22E",
          600: "#B8841F",
        },
        alert: "#B5442E",
      },
      fontFamily: {
        display: ["'Fraunces'", "serif"],
        body: ["'Inter'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      borderRadius: {
        card: "8px",
      },
    },
  },
  plugins: [],
};
export default config;
