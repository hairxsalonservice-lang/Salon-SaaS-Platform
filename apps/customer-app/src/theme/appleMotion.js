// src/theme/appleMotion.js
import { Platform } from "react-native";
import * as Haptics from "expo-haptics";
import { FONT_FAMILY } from "./index";

/**
 * 🍎 Apple Motion & Materials Design Tokens
 * Based on WWDC fluid interface & physics design doctrine
 */

// 1. Spring Physics Configs for React Native Animated.spring / Reanimated
export const APPLE_SPRINGS = {
  // Default UI (menus, tab switches, toggles): Critically damped (1.0), zero bounce
  defaultUI: {
    tension: 170,
    friction: 20,
    useNativeDriver: true,
  },
  // Sheet / Modal Open-Close: Smooth fluid physical spring
  sheetModal: {
    tension: 160,
    friction: 18,
    useNativeDriver: true,
  },
  // Card repositioning / Rebook capsule
  cardReposition: {
    tension: 160,
    friction: 20,
    useNativeDriver: true,
  },
  // Flick / Drag release momentum
  momentumFlick: {
    tension: 200,
    friction: 18,
    useNativeDriver: true,
  },
};

// 2. Apple Typography System (§6)
// Display: Oswald (headlines, titles, prices)
// Body: DM Sans (descriptions, metadata, UI text)
export const APPLE_TYPO = {
  heroTitle: {
    fontFamily: FONT_FAMILY.displayBold,
    fontSize: 30,
    letterSpacing: 0.3,
    lineHeight: 38,
  },
  sectionHeader: {
    fontFamily: FONT_FAMILY.display,
    fontSize: 20,
    letterSpacing: 0.2,
    lineHeight: 26,
  },
  bodyText: {
    fontFamily: FONT_FAMILY.body,
    fontSize: 15,
    letterSpacing: 0.1,
    lineHeight: 22,
  },
  metadata: {
    fontFamily: FONT_FAMILY.body,
    fontSize: 13,
    letterSpacing: 0.15,
    lineHeight: 18,
  },
  price: {
    fontFamily: FONT_FAMILY.displayBold,
    fontSize: 22,
    letterSpacing: 0.1,
    lineHeight: 28,
  },
};

// 3. Apple Haptic Triggers (§3)
export const triggerHaptic = (type = "light") => {
  try {
    if (type === "light") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else if (type === "medium") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else if (type === "heavy") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } else if (type === "selection") {
      Haptics.selectionAsync();
    } else if (type === "success") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  } catch (e) {
    // Graceful fallback on unsupported platforms
  }
};

// 4. Rubberbanding Math Function (§3)
export const rubberband = (overshoot, dimension = 300, constant = 0.55) => {
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
};

// 5. Projected Momentum Landing Point Math (§3)
export const projectMomentum = (velocity, decel = 0.998) => {
  return (velocity / 1000) * decel / (1 - decel);
};
