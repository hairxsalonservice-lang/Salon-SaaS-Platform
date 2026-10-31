// src/components/AndroidExpandingTabBar.jsx
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  Platform,
} from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { C } from "../theme";

const isIOS = Platform.OS === "ios";

export default function AndroidExpandingTabBar({ tabs, currentTab, onSelectTab }) {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, isIOS ? 10 : 8);

  const tabActiveColor = theme.tabActive || C.main;
  const inactiveColor = C.muted;
  const borderColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";

  // ── iOS: glassmorphism tab bar ──────────────────────────────
  if (isIOS) {
    return (
      <View style={styles.iosBarContainer}>
        <BlurView
          intensity={80}
          tint={isDark ? "dark" : "light"}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.iosInner, { paddingBottom: bottomInset }]}>
          <View style={[styles.topBorder, { backgroundColor: borderColor }]} />
          <View style={styles.tabsRow}>
            {tabs.map((tab) => {
              const isSelected = currentTab === tab.id;
              const iconColor = isSelected ? tabActiveColor : inactiveColor;
              return (
                <TouchableOpacity
                  key={tab.id}
                  activeOpacity={0.6}
                  onPress={() => onSelectTab(tab.id)}
                  style={styles.iosTabItem}
                >
                  <Ionicons
                    name={isSelected ? (tab.iconActive || tab.icon) : (tab.iconInactive || tab.icon)}
                    size={22}
                    color={iconColor}
                  />
                  <Text
                    style={[
                      styles.iosTabLabel,
                      { color: iconColor, fontFamily: isSelected ? "DMSans_600SemiBold" : "DMSans_400Regular" },
                    ]}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    );
  }

  // ── Android: Material You elevated surface bar ──────────────
  const androidBg = isDark ? C.surface : C.bg;
  const androidActiveBg = isDark ? "rgba(255,96,130,0.12)" : "rgba(255,96,130,0.10)";

  return (
    <View style={[styles.androidBarContainer, { backgroundColor: androidBg, paddingBottom: bottomInset, borderTopColor: borderColor }]}>
      <View style={styles.androidTabsRow}>
        {tabs.map((tab) => {
          const isSelected = currentTab === tab.id;
          const iconColor = isSelected ? tabActiveColor : inactiveColor;
          return (
            <Pressable
              key={tab.id}
              onPress={() => onSelectTab(tab.id)}
              android_ripple={{ color: "rgba(255,96,130,0.12)", borderless: true }}
              style={styles.androidTabItem}
            >
              <View style={[styles.androidIndicator, isSelected && { backgroundColor: androidActiveBg }]}>
                <Ionicons
                  name={isSelected ? (tab.iconActive || tab.icon) : (tab.iconInactive || tab.icon)}
                  size={22}
                  color={iconColor}
                />
              </View>
              <Text
                style={[
                  styles.androidTabLabel,
                  {
                    color: iconColor,
                    fontFamily: isSelected ? "DMSans_600SemiBold" : "DMSans_400Regular",
                  },
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // ── iOS styles ─────────────────────────────────
  iosBarContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
    overflow: "hidden",
  },
  iosInner: {
    paddingTop: 6,
  },
  topBorder: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
  },
  tabsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 4,
  },
  iosTabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    minHeight: 48,
  },
  iosTabLabel: {
    fontSize: 10,
    letterSpacing: 0.1,
    marginTop: 2,
  },

  // ── Android Material You styles ────────────────
  androidBarContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
    elevation: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  androidTabsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  androidTabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
  },
  androidIndicator: {
    paddingHorizontal: 18,
    paddingVertical: 4,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  androidTabLabel: {
    fontSize: 11,
    letterSpacing: 0.3,
    marginTop: 2,
  },
});
