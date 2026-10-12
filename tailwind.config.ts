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
        ink: "var(--foreground)",
        muted: "var(--muted)",
        canvas: "var(--canvas)",
        surface: "var(--surface)",
        line: "var(--line)",
        secondary: "var(--secondary)",
        brand: {
          50: "var(--brand-50)",
          100: "var(--brand-100)",
          500: "var(--brand)",
          600: "var(--brand-strong)",
          700: "var(--brand-deep)",
        },
      },
      boxShadow: {
        card: "var(--shadow-glass)",
        raised: "var(--shadow-raised)",
        "raised-hover": "var(--shadow-raised-hover)",
        pressed: "var(--shadow-pressed)",
        input: "var(--shadow-input)",
        focus: "var(--shadow-focus)",
        glow: "var(--shadow-glow)",
      },
      backdropBlur: {
        glass: "var(--glass-blur)",
        "glass-sm": "12px",
        "glass-lg": "22px",
      },
      borderRadius: {
        xs: "var(--radius-xs)",
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        icon: "var(--radius-icon)",
        drop: "var(--radius-drop)",
        badge: "var(--radius-badge)",
        circle: "var(--radius-circle)",
        control: "var(--radius-control)",
        card: "var(--radius-card)",
        panel: "var(--radius-panel)",
      },
      backgroundImage: {
        mesh: "var(--body-background)",
      },
    },
  },
  plugins: [],
};

export default config;
