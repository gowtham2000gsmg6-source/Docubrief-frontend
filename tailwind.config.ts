import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./hooks/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#17231f",
        muted: "#718078",
        canvas: "#f5f7f4",
        surface: "var(--surface)",
        line: "var(--line)",
        brand: {
          50: "#eaf5ef",
          100: "#d5ebde",
          500: "#32835c",
          600: "#276b49",
          700: "#1e5439",
        },
      },
      boxShadow: {
        card: "0 12px 40px rgba(23, 35, 31, .06)",
      },
    },
  },
  plugins: [],
};

export default config;
