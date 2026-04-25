import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0b0d10",
        panel: "#111418",
        border: "#1f242b",
        accent: "#7c5cff",
      },
    },
  },
  plugins: [],
};
export default config;
