// src/components/AndroidExpandingTabBar.jsx
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function AndroidExpandingTabBar({ tabs, currentTab, onSelectTab }) {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 10);

  const tabActiveColor = theme.tabActive || "#0071e3";
  const inactiveColor = isDark ? "#8E8E93" : "#8E8E93";
  const borderColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
  const fallbackBg = isDark ? "rgba(28,28,30,0.85)" : "rgba(249,249,249,0.78)";

  const renderContent = () => (
    <View style={[styles.innerContainer, { paddingBottom: bottomInset }]}>
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
              style={styles.tabItem}
            >
              <Ionicons
                name={isSelected ? (tab.iconActive || tab.icon) : (tab.iconInactive || tab.icon)}
                size={22}
                color={iconColor}
              />
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color: iconColor,
                    fontWeight: isSelected ? "600" : "400",
                  },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  if (Platform.OS === "ios") {
    return (
      <View style={styles.bottomBarContainer}>
        <BlurView
          intensity={80}
          tint={isDark ? "dark" : "light"}
          style={StyleSheet.absoluteFill}
        />
        {renderContent()}
      </View>
    );
  }

  return (
    <View style={[styles.bottomBarContainer, { backgroundColor: fallbackBg }]}>
      {renderContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  bottomBarContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
    overflow: "hidden",
  },
  innerContainer: {
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
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    minHeight: 48,
  },
  tabLabel: {
    fontSize: 10,
    letterSpacing: -0.1,
    marginTop: 2,
  },
});
