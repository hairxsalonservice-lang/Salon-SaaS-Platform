// src/theme/platform.js
// Platform-aware design tokens: Apple HIG on iOS, Material You on Android
import { Platform } from "react-native";

const isIOS = Platform.OS === "ios";

// ── Border Radii ────────────────────────────────────────────
// iOS: tighter Apple radii. Android: Material You larger roundness.
export const PLATFORM_RADIUS = {
  xs: isIOS ? 4 : 6,
  sm: isIOS ? 8 : 12,
  card: isIOS ? 14 : 16,
  button: isIOS ? 12 : 24,
  md: isIOS ? 12 : 16,
  lg: isIOS ? 16 : 20,
  xl: isIOS ? 20 : 28,
  input: isIOS ? 12 : 28,
  sheet: isIOS ? 16 : 28,
  pill: 9999,
  circle: 9999,
};

// ── Shadows ─────────────────────────────────────────────────
// iOS uses shadowColor/Offset/Opacity/Radius. Android uses elevation.
// Material You: surface tonal elevation instead of drop shadows.
export const PLATFORM_SHADOWS = {
  sm: isIOS
    ? { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 }
    : { elevation: 1 },
  md: isIOS
    ? { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 }
    : { elevation: 2 },
  lg: isIOS
    ? { shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 24, elevation: 8 }
    : { elevation: 4 },
};

// ── Spacing ─────────────────────────────────────────────────
// Android: slightly more generous padding (Material density)
export const PLATFORM_SPACING = {
  cardPadding: isIOS ? 16 : 16,
  cardGap: isIOS ? 14 : 12,
  sectionGap: isIOS ? 24 : 20,
  inputHeight: isIOS ? 52 : 56,
  buttonHeight: isIOS ? 50 : 52,
  headerPaddingTop: isIOS ? 56 : 16,
  tabBarPaddingBottom: isIOS ? 34 : 12,
};

// ── Typography tweaks ───────────────────────────────────────
// Android renders fonts differently — slightly larger body, different weights
export const PLATFORM_TYPO = {
  titleSize: isIOS ? 28 : 24,
  titleWeight: isIOS ? "700" : "600",
  sectionTitleSize: isIOS ? 20 : 18,
  bodySize: isIOS ? 15 : 14,
  captionSize: isIOS ? 12 : 12,
  letterSpacing: isIOS ? -0.4 : 0,
};

// ── Press Feedback ──────────────────────────────────────────
// iOS: scale + opacity. Android: ripple effect (handled in components).
export const PLATFORM_PRESS = {
  useRipple: !isIOS,
  scaleDown: isIOS ? 0.97 : 1.0,
  opacityDown: isIOS ? 0.7 : 0.85,
};

// ── Card Styles ─────────────────────────────────────────────
// iOS: bordered cards with subtle shadow. Android: elevated surface tonal.
export function getPlatformCardStyle(isDark) {
  if (isIOS) {
    return {
      borderRadius: PLATFORM_RADIUS.card,
      borderWidth: 1,
      borderColor: isDark ? "#38383A" : "#E5E5EA",
      ...PLATFORM_SHADOWS.md,
    };
  }
  return {
    borderRadius: PLATFORM_RADIUS.card,
    borderWidth: 0,
    elevation: 2,
    backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
  };
}

// ── Input Field Style ───────────────────────────────────────
// iOS: rounded rect with border. Android: Material outlined/filled.
export function getPlatformInputStyle(isDark) {
  if (isIOS) {
    return {
      borderRadius: PLATFORM_RADIUS.input,
      backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
      borderWidth: 1,
      borderColor: isDark ? "#38383A" : "#E5E5EA",
      height: PLATFORM_SPACING.inputHeight,
      paddingHorizontal: 16,
    };
  }
  return {
    borderRadius: PLATFORM_RADIUS.input,
    backgroundColor: isDark ? "#1C1C1E" : "#F2F2F7",
    borderWidth: 0,
    height: PLATFORM_SPACING.inputHeight,
    paddingHorizontal: 20,
  };
}

// ── Button Style ────────────────────────────────────────────
// iOS: compact rounded rect. Android: Material You full-round pill.
export function getPlatformButtonStyle(isDark, variant = "filled") {
  const base = {
    height: PLATFORM_SPACING.buttonHeight,
    borderRadius: PLATFORM_RADIUS.button,
    alignItems: "center",
    justifyContent: "center",
  };
  if (isIOS) {
    return base;
  }
  return {
    ...base,
    elevation: variant === "filled" ? 2 : 0,
  };
}
