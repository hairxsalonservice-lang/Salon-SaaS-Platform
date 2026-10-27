// src/theme/index.js

export const C = {
  main: "#FF6082",
  primary: "#FF6082",
  brand: "#FF6082",
  accent: "#FF6082",
  price: "#FF6082",
  button: "#FF6082",
  highlight: "#FF6082",

  crimson: "#FF6082",
  crimsonDark: "#E54D6D",
  crimsonLight: "#FF8CA5",
  crimsonTint: "rgba(255, 96, 130, 0.10)",
  crimsonTintStrong: "rgba(255, 96, 130, 0.18)",

  purple: "#FF6082",
  purpleDark: "#E54D6D",
  purpleLight: "#FF8CA5",
  purpleTint: "rgba(255, 96, 130, 0.12)",

  gold: "#FF6082",
  goldDark: "#E54D6D",
  goldLight: "#FF8CA5",
  goldTint: "rgba(255, 96, 130, 0.10)",
  goldTintStrong: "rgba(255, 96, 130, 0.18)",

  dark: "#1A1A2E",
  charcoal: "#1A1A2E",
  ink: "#1A1A2E",

  bg: "#FFFFFF",
  bgWarm: "#FFFFFF",
  lifted: "#F7F3F4",
  surface: "#FFFFFF",
  bone: "#F7F3F4",

  light: "#FFFFFF",
  lightGrey: "#F7F3F4",
  lightGreyBorder: "#E8E0E2",
  card: "#FFFFFF",

  textPrimary: "#1A1A2E",
  textSecondary: "#3D3D52",
  body: "#3D3D52",
  textMuted: "#8A8A9A",
  textLight: "#FFFFFF",
  dustTaupe: "#8A8A9A",
  mutedSoft: "#8A8A9A",

  border: "#E8E0E2",
  borderLight: "#F7F3F4",
  borderDark: "#D0C8CA",
  divider: "#E8E0E2",

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

  tabActive: "#FF6082",
  tabActiveTint: "rgba(255, 96, 130, 0.10)",
  tabCenterBtn: "#FF6082",

  green: "#2E7D32",
  blue: "#FF6082",
  blur: "rgba(255, 255, 255, 0.85)",

  thinking: "rgba(255, 96, 130, 0.12)",
  grep: "#F7F3F4",
  read: "#F7F3F4",
  edit: "#F7F3F4",
  done: "#FF6082",
};

export function applyTheme(isDark) {
  if (isDark) {
    C.bg = "#121218";
    C.bgWarm = "#121218";
    C.lifted = "#262630";
    C.surface = "#1C1C26";
    C.card = "#1C1C26";
    C.bone = "#262630";
    C.light = "#1C1C26";
    C.lightGrey = "#262630";
    C.lightGreyBorder = "#2E2E3A";

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

    C.ink = "#F0EDF0";
    C.dark = "#F0EDF0";
    C.charcoal = "#F0EDF0";
    C.text = "#F0EDF0";
    C.textPrimary = "#F0EDF0";
    C.textSecondary = "#C8C4CC";
    C.body = "#C8C4CC";
    C.textMuted = "#908C96";
    C.dustTaupe = "#908C96";
    C.muted = "#908C96";
    C.mutedSoft = "#5A5662";

    C.border = "#2E2E3A";
    C.borderLight = "#262630";
    C.borderDark = "#3E3E4A";
    C.divider = "#2E2E3A";

    C.thinking = "rgba(255, 122, 154, 0.20)";
    C.tabActive = "#FF7A9A";
    C.tabActiveTint = "rgba(255, 122, 154, 0.18)";
    C.tabCenterBtn = "#FF7A9A";
    C.grep = "#262630";
    C.read = "#262630";
    C.edit = "#262630";
    C.done = "#FF7A9A";

    C.error = "#FF6B6B";
    C.errorText = "#FF6B6B";
    C.errorBg = "rgba(255, 107, 107, 0.15)";

    C.success = "#66BB6A";
    C.successText = "#66BB6A";
    C.successBg = "rgba(102, 187, 106, 0.15)";

    C.heart = "#FF7A9A";
    C.verified = "#FF7A9A";
    C.blur = "rgba(18, 18, 24, 0.85)";
  } else {
    C.bg = "#FFFFFF";
    C.bgWarm = "#FFFFFF";
    C.lifted = "#F7F3F4";
    C.surface = "#FFFFFF";
    C.card = "#FFFFFF";
    C.bone = "#F7F3F4";
    C.light = "#FFFFFF";
    C.lightGrey = "#F7F3F4";
    C.lightGreyBorder = "#E8E0E2";

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
    C.borderLight = "#F7F3F4";
    C.borderDark = "#D0C8CA";
    C.divider = "#E8E0E2";

    C.thinking = "rgba(255, 96, 130, 0.12)";
    C.tabActive = "#FF6082";
    C.tabActiveTint = "rgba(255, 96, 130, 0.10)";
    C.tabCenterBtn = "#FF6082";
    C.grep = "#F7F3F4";
    C.read = "#F7F3F4";
    C.edit = "#F7F3F4";
    C.done = "#FF6082";

    C.error = "#D32F2F";
    C.errorText = "#D32F2F";
    C.errorBg = "rgba(211, 47, 47, 0.08)";

    C.success = "#2E7D32";
    C.successText = "#2E7D32";
    C.successBg = "rgba(46, 125, 50, 0.08)";

    C.heart = "#FF6082";
    C.verified = "#FF6082";
    C.blur = "rgba(255, 255, 255, 0.85)";
  }

  if (TYPO) {
    if (TYPO.eyebrow) TYPO.eyebrow.color = C.main;
    if (TYPO.screenTitle) TYPO.screenTitle.color = C.textPrimary;
    if (TYPO.sectionTitle) TYPO.sectionTitle.color = C.textPrimary;
    if (TYPO.cardTitle) TYPO.cardTitle.color = C.textPrimary;
    if (TYPO.bodyText) TYPO.bodyText.color = C.textSecondary;
    if (TYPO.badgeText) TYPO.badgeText.color = C.textPrimary;
    if (TYPO.navLink) TYPO.navLink.color = C.textPrimary;
  }
}

export const FONT_FAMILY = {
  primary: "Oswald_400Regular",
  body: "Oswald_400Regular",
  bodyMedium: "Oswald_500Medium",
  bodySemiBold: "Oswald_600SemiBold",
  bodyBold: "Oswald_700Bold",
  display: "Oswald_600SemiBold",
  displayMedium: "Oswald_500Medium",
  displayBold: "Oswald_700Bold",
  displayRegular: "Oswald_400Regular",
  serif: "Oswald_600SemiBold",
  code: "Oswald_400Regular",
};
export const FF = FONT_FAMILY;

export const FONT_SIZE = {
  badge: 11,
  caption: 12,
  eyebrow: 12,
  subheadline: 15,
  sub: 13,
  bodySm: 14,
  body: 16,
  bodyLg: 17,
  cardTitle: 17,
  cardMeta: 13,
  button: 16,
  titleSm: 18,
  title: 22,
  titleLg: 24,
  headline: 32,
  hero: 34,
  display: 38,
};
export const FS = FONT_SIZE;

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
  section: 80,
};
export const S = SPACING;

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
    lineHeight: 22,
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
    lineHeight: 24,
    letterSpacing: 0.1,
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
};
