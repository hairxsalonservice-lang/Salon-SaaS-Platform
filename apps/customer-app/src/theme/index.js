// src/theme/index.js
// HairX Premium Design System — Dark-first, Oswald display + DM Sans body

// ── Color Tokens ───────────────────────────────────────────────
// Dark mode is the premium default. Coral pops on deep black.
export const C = {
  // Brand coral — the signature color
  main: "#FF6082",
  primary: "#FF6082",
  brand: "#FF6082",
  accent: "#FF6082",
  price: "#FF6082",
  button: "#FF6082",
  highlight: "#FF6082",

  // Brand shades
  crimson: "#FF6082",
  crimsonDark: "#E54D6D",
  crimsonLight: "#FF8CA5",
  crimsonTint: "rgba(255, 96, 130, 0.10)",
  crimsonTintStrong: "rgba(255, 96, 130, 0.18)",

  // Legacy aliases (mapped to coral)
  purple: "#FF6082",
  purpleDark: "#E54D6D",
  purpleLight: "#FF8CA5",
  purpleTint: "rgba(255, 96, 130, 0.12)",

  gold: "#FF6082",
  goldDark: "#E54D6D",
  goldLight: "#FF8CA5",
  goldTint: "rgba(255, 96, 130, 0.10)",
  goldTintStrong: "rgba(255, 96, 130, 0.18)",

  // Foreground
  dark: "#1A1A2E",
  charcoal: "#1A1A2E",
  ink: "#1A1A2E",

  // Surfaces
  bg: "#FFFFFF",
  bgWarm: "#FFFFFF",
  lifted: "#F5F3F4",
  surface: "#FFFFFF",
  card: "#FFFFFF",
  cardBg: "#FFFFFF",
  bone: "#F5F3F4",
  overlay: "rgba(0, 0, 0, 0.45)",
  shimmer: "#E8E6E4",

  light: "#FFFFFF",
  lightGrey: "#F5F3F4",
  lightGreyBorder: "#E8E0E2",

  // Text hierarchy
  textPrimary: "#1A1A2E",
  textSecondary: "#3D3D52",
  body: "#3D3D52",
  textMuted: "#8A8A9A",
  textLight: "#FFFFFF",
  dustTaupe: "#8A8A9A",
  mutedSoft: "#8A8A9A",

  // Borders
  border: "#E8E0E2",
  borderLight: "#F5F3F4",
  borderDark: "#D0C8CA",
  divider: "#E8E0E2",

  // Semantic
  error: "#D32F2F",
  errorText: "#D32F2F",
  errorBg: "rgba(211, 47, 47, 0.08)",

  success: "#2E7D32",
  successText: "#2E7D32",
  successBg: "rgba(46, 125, 50, 0.08)",

  info: "#FF6082",
  infoBg: "rgba(255, 96, 130, 0.12)",

  warning: "#E65100",
  warningBg: "rgba(230, 81, 0, 0.08)",

  muted: "#8A8A9A",
  text: "#1A1A2E",

  heart: "#FF6082",
  verified: "#FF6082",

  // Tab bar
  tabActive: "#FF6082",
  tabActiveTint: "rgba(255, 96, 130, 0.10)",
  tabCenterBtn: "#FF6082",

  green: "#2E7D32",
  blue: "#FF6082",
  blur: "rgba(255, 255, 255, 0.85)",

  // Utility surfaces
  thinking: "rgba(255, 96, 130, 0.12)",
  grep: "#F5F3F4",
  read: "#F5F3F4",
  edit: "#F5F3F4",
  done: "#FF6082",

  // Gradient arrays for LinearGradient
  gradient: ["#FF6082", "#FF8CA5"],
  gradientDark: ["#FF6082", "#E54D6D"],
};

export function applyTheme(isDark) {
  if (isDark) {
    // ── DARK MODE (Premium) ──
    // Deep true-black backgrounds, not grey
    C.bg = "#0A0A0A";
    C.bgWarm = "#0A0A0A";
    C.lifted = "#1A1A1A";
    C.surface = "#141414";
    C.card = "#141414";
    C.cardBg = "#1A1A1A";
    C.bone = "#1A1A1A";
    C.light = "#141414";
    C.lightGrey = "#1A1A1A";
    C.lightGreyBorder = "#252525";
    C.overlay = "rgba(0, 0, 0, 0.65)";
    C.shimmer = "#252525";

    // Coral shifts slightly brighter on dark
    C.main = "#FF7A9A";
    C.primary = "#FF7A9A";
    C.brand = "#FF7A9A";
    C.accent = "#FF7A9A";
    C.price = "#FF7A9A";
    C.button = "#FF7A9A";
    C.highlight = "#FF7A9A";
    C.crimson = "#FF7A9A";
    C.gold = "#FF7A9A";
    C.goldDark = "#FF6082";
    C.goldLight = "#FFA0B8";
    C.goldTint = "rgba(255, 122, 154, 0.16)";
    C.goldTintStrong = "rgba(255, 122, 154, 0.25)";
    C.crimsonTint = "rgba(255, 122, 154, 0.14)";
    C.crimsonTintStrong = "rgba(255, 122, 154, 0.22)";

    // Text: high contrast on deep black
    C.ink = "#F0EDF0";
    C.dark = "#F0EDF0";
    C.charcoal = "#F0EDF0";
    C.text = "#F0EDF0";
    C.textPrimary = "#F0EDF0";
    C.textSecondary = "#B8B4BC";
    C.body = "#B8B4BC";
    C.textMuted = "#7A7680";
    C.dustTaupe = "#7A7680";
    C.muted = "#7A7680";
    C.mutedSoft = "#4A4652";

    // Borders: subtle on dark
    C.border = "#252525";
    C.borderLight = "#1A1A1A";
    C.borderDark = "#353535";
    C.divider = "#252525";

    // Semantic — brighter for dark bg
    C.error = "#FF6B6B";
    C.errorText = "#FF6B6B";
    C.errorBg = "rgba(255, 107, 107, 0.12)";

    C.success = "#66BB6A";
    C.successText = "#66BB6A";
    C.successBg = "rgba(102, 187, 106, 0.12)";

    C.info = "#FF7A9A";
    C.infoBg = "rgba(255, 122, 154, 0.14)";

    C.warning = "#FFB74D";
    C.warningBg = "rgba(255, 183, 77, 0.12)";

    // UI
    C.thinking = "rgba(255, 122, 154, 0.16)";
    C.tabActive = "#FF7A9A";
    C.tabActiveTint = "rgba(255, 122, 154, 0.15)";
    C.tabCenterBtn = "#FF7A9A";
    C.grep = "#1A1A1A";
    C.read = "#1A1A1A";
    C.edit = "#1A1A1A";
    C.done = "#FF7A9A";

    C.heart = "#FF7A9A";
    C.verified = "#FF7A9A";
    C.blur = "rgba(10, 10, 10, 0.88)";

    C.gradient = ["#FF7A9A", "#FF6082"];
    C.gradientDark = ["#FF6082", "#CC4D68"];
  } else {
    // ── LIGHT MODE (Clean) ──
    C.bg = "#FFFFFF";
    C.bgWarm = "#FFFFFF";
    C.lifted = "#F5F3F4";
    C.surface = "#FFFFFF";
    C.card = "#FFFFFF";
    C.cardBg = "#FFFFFF";
    C.bone = "#F5F3F4";
    C.light = "#FFFFFF";
    C.lightGrey = "#F5F3F4";
    C.lightGreyBorder = "#E8E0E2";
    C.overlay = "rgba(0, 0, 0, 0.45)";
    C.shimmer = "#E8E6E4";

    C.main = "#FF6082";
    C.primary = "#FF6082";
    C.brand = "#FF6082";
    C.accent = "#FF6082";
    C.price = "#FF6082";
    C.button = "#FF6082";
    C.highlight = "#FF6082";
    C.crimson = "#FF6082";
    C.gold = "#FF6082";
    C.goldDark = "#E54D6D";
    C.goldLight = "#FF8CA5";
    C.goldTint = "rgba(255, 96, 130, 0.10)";
    C.goldTintStrong = "rgba(255, 96, 130, 0.18)";
    C.crimsonTint = "rgba(255, 96, 130, 0.10)";
    C.crimsonTintStrong = "rgba(255, 96, 130, 0.18)";

    C.ink = "#1A1A2E";
    C.dark = "#1A1A2E";
    C.charcoal = "#1A1A2E";
    C.text = "#1A1A2E";
    C.textPrimary = "#1A1A2E";
    C.textSecondary = "#3D3D52";
    C.body = "#3D3D52";
    C.textMuted = "#8A8A9A";
    C.dustTaupe = "#8A8A9A";
    C.muted = "#8A8A9A";
    C.mutedSoft = "#8A8A9A";

    C.border = "#E8E0E2";
    C.borderLight = "#F5F3F4";
    C.borderDark = "#D0C8CA";
    C.divider = "#E8E0E2";

    C.thinking = "rgba(255, 96, 130, 0.12)";
    C.tabActive = "#FF6082";
    C.tabActiveTint = "rgba(255, 96, 130, 0.10)";
    C.tabCenterBtn = "#FF6082";
    C.grep = "#F5F3F4";
    C.read = "#F5F3F4";
    C.edit = "#F5F3F4";
    C.done = "#FF6082";

    C.error = "#D32F2F";
    C.errorText = "#D32F2F";
    C.errorBg = "rgba(211, 47, 47, 0.08)";

    C.success = "#2E7D32";
    C.successText = "#2E7D32";
    C.successBg = "rgba(46, 125, 50, 0.08)";

    C.info = "#FF6082";
    C.infoBg = "rgba(255, 96, 130, 0.12)";

    C.warning = "#E65100";
    C.warningBg = "rgba(230, 81, 0, 0.08)";

    C.heart = "#FF6082";
    C.verified = "#FF6082";
    C.blur = "rgba(255, 255, 255, 0.85)";

    C.gradient = ["#FF6082", "#FF8CA5"];
    C.gradientDark = ["#FF6082", "#E54D6D"];
  }

  if (TYPO) {
    if (TYPO.eyebrow) TYPO.eyebrow.color = C.main;
    if (TYPO.screenTitle) TYPO.screenTitle.color = C.textPrimary;
    if (TYPO.sectionTitle) TYPO.sectionTitle.color = C.textPrimary;
    if (TYPO.cardTitle) TYPO.cardTitle.color = C.textPrimary;
    if (TYPO.bodyText) TYPO.bodyText.color = C.textSecondary;
    if (TYPO.badgeText) TYPO.badgeText.color = C.textPrimary;
    if (TYPO.navLink) TYPO.navLink.color = C.textPrimary;
    if (TYPO.cardMeta) TYPO.cardMeta.color = C.textMuted;
    if (TYPO.caption) TYPO.caption.color = C.textMuted;
    if (TYPO.metadata) TYPO.metadata.color = C.textMuted;
  }
}

// ── Font Families ──────────────────────────────────────────────
// Display: Oswald — bold, condensed, for headlines and titles
// Body: DM Sans — clean, readable, for paragraphs and UI text
export const FONT_FAMILY = {
  // Display (Oswald) — headlines, titles, hero text
  display: "Oswald_600SemiBold",
  displayMedium: "Oswald_500Medium",
  displayBold: "Oswald_700Bold",
  displayRegular: "Oswald_400Regular",

  // Body (DM Sans) — readable text, UI labels, descriptions
  primary: "DMSans_400Regular",
  body: "DMSans_400Regular",
  bodyMedium: "DMSans_500Medium",
  bodySemiBold: "DMSans_600SemiBold",
  bodyBold: "DMSans_700Bold",

  // Semantic aliases
  serif: "Oswald_600SemiBold",
  code: "DMSans_400Regular",
};
export const FF = FONT_FAMILY;

// ── Font Sizes ─────────────────────────────────────────────────
export const FONT_SIZE = {
  badge: 11,
  caption: 12,
  eyebrow: 11,
  sub: 13,
  cardMeta: 13,
  subheadline: 14,
  bodySm: 14,
  body: 15,
  bodyLg: 16,
  button: 15,
  cardTitle: 17,
  titleSm: 18,
  title: 22,
  titleLg: 24,
  headline: 30,
  hero: 34,
  display: 40,
};
export const FS = FONT_SIZE;

// ── Font Weights ───────────────────────────────────────────────
export const FONT_WEIGHT = {
  regular: "400",
  body: "400",
  medium: "500",
  semiBold: "600",
  bold: "700",
  heavy: "800",
  black: "900",
};
export const FW = FONT_WEIGHT;

// ── Spacing (4px grid) ────────────────────────────────────────
export const SPACING = {
  none: 0,
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  huge: 48,
  jumbo: 64,
  section: 80,
};
export const S = SPACING;

// ── Platform tokens ────────────────────────────────────────────
import {
  PLATFORM_RADIUS,
  PLATFORM_SHADOWS,
  PLATFORM_SPACING,
  PLATFORM_TYPO,
  PLATFORM_PRESS,
  getPlatformCardStyle,
  getPlatformInputStyle,
  getPlatformButtonStyle,
} from "./platform";

export const RADIUS = PLATFORM_RADIUS;
export const R = RADIUS;
export const SHADOWS = PLATFORM_SHADOWS;

export {
  PLATFORM_RADIUS,
  PLATFORM_SHADOWS,
  PLATFORM_SPACING,
  PLATFORM_TYPO,
  PLATFORM_PRESS,
  getPlatformCardStyle,
  getPlatformInputStyle,
  getPlatformButtonStyle,
};

// ── Typography Presets ─────────────────────────────────────────
// Display presets use Oswald, body presets use DM Sans
export const TYPO = {
  eyebrow: {
    fontFamily: FONT_FAMILY.bodySemiBold,
    fontSize: FONT_SIZE.eyebrow,
    color: C.main,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  headline: {
    fontFamily: FONT_FAMILY.displayBold,
    fontSize: FONT_SIZE.headline,
    color: C.ink,
    lineHeight: FONT_SIZE.headline * 1.2,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  subheadline: {
    fontFamily: FONT_FAMILY.bodyMedium,
    fontSize: FONT_SIZE.subheadline,
    color: C.muted,
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  screenTitle: {
    fontFamily: FONT_FAMILY.displayBold,
    fontSize: FONT_SIZE.hero,
    color: C.textPrimary,
    letterSpacing: 0.2,
    lineHeight: FONT_SIZE.hero * 1.15,
  },
  sectionTitle: {
    fontFamily: FONT_FAMILY.display,
    fontSize: FONT_SIZE.titleLg,
    color: C.textPrimary,
    letterSpacing: 0.2,
    lineHeight: FONT_SIZE.titleLg * 1.25,
  },
  cardTitle: {
    fontFamily: FONT_FAMILY.displayMedium,
    fontSize: FONT_SIZE.cardTitle,
    color: C.textPrimary,
    letterSpacing: 0.1,
  },
  cardMeta: {
    fontFamily: FONT_FAMILY.body,
    fontSize: FONT_SIZE.cardMeta,
    color: C.textMuted,
    letterSpacing: 0.1,
  },
  bodyText: {
    fontFamily: FONT_FAMILY.body,
    fontSize: FONT_SIZE.body,
    color: C.textSecondary,
    lineHeight: 22,
    letterSpacing: 0.1,
  },
  caption: {
    fontFamily: FONT_FAMILY.body,
    fontSize: FONT_SIZE.caption,
    color: C.textMuted,
    letterSpacing: 0.2,
  },
  metadata: {
    fontFamily: FONT_FAMILY.body,
    fontSize: FONT_SIZE.sub,
    color: C.textMuted,
    letterSpacing: 0.15,
    lineHeight: 18,
  },
  badgeText: {
    fontFamily: FONT_FAMILY.bodySemiBold,
    fontSize: FONT_SIZE.caption,
    color: C.textPrimary,
    letterSpacing: 1.0,
    textTransform: "uppercase",
  },
  navLink: {
    fontFamily: FONT_FAMILY.bodyMedium,
    fontSize: FONT_SIZE.bodySm,
    color: C.textPrimary,
    letterSpacing: 0.1,
  },
  price: {
    fontFamily: FONT_FAMILY.displayBold,
    fontSize: FONT_SIZE.title,
    color: C.price,
    letterSpacing: 0.1,
    lineHeight: FONT_SIZE.title * 1.2,
  },
  button: {
    fontFamily: FONT_FAMILY.bodySemiBold,
    fontSize: FONT_SIZE.button,
    letterSpacing: 0.3,
  },
};
