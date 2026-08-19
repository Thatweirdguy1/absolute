import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      screens: {
        xs: "375px",
      },
      colors: {
        ink: {
          950: "#0a0a0f",
          900: "#12121a",
          800: "#1a1a27",
          700: "#252536",
          600: "#363649",
        },
        purple: {
          300: "#c084fc",
          400: "#a855f7",
          500: "#9333ea",
          600: "#7e22ce",
        },
        smoke: {
          100: "#f0ece4",
          200: "#d4cfc4",
          300: "#a8a295",
          400: "#7a756b",
        },
        rating: {
          star: "#fbbf24",
          half: "#f59e0b",
        },
        state: {
          success: "#22c55e",
          warning: "#eab308",
          error: "#ef4444",
          info: "#3b82f6",
        }
      },
      fontFamily: {
        display: ["var(--font-bebas-neue)", "Bebas Neue", "sans-serif"],
        body: ["var(--font-inter)", "Inter", "sans-serif"],
      },
      transitionDuration: {
        fast: "160ms",
        medium: "240ms",
        slow: "350ms",
        cinematic: "650ms",
      },
    },
  },
  plugins: [],
};
export default config;
