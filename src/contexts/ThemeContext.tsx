"use client";

import { createContext, useContext, useCallback, useSyncExternalStore } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function getThemeSnapshot(): Theme {
  if (typeof window === "undefined") return "dark";
  return (localStorage.getItem("theme") as Theme) ||
    (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
}

function getServerSnapshot(): Theme {
  return "dark";
}

function subscribeToTheme(callback: () => void): () => void {
  const mediaQuery = window.matchMedia("(prefers-color-scheme: light)");
  const handler = () => callback();
  mediaQuery.addEventListener("change", handler);
  window.addEventListener("storage", handler);
  return () => {
    mediaQuery.removeEventListener("change", handler);
    window.removeEventListener("storage", handler);
  };
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(subscribeToTheme, getThemeSnapshot, getServerSnapshot);

  const toggleTheme = useCallback(() => {
    const newTheme = theme === "dark" ? "light" : "dark";
    localStorage.setItem("theme", newTheme);

    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(newTheme);

    // Trigger re-render by dispatching storage event
    window.dispatchEvent(new Event("storage"));
  }, [theme]);

  // Sync DOM with theme on mount
  if (typeof window !== "undefined") {
    const root = document.documentElement;
    if (!root.classList.contains(theme)) {
      root.classList.remove("light", "dark");
      root.classList.add(theme);
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    // Return default values for SSR/prerendering
    return { theme: "dark" as Theme, toggleTheme: () => {} };
  }
  return context;
}
