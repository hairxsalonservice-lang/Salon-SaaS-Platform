// src/screen/SplashScreen.jsx
import React, { useEffect, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
  Platform,
  StatusBar,
} from "react-native";
import { Image } from "expo-image";
import { useTheme } from "../context/ThemeContext";
import { C, FF } from "../theme";

const { width, height } = Dimensions.get("window");

const BRAND_NAME = "HairX";
const TAGLINE = "BOOK YOUR STYLE.";

// Colours come from the active theme so dark-mode users don't get a bright flash on launch
function getColors(theme, isDark) {
  const primary = theme?.primary || (C.main);
  return {
    canvas: theme?.canvas || (C.bg),
    surface: theme?.surface || (C.surface),
    ink: theme?.ink || (C.ink),
    muted: theme?.muted || (C.muted),
    hairline: theme?.hairline || (isDark ? C.lifted : C.muted),
    primary,
  };
}

export default function SplashScreen({ onFinish }) {
  const { theme, isDark } = useTheme();
  const COLORS = useMemo(() => getColors(theme, isDark), [theme, isDark]);
  const styles = useMemo(() => getStyles(COLORS), [COLORS]);

  // Keep the latest callback without restarting the animation if the parent re-renders
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;

  // ── Animation values ──────────────────────────────────────
  const logoScale = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoSpin = useRef(new Animated.Value(0)).current;
  const textSlide = useRef(new Animated.Value(30)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const taglineSlide = useRef(new Animated.Value(20)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const ringScale = useRef(new Animated.Value(0.6)).current;
  const ringOpacity = useRef(new Animated.Value(0)).current;
  const ring2Scale = useRef(new Animated.Value(0.5)).current;
  const ring2Opacity = useRef(new Animated.Value(0)).current;
  const exitAnim = useRef(new Animated.Value(1)).current;

  // Floating orbs
  const orb1 = useRef(new Animated.Value(0)).current;
  const orb2 = useRef(new Animated.Value(0)).current;
  const orb3 = useRef(new Animated.Value(0)).current;

  // Progress bar
  const progressWidth = useRef(new Animated.Value(0)).current;

  // Dot pulse
  const dotPulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let finished = false;
    const timers = [];
    const later = (fn, ms) => timers.push(setTimeout(fn, ms));

    // ── Phase 1: Expanding rings (0-400ms) ─────────────────
    Animated.parallel([
      Animated.timing(ringOpacity, {
        toValue: 0.5,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(ringScale, {
        toValue: 1,
        tension: 40,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Ring 2 delayed
    later(() => {
      Animated.parallel([
        Animated.timing(ring2Opacity, {
          toValue: 0.3,
          duration: 350,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(ring2Scale, {
          toValue: 1,
          tension: 35,
          friction: 9,
          useNativeDriver: true,
        }),
      ]).start();
    }, 150);

    // ── Phase 2: Logo entrance with a subtle spin (200-800ms) ──
    later(() => {
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 65,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(logoSpin, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
      ]).start();
    }, 200);

    // ── Phase 3: Brand name slides up (500ms) ──────────────
    later(() => {
      Animated.parallel([
        Animated.spring(textSlide, {
          toValue: 0,
          tension: 50,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 350,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    }, 500);

    // ── Phase 4: Tagline fades in (750ms) ──────────────────
    later(() => {
      Animated.parallel([
        Animated.spring(taglineSlide, {
          toValue: 0,
          tension: 55,
          friction: 11,
          useNativeDriver: true,
        }),
        Animated.timing(taglineOpacity, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    }, 750);

    // ── Floating orbs & dot pulse (loop until unmount) ─────
    const loopBetween = (anim, duration, easing) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: 1, duration, easing, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration, easing, useNativeDriver: true }),
        ])
      );

    const loops = [
      loopBetween(orb1, 3000, Easing.inOut(Easing.sin)),
      loopBetween(orb2, 3800, Easing.inOut(Easing.sin)),
      loopBetween(orb3, 2600, Easing.inOut(Easing.sin)),
      loopBetween(dotPulse, 800, Easing.inOut(Easing.ease)),
    ];
    loops.forEach((l) => l.start());

    // ── Progress bar fill ──────────────────────────────────
    later(() => {
      Animated.timing(progressWidth, {
        toValue: 1,
        duration: 1500,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: false,
      }).start();
    }, 600);

    // ── Phase 5: Exit transition (at 2400ms) ───────────────
    later(() => {
      Animated.timing(exitAnim, {
        toValue: 0,
        duration: 400,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished: done }) => {
        if (done && !finished) {
          finished = true;
          if (onFinishRef.current) onFinishRef.current();
        }
      });
    }, 2400);

    return () => {
      // Don't fire onFinish or keep animating once the splash is gone
      finished = true;
      timers.forEach(clearTimeout);
      loops.forEach((l) => l.stop());
    };
  }, []);

  // ── Derived transforms ────────────────────────────────────
  const logoRotate = logoSpin.interpolate({
    inputRange: [0, 1],
    outputRange: ["-45deg", "0deg"],
  });

  const exitScale = exitAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1.08, 1],
  });

  const progressBarWidth = progressWidth.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  // Orb transforms
  const orb1Y = orb1.interpolate({ inputRange: [0, 1], outputRange: [-10, 10] });
  const orb1X = orb1.interpolate({ inputRange: [0, 1], outputRange: [6, -6] });
  const orb2Y = orb2.interpolate({ inputRange: [0, 1], outputRange: [8, -8] });
  const orb2X = orb2.interpolate({ inputRange: [0, 1], outputRange: [-5, 5] });
  const orb3Y = orb3.interpolate({ inputRange: [0, 1], outputRange: [-6, 6] });
  const orb3X = orb3.interpolate({ inputRange: [0, 1], outputRange: [4, -4] });

  // Dot pulse — outer dots and middle dot alternate
  const outerDotScale = dotPulse.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.6, 1, 0.6],
  });
  const middleDotScale = dotPulse.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0.6, 1],
  });

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.canvas }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={COLORS.canvas} />
      <Animated.View
        style={[
          styles.container,
          {
            opacity: exitAnim,
            transform: [{ scale: exitScale }],
          },
        ]}
      >
        {/* ── Background floating orbs ─────────────────────── */}
        <Animated.View
          style={[styles.bgOrb, styles.bgOrb1, { transform: [{ translateY: orb1Y }, { translateX: orb1X }] }]}
        />
        <Animated.View
          style={[styles.bgOrb, styles.bgOrb2, { transform: [{ translateY: orb2Y }, { translateX: orb2X }] }]}
        />
        <Animated.View
          style={[styles.bgOrb, styles.bgOrb3, { transform: [{ translateY: orb3Y }, { translateX: orb3X }] }]}
        />

        {/* ── Center logo composition ──────────────────────── */}
        <View style={styles.centerComposition}>
          {/* Expanding ring 2 (outer) */}
          <Animated.View
            style={[styles.ring, styles.ringOuter, { opacity: ring2Opacity, transform: [{ scale: ring2Scale }] }]}
          />

          {/* Expanding ring 1 */}
          <Animated.View
            style={[styles.ring, styles.ringInner, { opacity: ringOpacity, transform: [{ scale: ringScale }] }]}
          />

          {/* Logo */}
          <Animated.View
            style={[
              styles.logoCircle,
              {
                opacity: logoOpacity,
                transform: [{ scale: logoScale }, { rotate: logoRotate }],
              },
            ]}
          >
            <Image
              source={require("../../assets/logo.png")}
              style={{ width: 68, height: 68, borderRadius: 14 }}
              contentFit="contain"
              accessibilityLabel={`${BRAND_NAME} logo`}
            />
          </Animated.View>

          {/* Brand name */}
          <Animated.View
            style={[styles.brandRow, { opacity: textOpacity, transform: [{ translateY: textSlide }] }]}
          >
            <Text style={styles.brandName} accessibilityRole="header">{BRAND_NAME}</Text>
          </Animated.View>

          {/* Tagline */}
          <Animated.View style={{ opacity: taglineOpacity, transform: [{ translateY: taglineSlide }] }}>
            <Text style={styles.tagline}>{TAGLINE}</Text>
          </Animated.View>
        </View>

        {/* ── Bottom loading section ───────────────────────── */}
        <View style={styles.bottomSection}>
          <View style={styles.dotsRow}>
            <Animated.View style={[styles.loadingDot, styles.dotSoft, { transform: [{ scale: outerDotScale }] }]} />
            <Animated.View style={[styles.loadingDot, styles.dotStrong, { transform: [{ scale: middleDotScale }] }]} />
            <Animated.View style={[styles.loadingDot, styles.dotSoft, { transform: [{ scale: outerDotScale }] }]} />
          </View>

          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, { width: progressBarWidth }]} />
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

// C.main + alpha byte -> C.crimsonTint; only valid for 6-digit hex colours
function withAlpha(hex, alpha) {
  if (typeof hex !== "string" || !/^#[0-9a-fA-F]{6}$/.test(hex)) return hex;
  const a = Math.round(Math.min(Math.max(alpha, 0), 1) * 255).toString(16).padStart(2, "0");
  return hex + a;
}

function getStyles(COLORS) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: COLORS.canvas,
      alignItems: "center",
      justifyContent: "center",
    },

    // ── Background Orbs ────────────────────────────────────────
    bgOrb: {
      position: "absolute",
      borderRadius: 9999,
    },
    bgOrb1: {
      width: 220,
      height: 220,
      top: height * 0.08,
      right: -60,
      backgroundColor: withAlpha(COLORS.primary, 0.06),
    },
    bgOrb2: {
      width: 180,
      height: 180,
      bottom: height * 0.12,
      left: -50,
      backgroundColor: withAlpha(COLORS.primary, 0.08),
    },
    bgOrb3: {
      width: 120,
      height: 120,
      top: height * 0.35,
      left: width * 0.1,
      backgroundColor: withAlpha(COLORS.primary, 0.05),
    },

    // ── Center Composition ─────────────────────────────────────
    centerComposition: {
      alignItems: "center",
      justifyContent: "center",
    },

    // ── Expanding Rings ────────────────────────────────────────
    ring: {
      position: "absolute",
      borderRadius: 9999,
      borderWidth: 1,
    },
    ringInner: {
      width: 140,
      height: 140,
      borderColor: withAlpha(COLORS.primary, 0.13),
      backgroundColor: withAlpha(COLORS.primary, 0.03),
    },
    ringOuter: {
      width: 200,
      height: 200,
      borderColor: withAlpha(COLORS.primary, 0.08),
      backgroundColor: withAlpha(COLORS.primary, 0.015),
    },

    // ── Logo Circle ────────────────────────────────────────────
    logoCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: COLORS.surface,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: COLORS.hairline,
      marginBottom: 24,
    },

    // ── Brand Name ─────────────────────────────────────────────
    brandRow: {
      marginBottom: 10,
    },
    brandName: {
      fontFamily: FF.displayBold,
      fontSize: 26,
      color: COLORS.ink,
      letterSpacing: 2,
    },

    // ── Tagline ────────────────────────────────────────────────
    tagline: {
      fontSize: 14,
      fontFamily: "DMSans_400Regular",
      color: COLORS.muted,
      letterSpacing: 0.3,
      textAlign: "center",
    },

    // ── Bottom Section ─────────────────────────────────────────
    bottomSection: {
      position: "absolute",
      bottom: Platform.OS === "ios" ? 60 : 48,
      alignItems: "center",
      width: "100%",
      paddingHorizontal: 60,
    },

    // ── Loading Dots ───────────────────────────────────────────
    dotsRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 16,
    },
    loadingDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      marginHorizontal: 4,
    },
    dotSoft: {
      backgroundColor: withAlpha(COLORS.primary, 0.4),
    },
    dotStrong: {
      backgroundColor: COLORS.primary,
    },

    // ── Progress Bar ───────────────────────────────────────────
    progressTrack: {
      width: "100%",
      height: 3,
      borderRadius: 2,
      backgroundColor: COLORS.hairline,
      overflow: "hidden",
    },
    progressFill: {
      height: "100%",
      borderRadius: 2,
      backgroundColor: COLORS.primary,
    },
  });
}
