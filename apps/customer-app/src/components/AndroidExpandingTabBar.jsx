// src/components/AndroidExpandingTabBar.jsx
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function AndroidExpandingTabBar({ tabs, currentTab, onSelectTab }) {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 10);

  const barBg = isDark ? "#1C1C1E" : "#F9F9F9";
  const tabActiveColor = theme.tabActive || "#0071e3";
  const inactiveColor = "#8E8E93";
  const borderColor = isDark ? "#38383A" : "#C6C6C8";

  return (
    <View
      style={[
        styles.bottomBarContainer,
        {
          backgroundColor: barBg,
          paddingBottom: bottomInset,
          borderTopColor: borderColor,
        },
      ]}
    >
      <View style={styles.tabsRow}>
        {tabs.map((tab) => {
          const isSelected = currentTab === tab.id;
          const iconColor = isSelected ? tabActiveColor : inactiveColor;

          return (
            <TouchableOpacity
              key={tab.id}
              activeOpacity={0.7}
              onPress={() => onSelectTab(tab.id)}
              style={styles.tabItem}
            >
              <Ionicons
                name={isSelected ? (tab.iconActive || tab.icon) : (tab.iconInactive || tab.icon)}
                size={24}
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
}

const styles = StyleSheet.create({
  bottomBarContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
  },
  tabsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 4,
    minHeight: 50,
  },
  tabLabel: {
    fontSize: 10,
    letterSpacing: -0.1,
    marginTop: 2,
  },
});
