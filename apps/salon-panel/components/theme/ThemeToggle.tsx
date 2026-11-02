"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme/ThemeProvider";

interface ThemeToggleProps {
  className?: string;
  size?: number;
  showLabel?: boolean;
}

export default function ThemeToggle({
  className = "",
  size = 15,
  showLabel = false,
}: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const label = isDark ? "Switch to light mode" : "Switch to dark mode";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className={className}
    >
      {isDark ? (
        <Sun size={size} strokeWidth={1.75} />
      ) : (
        <Moon size={size} strokeWidth={1.75} />
      )}
      {showLabel && (
        <span className="text-[12px] font-medium">
          {isDark ? "Light mode" : "Dark mode"}
        </span>
      )}
    </button>
  );
}
