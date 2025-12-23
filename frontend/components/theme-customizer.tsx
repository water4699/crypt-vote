"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "./theme-provider";

const predefinedThemes = [
  {
    name: "Cyber Punk",
    primary: "#ff6b35",
    secondary: "#f7931e",
    accent: "#ff0080",
    background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)",
    glass: "rgba(255, 255, 255, 0.05)",
  },
  {
    name: "Ocean Deep",
    primary: "#00d4ff",
    secondary: "#0099cc",
    accent: "#00ff88",
    background: "linear-gradient(135deg, #0c0c0c 0%, #1e3a5f 50%, #2c5aa0 100%)",
    glass: "rgba(0, 212, 255, 0.05)",
  },
  {
    name: "Sunset Glow",
    primary: "#ff7b54",
    secondary: "#ffb26b",
    accent: "#ffd56b",
    background: "linear-gradient(135deg, #1a1a1a 0%, #2d1b69 50%, #ff6b35 100%)",
    glass: "rgba(255, 123, 84, 0.05)",
  },
  {
    name: "Forest Dark",
    primary: "#4ade80",
    secondary: "#22c55e",
    accent: "#16a34a",
    background: "linear-gradient(135deg, #0f0f0f 0%, #1f2937 50%, #111827 100%)",
    glass: "rgba(74, 222, 128, 0.05)",
  },
];

const fonts = [
  { name: "Inter", value: "font-inter", class: "font-sans" },
  { name: "JetBrains Mono", value: "font-mono", class: "font-mono" },
  { name: "Poppins", value: "font-poppins", class: "font-serif" },
  { name: "System", value: "font-system", class: "font-system" },
];

const layouts = [
  { name: "Card Grid", value: "grid", icon: "⊞" },
  { name: "List View", value: "list", icon: "☰" },
  { name: "Compact", value: "compact", icon: "⊟" },
];

export function ThemeCustomizer() {
  const { colorTheme, fontTheme, layoutTheme, setColorTheme, setFontTheme, setLayoutTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<typeof predefinedThemes[0]>(
    colorTheme ? predefinedThemes.find(t => t.name === colorTheme.name) || predefinedThemes[0] : predefinedThemes[0]
  );
  const [selectedFont, setSelectedFont] = useState<typeof fonts[0]>(
    fontTheme ? fonts.find(f => f.name === fontTheme.name) || fonts[0] : fonts[0]
  );
  const [selectedLayout, setSelectedLayout] = useState<typeof layouts[0]>(
    layoutTheme ? layouts.find(l => l.name === layoutTheme.name) || layouts[0] : layouts[0]
  );
  const [animationIntensity, setAnimationIntensity] = useState(100);

  // Update selected theme when colorTheme changes
  useEffect(() => {
    if (colorTheme) {
      const found = predefinedThemes.find(t => t.name === colorTheme.name);
      if (found) {
        setSelectedTheme(found);
      }
    }
  }, [colorTheme]);

  // Update selected font when fontTheme changes
  useEffect(() => {
    if (fontTheme) {
      const found = fonts.find(f => f.name === fontTheme.name);
      if (found) {
        setSelectedFont(found);
      }
    }
  }, [fontTheme]);

  // Update selected layout when layoutTheme changes
  useEffect(() => {
    if (layoutTheme) {
      const found = layouts.find(l => l.name === layoutTheme.name);
      if (found) {
        setSelectedLayout(found);
      }
    }
  }, [layoutTheme]);

  return (
    <>
      {/* Floating Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 shadow-2xl shadow-purple-500/30 flex items-center justify-center group"
      >
        <motion.span
          animate={{ rotate: isOpen ? 45 : 0 }}
          className="text-2xl text-white"
        >
          🎨
        </motion.span>
      </motion.button>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />

            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
              onClick={(e) => {
                // Close when clicking outside the modal
                if (e.target === e.currentTarget) {
                  setIsOpen(false);
                }
              }}
            >
              <div className="w-full max-w-2xl max-h-[90vh] flex flex-col">
              <div className="bg-black/90 backdrop-blur-xl border-2 border-purple-500/30 rounded-2xl flex flex-col max-h-full overflow-hidden">
                {/* Header - Fixed */}
                <div className="flex-shrink-0 p-8 pb-6 border-b border-gray-600/30">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-black text-white flex items-center gap-3">
                      <span className="text-3xl">🎨</span>
                      Theme Customizer
                    </h2>
                    <button
                      onClick={() => setIsOpen(false)}
                      className="w-8 h-8 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 transition-all duration-200 flex items-center justify-center"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto px-8 py-6">
                  <div className="space-y-8">
                  {/* Color Theme */}
                  <div>
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <span className="text-xl">🎨</span>
                      Color Themes
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      {predefinedThemes.map((themeOption) => (
                        <button
                          key={themeOption.name}
                          onClick={() => {
                            setSelectedTheme(themeOption);
                            setColorTheme(themeOption); // Apply immediately
                          }}
                          className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                            selectedTheme.name === themeOption.name
                              ? "border-purple-400 bg-purple-500/20"
                              : "border-gray-600 hover:border-purple-400 bg-black/30"
                          }`}
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <div
                              className="w-4 h-4 rounded-full border-2 border-white/30"
                              style={{ backgroundColor: themeOption.primary }}
                            />
                            <span className="text-white font-semibold">{themeOption.name}</span>
                          </div>
                          <div className="flex gap-1">
                            <div
                              className="w-6 h-2 rounded"
                              style={{ backgroundColor: themeOption.primary }}
                            />
                            <div
                              className="w-6 h-2 rounded"
                              style={{ backgroundColor: themeOption.secondary }}
                            />
                            <div
                              className="w-6 h-2 rounded"
                              style={{ backgroundColor: themeOption.accent }}
                            />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Typography */}
                  <div>
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <span className="text-xl">📝</span>
                      Typography
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {fonts.map((font) => (
                        <button
                          key={font.name}
                          onClick={() => {
                            setSelectedFont(font);
                            setFontTheme(font); // Apply immediately
                          }}
                          className={`p-3 rounded-lg border-2 transition-all duration-300 ${
                            selectedFont.name === font.name
                              ? "border-blue-400 bg-blue-500/20"
                              : "border-gray-600 hover:border-blue-400 bg-black/30"
                          }`}
                        >
                          <div className={`text-white font-semibold text-sm ${font.class}`}>
                            {font.name}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Layout Options */}
                  <div>
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <span className="text-xl">📐</span>
                      Layout Options
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                      {layouts.map((layout) => (
                        <button
                          key={layout.name}
                          onClick={() => {
                            setSelectedLayout(layout);
                            setLayoutTheme(layout); // Apply immediately
                          }}
                          className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                            selectedLayout.name === layout.name
                              ? "border-green-400 bg-green-500/20"
                              : "border-gray-600 hover:border-green-400 bg-black/30"
                          }`}
                        >
                          <div className="text-center">
                            <div className="text-2xl mb-2">{layout.icon}</div>
                            <div className="text-white font-semibold text-sm">{layout.name}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Animation Settings */}
                  <div>
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <span className="text-xl">⚡</span>
                      Animation Settings
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Animation Intensity: {animationIntensity}%
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={animationIntensity}
                          onChange={(e) => setAnimationIntensity(Number(e.target.value))}
                          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">Reduce motion for accessibility</span>
                        <button
                          onClick={() => setAnimationIntensity(0)}
                          className="px-3 py-1 rounded bg-gray-600 hover:bg-gray-500 text-white text-sm transition-colors"
                        >
                          Disable
                        </button>
                      </div>
                    </div>
                  </div>
                  </div>
                </div>

                {/* Footer - Fixed */}
                <div className="flex-shrink-0 px-8 py-6 border-t border-gray-600/30">
                  <div className="flex gap-4">
                    <button
                      onClick={() => {
                        // All settings are already applied immediately on click
                        // This button just closes the modal
                        setIsOpen(false);
                      }}
                      className="flex-1 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 text-white px-6 py-3 rounded-xl font-bold hover:shadow-2xl hover:shadow-purple-500/50 transform hover:scale-105 transition-all duration-300"
                    >
                      Done
                    </button>
                    <button
                      onClick={() => setIsOpen(false)}
                      className="px-6 py-3 border-2 border-gray-600 text-gray-300 rounded-xl hover:border-gray-400 hover:text-white transition-all duration-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
