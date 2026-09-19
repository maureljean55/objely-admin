import type { Config } from "tailwindcss";

// Design tokens ported from the "Objely Admin Precision" design system
// (see the original mockups in objely/stitch_objely_admin_portal/objely_admin_precision/DESIGN.md).
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        "surface-bg": "#F6F8FC",
        "surface-card": "#FFFFFF",
        "border-subtle": "#E2E8F0",
        "on-surface": "#1C1B1F",
        "on-surface-variant": "#414753",
        muted: "#64748B",
        primary: "#087BEA",
        "primary-hover": "#0666C5",
        "primary-container": "#E8F2FE",
        "on-primary-container": "#0666C5",
        navy: "#102653",
        tertiary: "#8D6CF3",
        "tertiary-container": "#F1ECFE",
        "sky-blue": "#4FA8FF",
        "success-emerald": "#10B981",
        "success-container": "#ECFDF5",
        "warning-amber": "#F59E0B",
        "warning-container": "#FFFBEB",
        "danger-crimson": "#EF4444",
        "danger-container": "#FEF2F2",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "-apple-system", "sans-serif"],
      },
      fontSize: {
        "display-lg": ["32px", { lineHeight: "40px", letterSpacing: "-0.02em", fontWeight: "600" }],
        "headline-md": ["24px", { lineHeight: "32px", letterSpacing: "-0.015em", fontWeight: "600" }],
        "headline-sm": ["20px", { lineHeight: "28px", letterSpacing: "-0.01em", fontWeight: "600" }],
        "title-md": ["16px", { lineHeight: "24px", letterSpacing: "-0.005em", fontWeight: "600" }],
        "body-lg": ["15px", { lineHeight: "22px", fontWeight: "400" }],
        "body-md": ["14px", { lineHeight: "20px", fontWeight: "400" }],
        "body-sm": ["13px", { lineHeight: "18px", fontWeight: "400" }],
        "label-md": ["13px", { lineHeight: "18px", fontWeight: "500" }],
        "label-sm": ["11px", { lineHeight: "16px", letterSpacing: "0.04em", fontWeight: "600" }],
        "metric-number": ["28px", { lineHeight: "32px", letterSpacing: "-0.02em", fontWeight: "600" }],
      },
      borderRadius: {
        sm: "0.25rem",
        DEFAULT: "0.375rem",
        lg: "0.5rem",
        xl: "0.75rem",
      },
      boxShadow: {
        card: "0 1px 2px 0 rgba(16, 38, 83, 0.03)",
        elevated: "0 4px 16px -2px rgba(16, 38, 83, 0.08), 0 2px 4px -1px rgba(16, 38, 83, 0.04)",
        modal: "0 20px 25px -5px rgba(16, 38, 83, 0.12), 0 8px 10px -6px rgba(16, 38, 83, 0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
