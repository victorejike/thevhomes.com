import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        teal: {
          50: "#e6f5f4",
          100: "#c0e6e3",
          200: "#96d6d1",
          300: "#6bc5bf",
          400: "#45b6ae",
          500: "#0b8a85",
          600: "#0a7975",
          700: "#086561",
          800: "#06504d",
          900: "#05403d",
        },
        charcoal: {
          50: "#f5f5f6",
          100: "#e4e4e6",
          200: "#c7c7cc",
          300: "#a2a2aa",
          400: "#7c7c86",
          500: "#5f5f6a",
          600: "#4a4a54",
          700: "#3a3a42",
          800: "#232328",
          900: "#121215",
          950: "#08080a",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "teal-gradient": "linear-gradient(135deg, #45b6ae 0%, #0b8a85 50%, #06504d 100%)",
      },
      boxShadow: {
        glow: "0 0 40px rgba(11, 138, 133, 0.35)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.8s ease-out forwards",
      },
    },
  },
  plugins: [],
};

export default config;
