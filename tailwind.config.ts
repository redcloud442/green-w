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
      },
      keyframes: {
        "stroke-dash": {
          "0%": { "stroke-dasharray": "1, 200", "stroke-dashoffset": "0" },
          "50%": { "stroke-dasharray": "89, 200", "stroke-dashoffset": "-35" },
          "100%": {
            "stroke-dasharray": "89, 200",
            "stroke-dashoffset": "-124",
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
