"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { THEMES, Theme, DEFAULT_THEME_ID, getTheme } from "@/lib/themes";

type ThemeCtx = {
  theme: Theme;
  setThemeId: (id: string) => void;
};

const Ctx = createContext<ThemeCtx>({
  theme: getTheme(DEFAULT_THEME_ID),
  setThemeId: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeId, setThemeIdState] = useState(DEFAULT_THEME_ID);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved) setThemeIdState(saved);
  }, []);

  const theme = getTheme(themeId);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--bg", theme.bg);
    root.style.setProperty("--panel", theme.panel);
    root.style.setProperty("--border", theme.border);
    root.style.setProperty("--accent", theme.accent);
    root.style.setProperty("--text", theme.text);
    root.style.setProperty("--text-muted", theme.textMuted);
    root.style.setProperty("color-scheme", theme.isDark ? "dark" : "light");
    document.body.style.background = theme.bg;
    document.body.style.color = theme.text;
  }, [theme]);

  function setThemeId(id: string) {
    setThemeIdState(id);
    localStorage.setItem("theme", id);
  }

  return <Ctx.Provider value={{ theme, setThemeId }}>{children}</Ctx.Provider>;
}

export function useTheme() {
  return useContext(Ctx);
}
