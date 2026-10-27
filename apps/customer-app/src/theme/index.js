// src/theme/index.js

export const C = {
  main: "#0071e3",
  primary: "#0071e3",
  brand: "#0071e3",
  accent: "#0071e3",
  price: "#0071e3",
  button: "#0071e3",
  highlight: "#0071e3",

  crimson: "#0071e3",
  crimsonDark: "#0062c4",
  crimsonLight: "#3694f5",
  crimsonTint: "rgba(0, 113, 227, 0.10)",
  crimsonTintStrong: "rgba(0, 113, 227, 0.18)",

  purple: "#0071e3",
  purpleDark: "#0062c4",
  purpleLight: "#3694f5",
  purpleTint: "rgba(0, 113, 227, 0.12)",

  gold: "#0071e3",
  goldDark: "#0062c4",
  goldLight: "#3694f5",
  goldTint: "rgba(0, 113, 227, 0.10)",
  goldTintStrong: "rgba(0, 113, 227, 0.18)",

  dark: "#000000",
  charcoal: "#1C1C1E",
  ink: "#000000",

  bg: "#F2F2F7",
  bgWarm: "#F2F2F7",
  lifted: "#E5E5EA",
  surface: "#FFFFFF",
  bone: "#E5E5EA",

  light: "#F2F2F7",
  lightGrey: "#E5E5EA",
  lightGreyBorder: "#C6C6C8",
  card: "#FFFFFF",

  textPrimary: "#000000",
  textSecondary: "#3C3C43",
  body: "#3C3C43",
  textMuted: "#8E8E93",
  textLight: "#FFFFFF",
  dustTaupe: "#8E8E93",
  mutedSoft: "#8E8E93",

  border: "#C6C6C8",
  borderLight: "#E5E5EA",
  borderDark: "#AEAEB2",
  divider: "#C6C6C8",

  error: "#FF3B30",
  errorText: "#FF3B30",
  errorBg: "rgba(255, 59, 48, 0.08)",

  success: "#34C759",
  successText: "#34C759",
  successBg: "rgba(52, 199, 89, 0.08)",

  info: "#0071e3",
  infoBg: "rgba(0, 113, 227, 0.12)",

  warning: "#FF9F0A",

  muted: "#8E8E93",
  text: "#000000",

  heart: "#FF3B30",
  verified: "#0071e3",

  tabActive: "#0071e3",
  tabActiveTint: "#E8F0FE",
  tabCenterBtn: "#0071e3",

  green: "#34C759",
  blue: "#0071e3",
  blur: "rgba(255, 255, 255, 0.8)",

  thinking: "rgba(0, 113, 227, 0.15)",
  grep: "#E5E5EA",
  read: "#E5E5EA",
  edit: "#E5E5EA",
  done: "#0071e3",
};

export function applyTheme(isDark) {
  if (isDark) {
    C.bg = "#000000";
    C.bgWarm = "#000000";
    C.lifted = "#2C2C2E";
    C.surface = "#1C1C1E";
    C.card = "#1C1C1E";
    C.bone = "#2C2C2E";
    C.light = "#1C1C1E";
    C.lightGrey = "#2C2C2E";
    C.lightGreyBorder = "#38383A";

    C.main = "#0A84FF";
    C.primary = "#0A84FF";
    C.brand = "#0A84FF";
    C.accent = "#0A84FF";
    C.price = "#0A84FF";
    C.button = "#0A84FF";
    C.highlight = "#0A84FF";
    C.crimson = "#0A84FF";
    C.gold = "#0A84FF";
    C.goldDark = "#0A84FF";
    C.goldLight = "#409CFF";
    C.goldTint = "rgba(10, 132, 255, 0.16)";
    C.goldTintStrong = "rgba(10, 132, 255, 0.25)";

    C.ink = "#FFFFFF";
    C.dark = "#FFFFFF";
    C.charcoal = "#FFFFFF";
    C.text = "#FFFFFF";
    C.textPrimary = "#FFFFFF";
    C.textSecondary = "#EBEBF5";
    C.body = "#EBEBF5";
    C.textMuted = "#8E8E93";
    C.dustTaupe = "#8E8E93";
    C.muted = "#8E8E93";
    C.mutedSoft = "#636366";

    C.border = "#38383A";
    C.borderLight = "#2C2C2E";
    C.borderDark = "#48484A";
    C.divider = "#38383A";

    C.thinking = "rgba(10, 132, 255, 0.25)";
    C.tabActive = "#0A84FF";
    C.tabActiveTint = "rgba(10, 132, 255, 0.18)";
    C.tabCenterBtn = "#0A84FF";
    C.grep = "#2C2C2E";
    C.read = "#2C2C2E";
    C.edit = "#2C2C2E";
    C.done = "#0A84FF";

    C.error = "#FF453A";
    C.errorText = "#FF453A";
    C.errorBg = "rgba(255, 69, 58, 0.15)";

    C.success = "#30D158";
    C.successText = "#30D158";
    C.successBg = "rgba(48, 209, 88, 0.15)";

    C.blur = "rgba(0, 0, 0, 0.8)";
  } else {
    C.bg = "#F2F2F7";
    C.bgWarm = "#F2F2F7";
    C.lifted = "#E5E5EA";
    C.surface = "#FFFFFF";
    C.card = "#FFFFFF";
    C.bone = "#E5E5EA";
    C.light = "#F2F2F7";
    C.lightGrey = "#E5E5EA";
    C.lightGreyBorder = "#C6C6C8";

    C.main = "#0071e3";
    C.primary = "#0071e3";
    C.brand = "#0071e3";
    C.accent = "#0071e3";
    C.price = "#0071e3";
    C.button = "#0071e3";
    C.highlight = "#0071e3";
    C.crimson = "#0071e3";
    C.gold = "#0071e3";
    C.goldDark = "#0062c4";
    C.goldLight = "#3694f5";
    C.goldTint = "rgba(0, 113, 227, 0.10)";
    C.goldTintStrong = "rgba(0, 113, 227, 0.18)";

    C.ink = "#000000";
    C.dark = "#000000";
    C.charcoal = "#1C1C1E";
    C.text = "#000000";
    C.textPrimary = "#000000";
    C.textSecondary = "#3C3C43";
    C.body = "#3C3C43";
    C.textMuted = "#8E8E93";
    C.dustTaupe = "#8E8E93";
    C.muted = "#8E8E93";
    C.mutedSoft = "#8E8E93";

    C.border = "#C6C6C8";
    C.borderLight = "#E5E5EA";
    C.borderDark = "#AEAEB2";
    C.divider = "#C6C6C8";

    C.thinking = "rgba(0, 113, 227, 0.15)";
    C.tabActive = "#0071e3";
    C.tabActiveTint = "#E8F0FE";
    C.tabCenterBtn = "#0071e3";
    C.grep = "#E5E5EA";
    C.read = "#E5E5EA";
    C.edit = "#E5E5EA";
    C.done = "#0071e3";

    C.error = "#FF3B30";
    C.errorText = "#FF3B30";
    C.errorBg = "rgba(255, 59, 48, 0.08)";

    C.success = "#34C759";
    C.successText = "#34C759";
    C.successBg = "rgba(52, 199, 89, 0.08)";

    C.blur = "rgba(255, 255, 255, 0.8)";
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
  primary: "Inter_400Regular",
  body: "Inter_400Regular",
  bodyMedium: "Inter_500Medium",
  bodySemiBold: "Inter_600SemiBold",
  bodyBold: "Inter_700Bold",
  display: "Inter_600SemiBold",
  displayMedium: "Inter_500Medium",
  displayBold: "Inter_700Bold",
  serif: "Inter_600SemiBold",
  code: "Inter_400Regular",
};
export const FF = FONT_FAMILY;

export const FONT_SIZE = {
  badge: 10,
  caption: 11,
  eyebrow: 11,
  subheadline: 14,
  sub: 12,
  bodySm: 14,
  body: 16,
  bodyLg: 16,
  cardTitle: 16,
  cardMeta: 12,
  button: 14,
  titleSm: 16,
  title: 18,
  titleLg: 20,
  headline: 28,
  hero: 28,
  display: 32,
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
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  headline: {
    fontFamily: FONT_FAMILY.display,
    fontSize: FONT_SIZE.headline,
    color: C.ink,
    lineHeight: FONT_SIZE.headline * 1.12,
  },
  subheadline: {
    fontFamily: FONT_FAMILY.body,
    fontSize: FONT_SIZE.subheadline,
    color: C.muted,
  },
  screenTitle: {
    fontFamily: FONT_FAMILY.displayBold,
    fontSize: FONT_SIZE.hero,
    color: C.textPrimary,
    letterSpacing: -0.4,
  },
  sectionTitle: {
    fontFamily: FONT_FAMILY.display,
    fontSize: FONT_SIZE.titleLg,
    color: C.textPrimary,
    letterSpacing: -0.3,
  },
  cardTitle: {
    fontFamily: FONT_FAMILY.display,
    fontSize: FONT_SIZE.cardTitle,
    color: C.textPrimary,
    letterSpacing: -0.1,
  },
  cardMeta: {
    fontFamily: FONT_FAMILY.body,
    fontSize: FONT_SIZE.cardMeta,
    color: C.textMuted,
  },
  bodyText: {
    fontFamily: FONT_FAMILY.body,
    fontSize: FONT_SIZE.body,
    color: C.textSecondary,
    lineHeight: 22,
  },
  badgeText: {
    fontFamily: FONT_FAMILY.bodySemiBold,
    fontSize: FONT_SIZE.caption,
    color: C.textPrimary,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  navLink: {
    fontFamily: FONT_FAMILY.bodyMedium,
    fontSize: FONT_SIZE.bodySm,
    color: C.textPrimary,
  },
};
