// src/context/ThemeContext.jsx
import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { Animated, Easing, Platform, useColorScheme, Appearance } from "react-native";
import * as NavigationBar from "expo-navigation-bar";
import { storage } from "../services/storage";
import { applyTheme } from "../theme";

const THEME_MODE_KEY = "@salon_app_theme_mode";

export const LIGHT = {
  isDark: false,
  canvas: "#F2F2F7",
  canvasSoft: "#E5E5EA",
  surface: "#FFFFFF",
  ink: "#000000",
  body: "#3C3C43",
  muted: "#8E8E93",
  mutedSoft: "#8E8E93",
  primary: "#0071e3",
  primaryActive: "#0062c4",
  onPrimary: "#FFFFFF",
  price: "#0071e3",
  button: "#0071e3",
  crimson: "#0071e3",
  highlight: "#0071e3",
  hairline: "#C6C6C8",
  hairlineSoft: "#E5E5EA",
  hairlineStrong: "#AEAEB2",
  surfaceStrong: "#E5E5EA",
  thinking: "rgba(0, 113, 227, 0.15)",
  grep: "#E5E5EA",
  read: "#E5E5EA",
  edit: "#E5E5EA",
  done: "#0071e3",
  error: "#FF3B30",
  errorBg: "rgba(255, 59, 48, 0.08)",
  success: "#34C759",
  successBg: "rgba(52, 199, 89, 0.08)",
  tabBg: "#F9F9F9",
  tabBorder: "#C6C6C8",
  tabActive: "#0071e3",
  tabActiveTint: "#E8F0FE",
  tabCenterBtn: "#0071e3",
  statusBar: "dark-content",
  navBarColor: "#F2F2F7",
  navBarButtonStyle: "dark",
};

export const DARK = {
  isDark: true,
  canvas: "#000000",
  canvasSoft: "#1C1C1E",
  surface: "#1C1C1E",
  ink: "#FFFFFF",
  body: "#EBEBF5",
  muted: "#8E8E93",
  mutedSoft: "#636366",
  primary: "#0A84FF",
  primaryActive: "#0070E0",
  onPrimary: "#FFFFFF",
  hairline: "#38383A",
  hairlineSoft: "#2C2C2E",
  hairlineStrong: "#48484A",
  surfaceStrong: "#2C2C2E",
  thinking: "rgba(10, 132, 255, 0.25)",
  grep: "#2C2C2E",
  read: "#2C2C2E",
  edit: "#2C2C2E",
  done: "#0A84FF",
  error: "#FF453A",
  errorBg: "rgba(255, 69, 58, 0.15)",
  success: "#30D158",
  successBg: "rgba(48, 209, 88, 0.15)",
  tabBg: "#1C1C1E",
  tabBorder: "#38383A",
  tabActive: "#0A84FF",
  tabActiveTint: "rgba(10, 132, 255, 0.18)",
  tabCenterBtn: "#0A84FF",
  statusBar: "light-content",
  navBarColor: "#000000",
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
      const activeTheme = activeIsDark ? DARK : LIGHT;
      if (NavigationBar && typeof NavigationBar.setBackgroundColorAsync === 'function') {
        NavigationBar.setBackgroundColorAsync(activeTheme.navBarColor).catch(() => { });
      }
      if (NavigationBar && typeof NavigationBar.setButtonStyleAsync === 'function') {
        NavigationBar.setButtonStyleAsync(activeTheme.navBarButtonStyle).catch(() => { });
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

  const theme = isDark ? DARK : LIGHT;

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
