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
        "lila-bg":      "#0a0b0f",
        "lila-surface": "#12141a",
        "lila-border":  "#1e2130",
        "lila-accent":  "#00d4ff",
        "lila-human":   "#22d3ee",
        "lila-bot":     "#6b7280",
        "lila-kill":    "#ef4444",
        "lila-death":   "#f97316",
        "lila-storm":   "#3b82f6",
        "lila-loot":    "#eab308",
      },
      fontFamily: {
        mono: ["'JetBrains Mono'", "'Fira Code'", "Consolas", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
