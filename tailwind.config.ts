import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-syne)", "system-ui", "sans-serif"],
      },
      colors: {
        civitapp: {
          charcoal: "#0F172A",
          "charcoal-light": "#1E293B",
          blue: "#1E3A8A",
          "blue-light": "#3B82F6",
          "blue-lighter": "#60A5FA",
          sky: "#93C5FD",
          "sky-pale": "#BFDBFE",
          bg: "#F1F5F9",
          accent: "#3B82F6",
          "accent-light": "#60A5FA",
          "accent-dark": "#2563EB",
          /* Dark mode — superficies */
          surface: {
            DEFAULT: "var(--surface)",
            hover: "var(--surface-hover)",
          },
        },
      },
      borderRadius: {
        card: "var(--card-radius)",
      },
      boxShadow: {
        card: "var(--card-shadow)",
        "card-hover": "0 4px 12px -2px rgb(0 0 0 / 0.08), 0 2px 6px -2px rgb(0 0 0 / 0.04)",
      },
      backgroundColor: {
        surface: "var(--surface)",
        "surface-hover": "var(--surface-hover)",
      },
    },
  },
  plugins: [],
};

export default config;
