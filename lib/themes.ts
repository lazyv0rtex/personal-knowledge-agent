export type Theme = {
  id: string;
  name: string;
  bg: string;
  panel: string;
  border: string;
  accent: string;
  text: string;
  textMuted: string;
  isDark: boolean;
};

export const THEMES: Theme[] = [
  {
    id: "midnight",
    name: "Midnight",
    bg: "#0b0d10",
    panel: "#111418",
    border: "#1f242b",
    accent: "#7c5cff",
    text: "#e6e8eb",
    textMuted: "#8b949e",
    isDark: true,
  },
  {
    id: "forest",
    name: "Forest",
    bg: "#0a0f0a",
    panel: "#0f1a0f",
    border: "#1a2e1a",
    accent: "#4ade80",
    text: "#d4e8d4",
    textMuted: "#6b8f6b",
    isDark: true,
  },
  {
    id: "ocean",
    name: "Ocean",
    bg: "#090d18",
    panel: "#0d1424",
    border: "#162038",
    accent: "#38bdf8",
    text: "#cfe8f5",
    textMuted: "#5b8fa8",
    isDark: true,
  },
  {
    id: "sunset",
    name: "Sunset",
    bg: "#120a0a",
    panel: "#1a0f0f",
    border: "#2e1a1a",
    accent: "#f97316",
    text: "#f0ddd8",
    textMuted: "#9a6060",
    isDark: true,
  },
  {
    id: "rose",
    name: "Rose",
    bg: "#120a10",
    panel: "#1a0f18",
    border: "#2e1a2a",
    accent: "#f472b6",
    text: "#f0d8ec",
    textMuted: "#9a6090",
    isDark: true,
  },
  {
    id: "light",
    name: "Light",
    bg: "#f8f9fa",
    panel: "#ffffff",
    border: "#e2e8f0",
    accent: "#7c5cff",
    text: "#1a202c",
    textMuted: "#718096",
    isDark: false,
  },
  {
    id: "solarized",
    name: "Solarized",
    bg: "#fdf6e3",
    panel: "#eee8d5",
    border: "#d3cbb8",
    accent: "#268bd2",
    text: "#073642",
    textMuted: "#657b83",
    isDark: false,
  },
];

export const DEFAULT_THEME_ID = "midnight";

export function getTheme(id: string): Theme {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}
