import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        serif: ["Fraunces", "Georgia", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          glow: "hsl(var(--primary-glow))",
          deep: "hsl(var(--primary-deep))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        plum: {
          DEFAULT: "hsl(var(--plum))",
          foreground: "hsl(var(--plum-foreground))",
        },
        sage: "hsl(var(--sage))",
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
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
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 4px)",
        sm: "calc(var(--radius) - 8px)",
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(30px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "float-slow": {
          "0%,100%": { transform: "translateY(0) rotate(0)" },
          "50%": { transform: "translateY(-18px) rotate(2deg)" },
        },
        "float-mid": {
          "0%,100%": { transform: "translateY(0) rotate(-2deg)" },
          "50%": { transform: "translateY(-10px) rotate(3deg)" },
        },
        "float-tiny": {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        "spin-slow": { to: { transform: "rotate(360deg)" } },
        blob: {
          "0%,100%": { borderRadius: "42% 58% 63% 37% / 41% 44% 56% 59%" },
          "50%": { borderRadius: "60% 40% 35% 65% / 55% 65% 35% 45%" },
        },
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
        "slide-in-right": {
          "0%": { opacity: "0", transform: "translateX(40px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "slide-in-left": {
          "0%": { opacity: "0", transform: "translateX(-40px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "pop-in": {
          "0%": { opacity: "0", transform: "scale(0.9)" },
          "60%": { transform: "scale(1.04)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "heart-beat": {
          "0%,100%": { transform: "scale(1)" },
          "25%": { transform: "scale(1.18)" },
          "50%": { transform: "scale(0.95)" },
          "75%": { transform: "scale(1.1)" },
        },
        wink: {
          "0%,80%,100%": { transform: "scaleY(1)" },
          "85%,95%": { transform: "scaleY(0.1)" },
        },
        "heart-burst": {
          "0%": { transform: "scale(1)", opacity: "1" },
          "60%": { transform: "scale(2.2)", opacity: "0.6" },
          "100%": { transform: "scale(3)", opacity: "0" },
        },
        "rise-fade": {
          "0%": { transform: "translateY(0) scale(0.5)", opacity: "0" },
          "20%": { opacity: "1" },
          "100%": { transform: "translateY(-220px) scale(1.3)", opacity: "0" },
        },
        "match-pop": {
          "0%": { transform: "scale(0.4) rotate(-12deg)", opacity: "0" },
          "60%": { transform: "scale(1.15) rotate(4deg)", opacity: "1" },
          "100%": { transform: "scale(1) rotate(0)", opacity: "1" },
        },
        "ring-ping": {
          "0%": { transform: "scale(0.8)", opacity: "0.7" },
          "100%": { transform: "scale(2.4)", opacity: "0" },
        },
        "confetti-fall": {
          "0%": { transform: "translateY(-20px) rotate(0)", opacity: "1" },
          "100%": {
            transform: "translateY(420px) rotate(720deg)",
            opacity: "0",
          },
        },
      },
      animation: {
        "slide-in-right": "slide-in-right 0.45s var(--transition-smooth) both",
        "slide-in-left": "slide-in-left 0.45s var(--transition-smooth) both",
        "pop-in": "pop-in 0.5s var(--transition-smooth) both",
        shimmer: "shimmer 2.5s linear infinite",
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.6s var(--transition-smooth) both",
        "fade-in-up": "fade-in-up 0.8s var(--transition-smooth) both",
        "scale-in": "scale-in 0.6s var(--transition-smooth) both",
        "float-slow": "float-slow 7s ease-in-out infinite",
        "float-mid": "float-mid 5s ease-in-out infinite",
        "float-tiny": "float-tiny 3s ease-in-out infinite",
        "spin-slow": "spin-slow 22s linear infinite",
        blob: "blob 14s ease-in-out infinite",
        "heart-beat": "heart-beat 0.9s ease-in-out infinite",
        wink: "wink 1.6s ease-in-out infinite",
        "heart-burst": "heart-burst 0.8s ease-out forwards",
        "rise-fade": "rise-fade 1.6s ease-out forwards",
        "match-pop": "match-pop 0.7s var(--transition-smooth) both",
        "ring-ping": "ring-ping 1.4s ease-out infinite",
        "confetti-fall": "confetti-fall 2.4s ease-in forwards",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
