import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // === AI / Primary accent = パープル ===
        brand: {
          50: "#faf5ff",
          100: "#f3e8ff",
          200: "#e9d5ff",
          300: "#d8b4fe",
          400: "#c084fc",
          500: "#a855f7",
          600: "#9333ea",
          700: "#7e22ce",
          800: "#6b21a8",
          900: "#581c87",
        },
        // === アクセント = ピンク (グラデ終端・AI強調) ===
        accent: {
          300: "#f9a8d4",
          400: "#f472b6",
          500: "#ec4899",
          600: "#db2777",
        },
        // === 情報 = ブルー (上長確認待ち等) ===
        info: {
          300: "#7dd3fc",
          400: "#38bdf8",
          500: "#0ea5e9",
          600: "#0284c7",
        },
        // === テキスト ===
        ink: {
          DEFAULT: "#F7F8FA",
          soft: "#B6BBC5",
          muted: "#858B98",
          faint: "#606673",
        },
        // === サーフェス (4段階) ===
        surface: {
          DEFAULT: "#12141A", // Primary Surface (カード)
          sunken: "#181B22", // Secondary Surface (入れ子・テーブルヘッダ)
          elevated: "#1D2028", // Elevated Surface (ドロワー・ポップ)
          input: "#20232B", // Input Background
          border: "#2D313C", // Default Border
        },
        // === 境界線 (3段階) ===
        line: {
          subtle: "#242731",
          DEFAULT: "#2D313C",
          strong: "#3A3F4C",
        },
        // === キャンバス地・サイドバー ===
        night: {
          DEFAULT: "#090A0D", // App Background
          soft: "#0D0E12", // Sidebar Background
          ring: "#2D313C",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "SF Pro Display",
          "SF Pro Text",
          "Helvetica Neue",
          "Segoe UI",
          "Noto Sans JP",
          "Hiragino Sans",
          "Hiragino Kaku Gothic ProN",
          "Meiryo",
          "sans-serif",
        ],
      },
      boxShadow: {
        // 控えめな標準シャドウ (Linear風)
        card: "0 1px 2px rgba(0,0,0,0.4)",
        pop: "0 12px 40px -12px rgba(0,0,0,0.7), 0 0 0 1px rgba(0,0,0,0.4)",
        // AIアクション限定の控えめなパープルグロー
        glow: "0 4px 20px -4px rgba(168,85,247,0.45)",
        "glow-sm": "0 2px 12px -2px rgba(168,85,247,0.4)",
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
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(168,85,247,0.55)" },
          "50%": { boxShadow: "0 0 0 8px rgba(168,85,247,0)" },
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
