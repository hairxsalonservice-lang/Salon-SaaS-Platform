"use client";

import { useTheme } from "./theme-context";
import { Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";

export default function ThemeToggle({ className = "" }: { className?: string }) {
  const { isDark, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div
        className={`w-9 h-9 rounded-full border border-black/10 dark:border-white/10 flex items-center justify-center opacity-0 ${className}`}
        aria-hidden="true"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={`relative w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 btn-press
        bg-[#f5f5f7] hover:bg-[#e8e8ed] text-[#1d1d1f] border border-[#d2d2d7]/50
        dark:bg-[#1c1c1f] dark:hover:bg-[#2c2c2e] dark:text-[#f5f5f7] dark:border-white/10
        shadow-sm hover:shadow active:scale-95 cursor-pointer ${className}`}
    >
      <div className="relative w-4.5 h-4.5 flex items-center justify-center">
        {/* Sun Icon */}
        <Sun
          className={`w-4 h-4 text-amber-500 absolute transition-all duration-300 ${
            isDark
              ? "rotate-0 scale-100 opacity-100"
              : "-rotate-90 scale-0 opacity-0"
          }`}
        />
        {/* Moon Icon */}
        <Moon
          className={`w-4 h-4 text-[#1d1d1f] absolute transition-all duration-300 ${
            isDark
              ? "rotate-90 scale-0 opacity-0"
              : "rotate-0 scale-100 opacity-100"
          }`}
        />
      </div>
    </button>
  );
}
