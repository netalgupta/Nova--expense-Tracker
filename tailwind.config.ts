import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                "bg-primary": "#0A0E1A",
                "bg-secondary": "#0F1629",
                "accent-violet": "#7C3AED",
                "accent-coral": "#FF6B6B",
                "accent-cyan": "#06B6D4",
                "text-primary": "#F8FAFC",
                "text-secondary": "#94A3B8",
                success: "#10B981",
                warning: "#F59E0B",
            },
            fontFamily: {
                sans: ["Inter", "sans-serif"],
            },
            backgroundImage: {
                "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
                "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
            },
            boxShadow: {
                "violet-glow": "0 0 30px rgba(124, 58, 237, 0.4)",
                "coral-glow": "0 0 30px rgba(255, 107, 107, 0.4)",
                "cyan-glow": "0 0 30px rgba(6, 182, 212, 0.4)",
            },
            animation: {
                shimmer: "shimmer 2s linear infinite",
                "float-slow": "float 6s ease-in-out infinite",
                "pulse-glow": "pulseGlow 2s ease-in-out infinite",
                "count-up": "countUp 1.2s ease-out forwards",
                blob: "blob 7s infinite",
            },
            keyframes: {
                shimmer: {
                    "0%": { backgroundPosition: "-200% 0" },
                    "100%": { backgroundPosition: "200% 0" },
                },
                float: {
                    "0%, 100%": { transform: "translateY(0px)" },
                    "50%": { transform: "translateY(-20px)" },
                },
                pulseGlow: {
                    "0%, 100%": { boxShadow: "0 0 20px rgba(124, 58, 237, 0.4)" },
                    "50%": { boxShadow: "0 0 40px rgba(124, 58, 237, 0.8)" },
                },
                blob: {
                    "0%": { transform: "translate(0px, 0px) scale(1)" },
                    "33%": { transform: "translate(30px, -50px) scale(1.1)" },
                    "66%": { transform: "translate(-20px, 20px) scale(0.9)" },
                    "100%": { transform: "translate(0px, 0px) scale(1)" },
                },
            },
        },
    },
    plugins: [],
};

export default config;
