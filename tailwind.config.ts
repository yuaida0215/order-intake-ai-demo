import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // AIエージェントの紫 (violet) — AI-native の主役カラー
        brand: {
          50: "#f5f3ff",
          100: "#ede9fe",
          200: "#ddd6fe",
          300: "#c4b5fd",
          400: "#a78bfa",
          500: "#8b5cf6",
          600: "#7c3aed",
          700: "#6d28d9",
          800: "#5b21b6",
          900: "#4c1d95",
        },
        ink: {
          DEFAULT: "#161226",
          soft: "#3d3654",
          muted: "#6f6a85",
          faint: "#a09bb5",
        },
        surface: {
          DEFAULT: "#ffffff",
          sunken: "#f8f7fc",
          border: "#eae7f4",
        },
        // ダークサイドバー用
        night: {
          DEFAULT: "#151022",
          soft: "#1e1731",
        },
      },
      fontFamily: {
        sans: [
          "var(--font-sans)",
          "-apple-system",
          "BlinkMacSystemFont",
          "Hiragino Kaku Gothic ProN",
          "Meiryo",
          "sans-serif",
        ],
      },
      boxShadow: {
        card: "0 1px 2px rgba(30,16,70,0.04), 0 4px 16px -8px rgba(88,52,180,0.08)",
        pop: "0 10px 30px rgba(30,16,70,0.12)",
        // AIアクション用のグロー
        glow: "0 0 0 1px rgba(124,58,237,0.18), 0 8px 24px -8px rgba(124,58,237,0.45)",
        "glow-sm": "0 0 0 1px rgba(124,58,237,0.14), 0 4px 14px -6px rgba(124,58,237,0.35)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        // グラデーションが流れる (AI稼働中の演出)
        sweep: {
          "0%": { backgroundPosition: "0% 50%" },
          "100%": { backgroundPosition: "200% 50%" },
        },
        // グローが脈打つ (エージェントの鼓動)
        "glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(139,92,246,0.45)" },
          "50%": { boxShadow: "0 0 0 8px rgba(139,92,246,0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.35s ease-out",
        "pulse-soft": "pulse-soft 1.2s ease-in-out infinite",
        sweep: "sweep 2.6s linear infinite",
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
