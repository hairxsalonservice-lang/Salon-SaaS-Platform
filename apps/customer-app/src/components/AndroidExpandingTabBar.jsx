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

const isIOS = Platform.OS === "ios";

export default function AndroidExpandingTabBar({ tabs, currentTab, onSelectTab }) {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, isIOS ? 10 : 8);

  const tabActiveColor = theme.tabActive || "#0071e3";
  const inactiveColor = "#8E8E93";
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
                      { color: iconColor, fontWeight: isSelected ? "600" : "400" },
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
  const androidBg = isDark ? "#1C1C1E" : "#FFFBFE";
  const androidActiveBg = isDark ? "rgba(10, 132, 255, 0.12)" : "rgba(0, 113, 227, 0.08)";

  return (
    <View style={[styles.androidBarContainer, { backgroundColor: androidBg, paddingBottom: bottomInset }]}>
      <View style={styles.androidTabsRow}>
        {tabs.map((tab) => {
          const isSelected = currentTab === tab.id;
          const iconColor = isSelected ? tabActiveColor : inactiveColor;
          return (
            <Pressable
              key={tab.id}
              onPress={() => onSelectTab(tab.id)}
              android_ripple={{ color: "rgba(0, 0, 0, 0.08)", borderless: true }}
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
                    fontWeight: isSelected ? "600" : "500",
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
    letterSpacing: -0.1,
    marginTop: 2,
  },

  // ── Android Material You styles ────────────────
  androidBarContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
    elevation: 8,
    borderTopWidth: 0,
  },
  androidTabsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 8,
    paddingTop: 10,
  },
  androidTabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 56,
  },
  androidIndicator: {
    paddingHorizontal: 20,
    paddingVertical: 4,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  androidTabLabel: {
    fontSize: 12,
    letterSpacing: 0.2,
    marginTop: 2,
  },
});
