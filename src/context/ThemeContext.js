import React, { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

export const THEMES = [
  { id: "light", name: "Light White (Login Theme)", icon: "🤍", bg: "bg-white", border: "border-slate-300" },
  { id: "navy", name: "Classic Navy Blue", icon: "💙", bg: "bg-sky-950", border: "border-sky-500" },
  { id: "emerald", name: "Emerald Dark", icon: "💚", bg: "bg-emerald-950", border: "border-emerald-500" },
  { id: "amber", name: "Dark Gold", icon: "💛", bg: "bg-zinc-950", border: "border-amber-500" },
];

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    return localStorage.getItem("wolego_theme") || "navy";
  });

  const setTheme = (newTheme) => {
    setThemeState(newTheme);
    localStorage.setItem("wolego_theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
