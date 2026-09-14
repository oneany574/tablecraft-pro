import { useEffect, useState } from "react";

export type ThemeMode = "light" | "dark" | "system";

const THEME_KEY = "notion-clone-theme";

function applyTheme(mode: ThemeMode) {
  const dark =
    mode === "dark" ||
    (mode === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.style.colorScheme = dark ? "dark" : "light";
}

export function useThemeMode() {
  const [mode, setModeState] = useState<ThemeMode>("system");

  useEffect(() => {
    const saved = window.localStorage.getItem(THEME_KEY);
    const initial = saved === "light" || saved === "dark" ? saved : "system";
    setModeState(initial);
    applyTheme(initial);
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const sync = () => applyTheme(mode);
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, [mode]);

  const setMode = (next: ThemeMode) => {
    setModeState(next);
    window.localStorage.setItem(THEME_KEY, next);
    applyTheme(next);
  };

  return { mode, setMode };
}