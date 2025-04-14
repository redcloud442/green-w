import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        airstrike: ["Airstrike", "sans-serif"],
        ethnocentric: ["Bankrus", "sans-serif"],
      },
      backgroundImage: {
        "custom-radial":
          "radial-gradient(circle, rgba(255, 255, 255, 0.2) 0%, rgba(0, 123, 181, 0.8) 30%, rgba(0, 0, 0, 1) 100%)",
      },
      colors: {
        pageColor: "#1E1E1E",
        cardColor: "#bae6fd",
        inputColor: "#1E1E1E",
        primaryRed: "#A30000",
        primaryYellow: "#F6DB4E",
        background: "var(--background)",
        foreground: "var(--foreground)",
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      animation: {
        "stroke-anim": "stroke-dash 1.6s linear infinite",
        wiggle: "wiggle 0.5s ease-in-out infinite",
        "circle-glow": "circle-glow 2s linear infinite",
        "spin-slow": "spin 5s linear infinite",
        "tracing-border": "tracing-border 2s ease-in-out infinite",
      },
      keyframes: {
        wiggle: {
          "0%, 100%": { transform: "rotate(-5deg)" },
          "50%": { transform: "rotate(5deg)" },
        },
        "stroke-dash": {
          "0%": { "stroke-dasharray": "1, 200", "stroke-dashoffset": "0" },
          "50%": { "stroke-dasharray": "89, 200", "stroke-dashoffset": "-35" },
          "100%": {
            "stroke-dasharray": "89, 200",
            "stroke-dashoffset": "-124",
          },
        },
        "circle-glow": {
          "0%": {
            transform: "rotate(0deg)",
            boxShadow: "0 0 10px 2px rgba(234, 179, 8, 0.7)",
            clipPath: "polygon(50% 50%, 0% 0%, 0% 0%)",
          },
          "100%": {
            transform: "rotate(360deg)",
            boxShadow: "0 0 20px 5px rgba(234, 179, 8, 0.3)",
            clipPath: "polygon(50% 50%, 0% 0%, 100% 0%)",
          },
        },
      },
      width: {
        xs: "1rem",
        sm: "1.5rem",
        md: "2rem",
        lg: "3rem",
      },
      height: {
        xs: "1rem",
        sm: "1.5rem",
        md: "2rem",
        lg: "3rem",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
