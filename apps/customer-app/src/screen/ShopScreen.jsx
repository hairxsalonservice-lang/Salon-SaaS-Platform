// src/screen/ShopScreen.jsx
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Platform,
  StatusBar,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C, FF } from "../theme";
import { useTheme } from "../context/ThemeContext";
import SpringTouchable from "../components/SpringTouchable";
import { useLocationStore } from "../store/useLocationStore";
import ComingSoonLocation from "../components/ComingSoonLocation";
import LocationPickerModal from "../components/LocationPickerModal";
import { ScrollView } from "react-native";

const TOP_INSET =
  Platform.OS === "ios" ? 52 : StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 36;

export default function ShopScreen({ navigate, onScroll }) {
  const { isDark } = useTheme();
  const [notified, setNotified] = useState(false);
  const selectedCity = useLocationStore((state) => state.selectedCity);
  const setSelectedCity = useLocationStore((state) => state.setSelectedCity);
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const LIVE_CITIES = ["brahmapur", "bhubaneswar"];
  const isCityEmpty = selectedCity && !LIVE_CITIES.includes(selectedCity.toLowerCase());

  const handleNotifyPress = () => {
    setNotified(true);
    Alert.alert(
      "Notification Set! 🎉",
      "We'll notify you as soon as the HairX Shop opens."
    );
  };

  const styles = getStyles(isDark);
  const accentColor = C.main;

  if (isCityEmpty) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Shop</Text>
        </View>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingTop: 20, paddingBottom: 100 }}>
          <ComingSoonLocation
            city={selectedCity}
            onChangeLocation={() => setLocationModalVisible(true)}
            onSelectQuickCity={(c) => setSelectedCity(c)}
          />
        </ScrollView>
        <LocationPickerModal
          visible={locationModalVisible}
          selectedCity={selectedCity}
          onSelectCity={(city) => {
            setSelectedCity(city);
            setLocationModalVisible(false);
          }}
          onClose={() => setLocationModalVisible(false)}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* Top Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Shop</Text>
      </View>

      {/* Centered Minimal Coming Soon View */}
      <View style={styles.content}>
        <View style={styles.iconRingOuter}>
          <View style={styles.iconRingInner}>
            <Ionicons name="bag-handle-outline" size={38} color={accentColor} />
          </View>
        </View>

        <View style={styles.badgePill}>
          <View style={styles.glowingDot} />
          <Text style={styles.badgeText}>COMING SOON</Text>
        </View>

        <Text style={styles.title}>HairX Store</Text>
        <Text style={styles.subtitle}>
          Our exclusive collection of salon-grade products &amp; beauty essentials is on its way.
        </Text>

        <SpringTouchable
          style={[styles.notifyBtn, notified && styles.notifyBtnDone]}
          onPress={handleNotifyPress}
          disabled={notified}
          scaleTo={0.96}
        >
          <Ionicons
            name={notified ? "checkmark-circle" : "notifications-outline"}
            size={18}
            color={C.textLight}
            style={{ marginRight: 8 }}
          />
          <Text style={styles.notifyBtnText}>
            {notified ? "You'll Be Notified!" : "Notify Me When Available"}
          </Text>
        </SpringTouchable>
      </View>
    </View>
  );
}

function getStyles(isDark) {
  const accentColor = C.main;

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: C.bg,
    },
    header: {
      paddingTop: TOP_INSET,
      paddingHorizontal: 24,
      paddingBottom: 16,
      backgroundColor: C.bg,
    },
    headerTitle: {
      fontFamily: FF.displayBold,
      fontSize: 24,
      color: C.ink,
      letterSpacing: 0.2,
    },
    content: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 32,
      paddingBottom: 100,
    },
    iconRingOuter: {
      width: 96,
      height: 96,
      borderRadius: 48,
      backgroundColor: isDark ? "rgba(10, 132, 255, 0.12)" : C.infoBg,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 20,
      borderWidth: 1.5,
      borderColor: isDark ? "rgba(10, 132, 255, 0.25)" : C.crimsonTint,
    },
    iconRingInner: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: isDark ? "rgba(10, 132, 255, 0.2)" : C.crimsonTint,
      alignItems: "center",
      justifyContent: "center",
    },
    badgePill: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: isDark ? "rgba(10, 132, 255, 0.15)" : C.infoBg,
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: isDark ? "rgba(10, 132, 255, 0.3)" : C.crimsonTint,
      marginBottom: 16,
    },
    glowingDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: accentColor,
      marginRight: 6,
    },
    badgeText: {
      fontSize: 10.5,
      fontFamily: "Oswald_700Bold",
      color: accentColor,
      letterSpacing: 0.8,
    },
    title: {
      fontSize: 24,
      fontFamily: "Oswald_700Bold",
      color: C.ink,
      textAlign: "center",
      marginBottom: 10,
      letterSpacing: 0.15,
    },
    subtitle: {
      fontSize: 14,
      fontFamily: "DMSans_400Regular",
      color: C.muted,
      textAlign: "center",
      lineHeight: 22,
      marginBottom: 28,
      maxWidth: 280,
    },
    notifyBtn: {
      backgroundColor: accentColor,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 24,
      height: 48,
      borderRadius: 24,
      shadowColor: accentColor,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 3,
      width: "100%",
      maxWidth: 280,
    },
    notifyBtnDone: {
      backgroundColor: isDark ? C.success : C.success,
      shadowColor: C.success,
    },
    notifyBtnText: {
      color: C.textLight,
      fontSize: 14.5,
      fontFamily: "Oswald_700Bold",
    },
  });
}
