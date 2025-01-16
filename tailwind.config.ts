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
        slideIn: "slideIn 1s ease-in-out",
        spinInfinity: "spinInfinity 1.5s linear infinite",
      },
      keyframes: {
        anim: {
          "12.5%": {
            "stroke-dasharray": "33.98873px, 242.77666px",
            "stroke-dashoffset": "-26.70543px",
          },
          "43.75%": {
            "stroke-dasharray": "84.97183px, 242.77666px",
            "stroke-dashoffset": "-84.97183px",
          },
          "100%": {
            "stroke-dasharray": "2.42777px, 242.77666px",
            "stroke-dashoffset": "-240.34889px",
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
