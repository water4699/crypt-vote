"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ThemeToggle } from "./theme-toggle";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  {
    name: "Dashboard",
    href: "/",
    icon: "📊",
    description: "Overview & Statistics"
  },
  {
    name: "Vote",
    href: "/vote",
    icon: "🗳️",
    description: "Create & Participate"
  },
  {
    name: "Profile",
    href: "/profile",
    icon: "👤",
    description: "Your Activity"
  }
];

export function Navigation() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-orange-500/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-orange-500 via-red-600 to-pink-600 flex items-center justify-center transform group-hover:scale-110 transition-all duration-300 shadow-lg shadow-orange-500/30">
              <span className="text-xl">🔥</span>
            </div>
            <div>
              <h1 className="text-xl font-black text-white bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                CRYPTO VOTE
              </h1>
              <p className="text-xs text-gray-300 drop-shadow-sm">FHEVM Encrypted</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`relative px-4 py-2 rounded-lg font-semibold transition-all duration-300 group ${
                    isActive
                      ? "text-orange-300 bg-orange-500/20"
                      : "text-gray-300 hover:text-orange-200 hover:bg-orange-500/10"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{item.icon}</span>
                    <span>{item.name}</span>
                  </div>

                  {/* Tooltip */}
                  <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-black/90 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap border border-orange-500/30">
                    {item.description}
                  </div>

                  {/* Active indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-lg"
                      initial={false}
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-4">
            <ThemeToggle />

            {/* Wallet Connection - RainbowKit ConnectButton */}
            <div className="hidden md:block">
              <ConnectButton />
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 transition-colors duration-200"
            >
              <div className="w-6 h-6 flex flex-col justify-center items-center">
                <span className={`block w-5 h-0.5 bg-orange-400 transition-all duration-300 ${
                  isMobileMenuOpen ? "rotate-45 translate-y-1" : "-translate-y-1"
                }`}></span>
                <span className={`block w-5 h-0.5 bg-orange-400 transition-all duration-300 ${
                  isMobileMenuOpen ? "opacity-0" : "opacity-100"
                }`}></span>
                <span className={`block w-5 h-0.5 bg-orange-400 transition-all duration-300 ${
                  isMobileMenuOpen ? "-rotate-45 -translate-y-1" : "translate-y-1"
                }`}></span>
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden overflow-hidden"
            >
              <div className="py-4 space-y-2">
                {navItems.map((item, index) => {
                  const isActive = pathname === item.href;
                  return (
                    <motion.div
                      key={item.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Link
                        href={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`block px-4 py-3 rounded-lg font-semibold transition-all duration-300 ${
                          isActive
                            ? "text-orange-300 bg-orange-500/20 border border-orange-500/30"
                            : "text-gray-300 hover:text-orange-200 hover:bg-orange-500/10"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{item.icon}</span>
                          <div>
                            <div>{item.name}</div>
                            <div className="text-xs opacity-70">{item.description}</div>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: navItems.length * 0.1 }}
                  className="px-4 py-3"
                >
                  <ConnectButton />
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}
