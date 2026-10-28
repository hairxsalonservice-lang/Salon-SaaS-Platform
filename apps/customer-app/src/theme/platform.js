// src/theme/platform.js
// Platform-aware design tokens: unified radii, platform-specific shadows & feedback
import { Platform } from "react-native";

export const isIOS = Platform.OS === "ios";
export const isAndroid = Platform.OS === "android";

// ── Border Radii (unified — one system for both platforms) ────
export const PLATFORM_RADIUS = {
  xs: 6,
  sm: 10,
  card: 14,
  button: 14,
  md: 14,
  lg: 20,
  xl: 28,
  input: 14,
  sheet: 24,
  pill: 9999,
  circle: 9999,
};

// ── Shadows ────────────────────────────────────────────────────
// iOS: real shadows. Android: elevation only.
export const PLATFORM_SHADOWS = {
  none: isIOS
    ? { shadowColor: "transparent", shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0, elevation: 0 }
    : { elevation: 0 },
  sm: isIOS
    ? { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 }
    : { elevation: 1 },
  md: isIOS
    ? { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 }
    : { elevation: 2 },
  lg: isIOS
    ? { shadowColor: "#000", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.12, shadowRadius: 16, elevation: 6 }
    : { elevation: 4 },
  xl: isIOS
    ? { shadowColor: "#000", shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.18, shadowRadius: 32, elevation: 12 }
    : { elevation: 8 },
  // Coral glow — for featured/highlighted cards
  glow: isIOS
    ? { shadowColor: "#FF6082", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 4 }
    : { elevation: 3 },
};

// ── Spacing ────────────────────────────────────────────────────
export const PLATFORM_SPACING = {
  cardPadding: 16,
  cardGap: isIOS ? 14 : 12,
  sectionGap: isIOS ? 24 : 20,
  inputHeight: isIOS ? 50 : 52,
  buttonHeight: isIOS ? 50 : 52,
  headerPaddingTop: isIOS ? 56 : 16,
  tabBarPaddingBottom: isIOS ? 34 : 12,
};

// ── Typography ─────────────────────────────────────────────────
export const PLATFORM_TYPO = {
  titleSize: isIOS ? 28 : 24,
  titleWeight: "700",
  titleFont: "Oswald_700Bold",
  sectionTitleSize: isIOS ? 20 : 18,
  sectionTitleFont: "Oswald_600SemiBold",
  bodySize: isIOS ? 15 : 14,
  bodyFont: "DMSans_400Regular",
  captionSize: 12,
  captionFont: "DMSans_400Regular",
  letterSpacing: 0.1,
};

// ── Press Feedback ─────────────────────────────────────────────
export const PLATFORM_PRESS = {
  useRipple: isAndroid,
  scaleDown: isIOS ? 0.97 : 0.98,
  opacityDown: isIOS ? 0.7 : 0.92,
};

// ── Material You Colors (Android surface tint system) ──────────
export const MATERIAL_COLORS = {
  light: {
    canvas: "#FFFFFF",
    surface: "#FFFFFF",
    surfaceContainer: "#F5F3F4",
    surfaceContainerLow: "#FAF8F8",
    surfaceContainerHigh: "#F0ECEE",
    ink: "#1A1A2E",
    body: "#3D3D52",
    muted: "#8A8A9A",
    hairline: "#E8E0E2",
    primary: "#FF6082",
    primaryContainer: "#FFE0E8",
    error: "#D32F2F",
    success: "#2E7D32",
    tabBg: "#FFFFFF",
  },
  dark: {
    canvas: "#0A0A0A",
    surface: "#141414",
    surfaceContainer: "#1A1A1A",
    surfaceContainerLow: "#141414",
    surfaceContainerHigh: "#252525",
    ink: "#F0EDF0",
    body: "#B8B4BC",
    muted: "#7A7680",
    hairline: "#252525",
    primary: "#FF7A9A",
    primaryContainer: "#6E2040",
    error: "#FF6B6B",
    success: "#66BB6A",
    tabBg: "#141414",
  },
};

// ── Card Styles ────────────────────────────────────────────────
export function getPlatformCardStyle(isDark) {
  if (isIOS) {
    return {
      borderRadius: PLATFORM_RADIUS.card,
      borderWidth: 1,
      borderColor: isDark ? "#252525" : "#E8E0E2",
      ...PLATFORM_SHADOWS.md,
    };
  }
  const m = isDark ? MATERIAL_COLORS.dark : MATERIAL_COLORS.light;
  return {
    borderRadius: PLATFORM_RADIUS.card,
    borderWidth: 0,
    elevation: 1,
    backgroundColor: m.surfaceContainer,
  };
}

// ── Input Field Style ──────────────────────────────────────────
export function getPlatformInputStyle(isDark) {
  if (isIOS) {
    return {
      borderRadius: PLATFORM_RADIUS.input,
      backgroundColor: isDark ? "#141414" : "#FFFFFF",
      borderWidth: 1,
      borderColor: isDark ? "#252525" : "#E8E0E2",
      height: PLATFORM_SPACING.inputHeight,
      paddingHorizontal: 16,
    };
  }
  const m = isDark ? MATERIAL_COLORS.dark : MATERIAL_COLORS.light;
  return {
    borderRadius: PLATFORM_RADIUS.input,
    backgroundColor: m.surfaceContainerHigh,
    borderWidth: 0,
    height: PLATFORM_SPACING.inputHeight,
    paddingHorizontal: 20,
  };
}

// ── Button Style ───────────────────────────────────────────────
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
    elevation: variant === "filled" ? 1 : 0,
  };
}

// ── Navigation Animation ───────────────────────────────────────
export const PLATFORM_ANIMATION = {
  screenPush: isIOS ? "ios_from_right" : "fade_from_bottom",
  modalPresent: isIOS ? "slide_from_bottom" : "fade_from_bottom",
  screenPop: isIOS ? "ios_from_right" : "fade_from_bottom",
  duration: isIOS ? 350 : 300,
  tabSpring: isIOS
    ? { speed: 22, bounciness: 0 }
    : { speed: 28, bounciness: 0 },
};
