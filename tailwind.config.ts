import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#E8521A",
          50: "#FDE8E0",
          100: "#FBCFBF",
          200: "#F7A080",
          300: "#F37A4D",
          400: "#ED5B26",
          500: "#E8521A",
          600: "#C94412",
          700: "#A3370E",
          800: "#7D2A0B",
          900: "#571D07",
        },
        secondary: {
          DEFAULT: "#F5A623",
          50: "#FEF2D6",
          100: "#FDE9B8",
          200: "#FBD77A",
          300: "#F9C64B",
          400: "#F7B532",
          500: "#F5A623",
          600: "#D48D14",
          700: "#A36E0F",
          800: "#734E0B",
          900: "#4A3207",
        },
        brand: {
          light: "#FDF8F3",
          dark: "#1A1A1A",
        },
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        serif: ["Playfair Display", "Georgia", "serif"],
      },
      boxShadow: {
        card: "0 2px 8px rgba(0, 0, 0, 0.08)",
        "card-hover": "0 8px 30px rgba(0, 0, 0, 0.12)",
        warm: "0 4px 14px rgba(232, 82, 26, 0.15)",
      },
      borderRadius: {
        card: "0.75rem",
        "card-lg": "1rem",
      },
      keyframes: {
        "card-lift": {
          "0%": { transform: "translateY(0)" },
          "100%": { transform: "translateY(-4px)" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "card-lift": "card-lift 0.2s ease-out forwards",
        "fade-in": "fade-in 0.3s ease-out forwards",
      },
    },
  },
  plugins: [],
};
export default config;
