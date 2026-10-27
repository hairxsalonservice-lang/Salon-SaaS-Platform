// src/theme/platform.js
// Platform-aware design tokens: Apple HIG on iOS, Material You on Android
import { Platform } from "react-native";

export const isIOS = Platform.OS === "ios";
export const isAndroid = Platform.OS === "android";

// ── Border Radii ────────────────────────────────────────────
export const PLATFORM_RADIUS = {
  xs: isIOS ? 4 : 8,
  sm: isIOS ? 8 : 12,
  card: isIOS ? 14 : 16,
  button: isIOS ? 12 : 24,
  md: isIOS ? 12 : 16,
  lg: isIOS ? 16 : 20,
  xl: isIOS ? 20 : 28,
  input: isIOS ? 12 : 16,
  sheet: isIOS ? 16 : 28,
  pill: 9999,
  circle: 9999,
};

// ── Shadows ─────────────────────────────────────────────────
// iOS: real shadows. Android: elevation with surface tint (no shadow props).
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
export const PLATFORM_SPACING = {
  cardPadding: isIOS ? 16 : 16,
  cardGap: isIOS ? 14 : 12,
  sectionGap: isIOS ? 24 : 20,
  inputHeight: isIOS ? 52 : 56,
  buttonHeight: isIOS ? 50 : 52,
  headerPaddingTop: isIOS ? 56 : 16,
  tabBarPaddingBottom: isIOS ? 34 : 12,
};

// ── Typography ──────────────────────────────────────────────
export const PLATFORM_TYPO = {
  titleSize: isIOS ? 28 : 24,
  titleWeight: isIOS ? "700" : "600",
  titleFont: "Oswald_700Bold",
  sectionTitleSize: isIOS ? 20 : 18,
  sectionTitleFont: "Oswald_600SemiBold",
  bodySize: isIOS ? 15 : 14,
  bodyFont: "Oswald_400Regular",
  captionSize: isIOS ? 12 : 12,
  letterSpacing: isIOS ? -0.4 : 0.1,
};

// ── Press Feedback ──────────────────────────────────────────
export const PLATFORM_PRESS = {
  useRipple: isAndroid,
  scaleDown: isIOS ? 0.97 : 1.0,
  opacityDown: isIOS ? 0.7 : 0.92,
};

// ── Android Material You Colors ─────────────────────────────
// Material 3 uses surface tint overlays, not pure black/white backgrounds.
export const MATERIAL_COLORS = {
  light: {
    canvas: "#FFFFFF",
    surface: "#FFFFFF",
    surfaceContainer: "#F7F3F4",
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
    canvas: "#121218",
    surface: "#1C1C26",
    surfaceContainer: "#262630",
    surfaceContainerLow: "#1C1C26",
    surfaceContainerHigh: "#30303C",
    ink: "#F0EDF0",
    body: "#C8C4CC",
    muted: "#908C96",
    hairline: "#2E2E3A",
    primary: "#FF7A9A",
    primaryContainer: "#6E2040",
    error: "#FF6B6B",
    success: "#66BB6A",
    tabBg: "#262630",
  },
};

// ── Card Styles ─────────────────────────────────────────────
export function getPlatformCardStyle(isDark) {
  if (isIOS) {
    return {
      borderRadius: PLATFORM_RADIUS.card,
      borderWidth: 1,
      borderColor: isDark ? "#2E2E3A" : "#E8E0E2",
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

// ── Input Field Style ───────────────────────────────────────
export function getPlatformInputStyle(isDark) {
  if (isIOS) {
    return {
      borderRadius: PLATFORM_RADIUS.input,
      backgroundColor: isDark ? "#1C1C26" : "#FFFFFF",
      borderWidth: 1,
      borderColor: isDark ? "#2E2E3A" : "#E8E0E2",
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

// ── Button Style ────────────────────────────────────────────
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

// ── Navigation Animation ────────────────────────────────────
export const PLATFORM_ANIMATION = {
  screenPush: isIOS ? "ios_from_right" : "fade_from_bottom",
  modalPresent: isIOS ? "slide_from_bottom" : "fade_from_bottom",
  screenPop: isIOS ? "ios_from_right" : "fade_from_bottom",
  duration: isIOS ? 350 : 300,
  tabSpring: isIOS
    ? { speed: 22, bounciness: 0 }
    : { speed: 28, bounciness: 0 },
};
