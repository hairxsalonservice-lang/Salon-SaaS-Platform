// src/context/ThemeContext.jsx
import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { Animated, Easing, Platform, useColorScheme, Appearance } from "react-native";
import * as NavigationBar from "expo-navigation-bar";
import { storage } from "../services/storage";
import { applyTheme } from "../theme";
import { isAndroid, MATERIAL_COLORS } from "../theme/platform";

const THEME_MODE_KEY = "@salon_app_theme_mode";

export const LIGHT = {
  isDark: false,
  canvas: "#FFFFFF",
  canvasSoft: "#F5F3F4",
  surface: "#FFFFFF",
  ink: "#1A1A2E",
  body: "#3D3D52",
  muted: "#8A8A9A",
  mutedSoft: "#8A8A9A",
  primary: "#FF6082",
  primaryActive: "#E54D6D",
  onPrimary: "#FFFFFF",
  price: "#FF6082",
  button: "#FF6082",
  crimson: "#FF6082",
  highlight: "#FF6082",
  hairline: "#E8E0E2",
  hairlineSoft: "#F5F3F4",
  hairlineStrong: "#D0C8CA",
  surfaceStrong: "#F5F3F4",
  thinking: "rgba(255, 96, 130, 0.12)",
  grep: "#F5F3F4",
  read: "#F5F3F4",
  edit: "#F5F3F4",
  done: "#FF6082",
  error: "#D32F2F",
  errorBg: "rgba(211, 47, 47, 0.08)",
  success: "#2E7D32",
  successBg: "rgba(46, 125, 50, 0.08)",
  tabBg: "#FFFFFF",
  tabBorder: "#E8E0E2",
  tabActive: "#FF6082",
  tabActiveTint: "rgba(255, 96, 130, 0.10)",
  tabCenterBtn: "#FF6082",
  statusBar: "dark-content",
  navBarColor: "#FFFFFF",
  navBarButtonStyle: "dark",
};

export const DARK = {
  isDark: true,
  canvas: "#0A0A0A",
  canvasSoft: "#141414",
  surface: "#141414",
  ink: "#F0EDF0",
  body: "#B8B4BC",
  muted: "#7A7680",
  mutedSoft: "#4A4652",
  primary: "#FF7A9A",
  primaryActive: "#FF6082",
  onPrimary: "#FFFFFF",
  hairline: "#252525",
  hairlineSoft: "#1A1A1A",
  hairlineStrong: "#353535",
  surfaceStrong: "#1A1A1A",
  thinking: "rgba(255, 122, 154, 0.16)",
  grep: "#1A1A1A",
  read: "#1A1A1A",
  edit: "#1A1A1A",
  done: "#FF7A9A",
  error: "#FF6B6B",
  errorBg: "rgba(255, 107, 107, 0.12)",
  success: "#66BB6A",
  successBg: "rgba(102, 187, 106, 0.12)",
  tabBg: "#0A0A0A",
  tabBorder: "#252525",
  tabActive: "#FF7A9A",
  tabActiveTint: "rgba(255, 122, 154, 0.15)",
  tabCenterBtn: "#FF7A9A",
  statusBar: "light-content",
  navBarColor: "#0A0A0A",
  navBarButtonStyle: "light",
};

const ThemeContext = createContext({
  theme: LIGHT,
  isDark: false,
  themeMode: "system",
  setThemeMode: () => { },
  toggleTheme: () => { },
  toggleAnim: null,
});

export function ThemeProvider({ children }) {
  const systemColorScheme = useColorScheme();
  const [deviceScheme, setDeviceScheme] = useState(Appearance.getColorScheme() || "light");
  const [themeMode, setThemeModeState] = useState("system");

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setDeviceScheme(colorScheme || "light");
    });
    return () => subscription.remove();
  }, []);

  const activeSystemDark = (systemColorScheme || deviceScheme) === "dark";

  const [isDark, setIsDark] = useState(activeSystemDark);
  const toggleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let activeIsDark = false;
    if (themeMode === "dark") {
      activeIsDark = true;
    } else if (themeMode === "light") {
      activeIsDark = false;
    } else {
      activeIsDark = activeSystemDark;
    }

    applyTheme(activeIsDark);
    setIsDark(activeIsDark);
    toggleAnim.setValue(activeIsDark ? 1 : 0);

    if (Platform.OS === "android") {
      const mc = activeIsDark ? MATERIAL_COLORS.dark : MATERIAL_COLORS.light;
      if (NavigationBar && typeof NavigationBar.setBackgroundColorAsync === 'function') {
        NavigationBar.setBackgroundColorAsync(mc.canvas).catch(() => { });
      }
      if (NavigationBar && typeof NavigationBar.setButtonStyleAsync === 'function') {
        NavigationBar.setButtonStyleAsync(activeIsDark ? "light" : "dark").catch(() => { });
      }
    }
  }, [themeMode, activeSystemDark]);

  useEffect(() => {
    const loadThemeMode = async () => {
      try {
        const savedMode = await storage.getItem(THEME_MODE_KEY);
        if (savedMode && ["light", "dark", "system"].includes(savedMode)) {
          setThemeModeState(savedMode);
        } else {
          setThemeModeState("system");
        }
      } catch (e) { }
    };
    loadThemeMode();
  }, []);

  const setThemeMode = async (mode) => {
    if (!["light", "dark", "system"].includes(mode)) return;
    setThemeModeState(mode);

    const activeIsDark = mode === "dark" || (mode === "system" && activeSystemDark);
    applyTheme(activeIsDark);
    setIsDark(activeIsDark);

    Animated.timing(toggleAnim, {
      toValue: activeIsDark ? 1 : 0,
      duration: 300,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: false,
    }).start();

    try {
      await storage.setItem(THEME_MODE_KEY, mode);
      await storage.removeItem("@salon_app_theme");
    } catch (e) { }
  };

  const toggleTheme = async () => {
    const nextMode = isDark ? "light" : "dark";
    await setThemeMode(nextMode);
  };

  const baseTheme = isDark ? DARK : LIGHT;
  const theme = isAndroid
    ? { ...baseTheme, ...(isDark ? MATERIAL_COLORS.dark : MATERIAL_COLORS.light) }
    : baseTheme;

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark,
        themeMode,
        setThemeMode,
        toggleTheme,
        toggleAnim,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
