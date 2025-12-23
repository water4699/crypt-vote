"use client";

import { useTheme } from "./theme-provider";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="fixed top-4 right-4 z-50 w-12 h-12 rounded-full bg-gradient-to-r from-orange-500 via-red-600 to-pink-600 border-2 border-orange-500/30 shadow-2xl hover:shadow-orange-500/50 transform hover:scale-110 transition-all duration-300 group"
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 to-orange-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300 rounded-full"></div>
      <div className="relative z-10 flex items-center justify-center">
        {theme === "dark" ? (
          <span className="text-2xl animate-pulse">🌙</span>
        ) : (
          <span className="text-2xl animate-spin">☀️</span>
        )}
      </div>

      {/* Tooltip */}
      <div className="absolute top-full mt-2 right-0 bg-black/80 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap border border-orange-500/30">
        Switch to {theme === "dark" ? "light" : "dark"} mode
      </div>
    </button>
  );
}
