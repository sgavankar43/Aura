/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["JetBrains Mono", "Fira Code", "Consolas", "monospace"],
        mono: ["JetBrains Mono", "Fira Code", "Consolas", "monospace"],
        heading: ["Orbitron", "Share Tech Mono", "monospace"],
      },
      colors: {
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        success: {
          DEFAULT: "var(--success)",
          foreground: "var(--success-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
          secondary: "var(--accentSecondary)",
          tertiary: "var(--accentTertiary)"
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
      },
      boxShadow: {
        neon: "var(--box-shadow-neon)",
        "neon-sm": "var(--box-shadow-neon-sm)",
        "neon-lg": "var(--box-shadow-neon-lg)",
        "neon-secondary": "var(--box-shadow-neon-secondary)",
        "neon-tertiary": "var(--box-shadow-neon-tertiary)",
      },
      dropShadow: {
        glitch: "0 0 10px rgba(0, 255, 136, 0.5)",
        glow: "0 0 20px rgba(0, 255, 136, 0.3)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
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
        blink: {
          "50%": { opacity: "0" },
        },
        glitch: {
          "0%, 100%": { transform: "translate(0)" },
          "20%": { transform: "translate(-2px, 2px)" },
          "40%": { transform: "translate(2px, -2px)" },
          "60%": { transform: "translate(-1px, -1px)" },
          "80%": { transform: "translate(1px, 1px)" },
        },
        "rgb-shift": {
          "0%, 100%": { textShadow: "-2px 0 #ff00ff, 2px 0 #00d4ff" },
          "50%": { textShadow: "2px 0 #ff00ff, -2px 0 #00d4ff" },
        },
        scanline: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" },
        }
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "blink": "blink 1s step-end infinite",
        "glitch": "glitch 2s linear infinite",
        "rgb-shift": "rgb-shift 3s infinite",
        "scanline": "scanline 10s linear infinite",
      },
    },
  },
  plugins: [],
}
