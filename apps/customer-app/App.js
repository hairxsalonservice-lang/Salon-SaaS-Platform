import React, { useEffect } from "react";
import { View, Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider } from "./src/context/AuthContext";
import { ErrorProvider } from "./src/context/ErrorContext";
import AppNavigator from "./src/navigation/AppNavigator";
import { ThemeProvider, useTheme } from "./src/context/ThemeContext";
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

let useFonts = null;
let fontMap = {};

try {
  const fontModule = require("expo-font");
  useFonts = fontModule.useFonts;
  const oswald = require("@expo-google-fonts/oswald");
  const dmSans = require("@expo-google-fonts/dm-sans");
  fontMap = {
    Oswald_400Regular: oswald.Oswald_400Regular,
    Oswald_500Medium: oswald.Oswald_500Medium,
    Oswald_600SemiBold: oswald.Oswald_600SemiBold,
    Oswald_700Bold: oswald.Oswald_700Bold,
    DMSans_400Regular: dmSans.DMSans_400Regular,
    DMSans_500Medium: dmSans.DMSans_500Medium,
    DMSans_600SemiBold: dmSans.DMSans_600SemiBold,
    DMSans_700Bold: dmSans.DMSans_700Bold,
  };
} catch (e) {
  console.log("[Fonts] Safe fallback active:", e?.message);
}

try {
  const SplashScreen = require("expo-splash-screen");
  SplashScreen.preventAutoHideAsync().catch(() => {});
} catch (e) {}

function ThemedNavigationBarOverlay() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  if (Platform.OS !== "android" || !insets.bottom) return null;

  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: insets.bottom,
        backgroundColor: theme.navBarColor || "#000000",
      }}
    />
  );
}

export default function App() {
  const [fontsLoaded] = useFonts ? useFonts(fontMap) : [true];

  useEffect(() => {
    if (fontsLoaded) {
      try {
        const SplashScreen = require("expo-splash-screen");
        SplashScreen.hideAsync().catch(() => {});
      } catch (e) {}
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <ErrorProvider>
            <AuthProvider>
              <View style={{ flex: 1 }}>
                <AppNavigator />
                <ThemedNavigationBarOverlay />
              </View>
            </AuthProvider>
          </ErrorProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
