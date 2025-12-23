"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Theme = "dark" | "light";

export interface ColorTheme {
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  glass: string;
}

export interface FontTheme {
  name: string;
  value: string;
  class: string;
}

export interface LayoutTheme {
  name: string;
  value: string;
  icon: string;
}

interface ThemeContextType {
  theme: Theme;
  colorTheme: ColorTheme | null;
  fontTheme: FontTheme | null;
  layoutTheme: LayoutTheme | null;
  toggleTheme: () => void;
  setColorTheme: (colorTheme: ColorTheme) => void;
  setFontTheme: (fontTheme: FontTheme) => void;
  setLayoutTheme: (layoutTheme: LayoutTheme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const defaultColorTheme: ColorTheme = {
  name: "Cyber Punk",
  primary: "#ff6b35",
  secondary: "#f7931e",
  accent: "#ff0080",
  background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)",
  glass: "rgba(255, 255, 255, 0.05)",
};

const defaultFontTheme: FontTheme = {
  name: "Inter",
  value: "font-inter",
  class: "font-sans",
};

const defaultLayoutTheme: LayoutTheme = {
  name: "Card Grid",
  value: "grid",
  icon: "⊞",
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark"); // Default to dark theme
  const [colorTheme, setColorThemeState] = useState<ColorTheme | null>(null);
  const [fontTheme, setFontThemeState] = useState<FontTheme | null>(null);
  const [layoutTheme, setLayoutThemeState] = useState<LayoutTheme | null>(null);

  useEffect(() => {
    // Load theme from localStorage
    const savedTheme = localStorage.getItem("crypto-vote-theme") as Theme;
    if (savedTheme) {
      setTheme(savedTheme);
    }

    // Load color theme from localStorage
    const savedColorTheme = localStorage.getItem("crypto-vote-color-theme");
    if (savedColorTheme) {
      try {
        setColorThemeState(JSON.parse(savedColorTheme));
      } catch (e) {
        console.error("Failed to parse saved color theme", e);
        setColorThemeState(defaultColorTheme);
      }
    } else {
      // Set default color theme
      setColorThemeState(defaultColorTheme);
    }

    // Load font theme from localStorage
    const savedFontTheme = localStorage.getItem("crypto-vote-font-theme");
    if (savedFontTheme) {
      try {
        setFontThemeState(JSON.parse(savedFontTheme));
      } catch (e) {
        console.error("Failed to parse saved font theme", e);
        setFontThemeState(defaultFontTheme);
      }
    } else {
      setFontThemeState(defaultFontTheme);
    }

    // Load layout theme from localStorage
    const savedLayoutTheme = localStorage.getItem("crypto-vote-layout-theme");
    if (savedLayoutTheme) {
      try {
        setLayoutThemeState(JSON.parse(savedLayoutTheme));
      } catch (e) {
        console.error("Failed to parse saved layout theme", e);
        setLayoutThemeState(defaultLayoutTheme);
      }
    } else {
      setLayoutThemeState(defaultLayoutTheme);
    }
  }, []);

  useEffect(() => {
    // Apply theme to document
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    // Save to localStorage
    localStorage.setItem("crypto-vote-theme", theme);
  }, [theme]);

  useEffect(() => {
    // Apply color theme to CSS variables
    if (colorTheme) {
      const root = document.documentElement;
      root.style.setProperty("--theme-primary", colorTheme.primary);
      root.style.setProperty("--theme-secondary", colorTheme.secondary);
      root.style.setProperty("--theme-accent", colorTheme.accent);
      root.style.setProperty("--theme-background", colorTheme.background);
      root.style.setProperty("--theme-glass", colorTheme.glass);

      // Apply background to body
      document.body.style.background = colorTheme.background;
      document.body.style.backgroundAttachment = "fixed";

      // Save to localStorage
      localStorage.setItem("crypto-vote-color-theme", JSON.stringify(colorTheme));
    }
  }, [colorTheme]);

  useEffect(() => {
    // Apply font theme
    if (fontTheme) {
      const root = document.documentElement;
      // Remove previous font classes
      root.classList.remove("font-sans", "font-mono", "font-serif", "font-system");
      // Add new font class
      root.classList.add(fontTheme.class);
      
      // Save to localStorage
      localStorage.setItem("crypto-vote-font-theme", JSON.stringify(fontTheme));
    }
  }, [fontTheme]);

  useEffect(() => {
    // Apply layout theme
    if (layoutTheme) {
      const root = document.documentElement;
      // Remove previous layout classes
      root.classList.remove("layout-grid", "layout-list", "layout-compact");
      // Add new layout class
      root.classList.add(`layout-${layoutTheme.value}`);
      
      // Save to localStorage
      localStorage.setItem("crypto-vote-layout-theme", JSON.stringify(layoutTheme));
    }
  }, [layoutTheme]);

  const toggleTheme = () => {
    setTheme(prev => prev === "dark" ? "light" : "dark");
  };

  const setColorTheme = (newColorTheme: ColorTheme) => {
    setColorThemeState(newColorTheme);
  };

  const setFontTheme = (newFontTheme: FontTheme) => {
    setFontThemeState(newFontTheme);
  };

  const setLayoutTheme = (newLayoutTheme: LayoutTheme) => {
    setLayoutThemeState(newLayoutTheme);
  };

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      colorTheme, 
      fontTheme, 
      layoutTheme,
      toggleTheme, 
      setColorTheme,
      setFontTheme,
      setLayoutTheme,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
