// src/screen/ProfileScreen.jsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  Platform,
  AppState,
  Alert,
  Share,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { C, FONT_FAMILY, PLATFORM_RADIUS, PLATFORM_SPACING, getPlatformCardStyle, getPlatformButtonStyle } from "../theme";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { triggerHaptic } from "../theme/appleMotion";
import { useFavorites } from "../context/FavoritesContext";
import VerifyEmailModal from "../components/VerifyEmailModal";

const TOP_INSET =
  Platform.OS === "ios" ? 52 : StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 36;

export default function ProfileScreen({ navigate, onScroll }) {
  const { user, isAuthenticated, logout, refreshProfile } = useAuth();
  const { isDark, themeMode, setThemeMode } = useTheme();
  const { favorites } = useFavorites();
  const styles = React.useMemo(() => getStyles(isDark), [isDark]);
  const [showVerifyModal, setShowVerifyModal] = useState(false);

  const isVerified = Boolean(user?.isEmailVerified || user?.email_verified);

  useEffect(() => {
    if (!isAuthenticated || !refreshProfile) return;
    refreshProfile();
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") refreshProfile();
    });
    return () => subscription.remove();
  }, [isAuthenticated, refreshProfile]);

  useEffect(() => {
    if (!isAuthenticated || isVerified || !refreshProfile) return;
    const interval = setInterval(() => {
      refreshProfile();
    }, 4000);
    return () => clearInterval(interval);
  }, [isAuthenticated, isVerified, refreshProfile]);

  const handleShareApp = async () => {
    try {
      await Share.share({
        message: "Book your luxury salon appointments on HairX! Download now: https://stcut.app",
      });
    } catch (error) {
      console.log(error.message);
    }
  };

  const handleLogoutPress = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: logout },
    ]);
  };

  const MALE_AVATAR_ASSET = require("../../assets/male-avatar.png");
  const FEMALE_AVATAR_ASSET = require("../../assets/female-avatar.png");

  const resolveProfileAvatarSource = (userData) => {
    if (userData?.avatarUrl && typeof userData.avatarUrl === "string" && userData.avatarUrl.trim().length > 0) {
      return { uri: userData.avatarUrl.trim() };
    }
    const g = (userData?.gender || userData?.sex || userData?.genderPreference || "").toString().toLowerCase().trim();
    if (g === "female" || g === "women" || g === "woman" || g === "f") {
      return FEMALE_AVATAR_ASSET;
    }
    return MALE_AVATAR_ASSET;
  };

  const resolveUserName = (userData) => {
    if (!isAuthenticated) return "Welcome Guest";
    if (userData?.name && userData.name.trim().length > 0) {
      return userData.name.trim();
    }
    if (userData?.email && userData.email.includes("@")) {
      const emailPrefix = userData.email.split("@")[0];
      return emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
    }
    return "User Account";
  };

  const userAvatarSource = resolveProfileAvatarSource(user);
  const userName = resolveUserName(user);
  const userEmail = isAuthenticated
    ? user?.email || ""
    : "Sign in to manage your appointments and preferences";

  const accentColor = C.main;

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        {/* Profile Header Section */}
        <View style={styles.headerContainer}>
          <View style={styles.headerTopRow}>
            {/* Avatar & Edit Icon */}
            <TouchableOpacity
              style={styles.avatarWrap}
              onPress={() => (isAuthenticated ? navigate && navigate("EditProfile") : navigate && navigate("Login"))}
              activeOpacity={0.85}
            >
              <Image source={userAvatarSource} style={styles.avatarImage} />
              <View style={styles.editBadge}>
                <Ionicons name="pencil" size={12} color={C.textLight} />
              </View>
            </TouchableOpacity>

            {/* Quick Action Icons */}
            <View style={styles.topRightActions}>
              <TouchableOpacity
                style={styles.iconCircleBtn}
                onPress={() => navigate && navigate("NotificationCenter")}
                activeOpacity={0.75}
              >
                <Ionicons name="notifications-outline" size={20} color={isDark ? "#F5F3F4" : C.ink} />
                <View style={styles.redBadgeDot} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.iconCircleBtn}
                onPress={() => navigate && navigate("SavedSalons")}
                activeOpacity={0.75}
              >
                <Ionicons name="heart-outline" size={20} color={isDark ? "#F5F3F4" : C.ink} />
                {favorites.length > 0 && <View style={styles.favBadgeDot} />}
              </TouchableOpacity>
            </View>
          </View>

          {/* User Name & Subtext */}
          <Text style={styles.userNameText}>{userName}</Text>
          <Text style={styles.userSubtext}>{userEmail}</Text>

          {/* Auth Action Buttons (When Guest) */}
          {!isAuthenticated && (
            <View style={styles.authButtonsRow}>
              <TouchableOpacity
                style={styles.primaryAuthBtn}
                onPress={() => navigate && navigate("Login")}
                activeOpacity={0.88}
              >
                <Text style={styles.primaryAuthBtnText}>Login / Sign Up</Text>
                <Ionicons name="arrow-forward" size={16} color={C.textLight} style={{ marginLeft: 6 }} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryAuthBtn}
                onPress={() => navigate && navigate("Register")}
                activeOpacity={0.8}
              >
                <Text style={styles.secondaryAuthBtnText}>Create Account</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Promo / Self Care Card Banner */}
        <TouchableOpacity
          style={styles.promoCard}
          onPress={() => navigate && navigate("Home")}
          activeOpacity={0.9}
        >
          <View style={styles.promoContentCol}>
            <View style={styles.promoTagPill}>
              <Text style={styles.promoTagText}>SELF CARE</Text>
            </View>
            <Text style={styles.promoTitle}>Beauty Looks Better With You</Text>
            <Text style={styles.promoSub}>
              Book appointments, save favorites and get personalized offers.
            </Text>
            <View style={styles.promoLinkRow}>
              <Text style={styles.promoLinkText}>Explore Services</Text>
              <Ionicons name="arrow-forward" size={14} color={accentColor} style={{ marginLeft: 4 }} />
            </View>
          </View>
          <View style={styles.promoIconWrap}>
            <Ionicons name="sparkles" size={30} color={accentColor} />
          </View>
        </TouchableOpacity>

        {/* App Appearance Card */}
        <View style={styles.themeCard}>
          <Text style={styles.themeCardHeader}>APP APPEARANCE</Text>
          <View style={styles.themeSegmentRow}>
            <TouchableOpacity
              style={[styles.themeTab, themeMode === "light" && styles.themeTabActive]}
              onPress={() => { triggerHaptic("selection"); setThemeMode("light"); }}
              activeOpacity={0.8}
            >
              <Ionicons
                name="sunny"
                size={14}
                color={themeMode === "light" ? C.textLight : C.muted}
              />
              <Text style={[styles.themeTabLabel, themeMode === "light" && styles.themeTabLabelActive]}>
                Light
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.themeTab, themeMode === "dark" && styles.themeTabActive]}
              onPress={() => { triggerHaptic("selection"); setThemeMode("dark"); }}
              activeOpacity={0.8}
            >
              <Ionicons
                name="moon"
                size={14}
                color={themeMode === "dark" ? C.textLight : C.muted}
              />
              <Text style={[styles.themeTabLabel, themeMode === "dark" && styles.themeTabLabelActive]}>
                Dark
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.themeTab, themeMode === "system" && styles.themeTabActive]}
              onPress={() => { triggerHaptic("selection"); setThemeMode("system"); }}
              activeOpacity={0.8}
            >
              <Ionicons
                name="phone-portrait-outline"
                size={14}
                color={themeMode === "system" ? C.textLight : C.muted}
              />
              <Text style={[styles.themeTabLabel, themeMode === "system" && styles.themeTabLabelActive]}>
                System
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Menu Items Cards */}
        <View style={styles.menuGroup}>
          {/* 1. Appointment History */}
          <TouchableOpacity
            style={styles.menuCard}
            onPress={() => navigate && navigate("Bookings")}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIconBox, { backgroundColor: isDark ? "rgba(10, 132, 255, 0.15)" : C.infoBg }]}>
              <Ionicons name="calendar-outline" size={20} color={accentColor} />
            </View>
            <View style={styles.menuTextCol}>
              <Text style={styles.menuTitle}>Appointment History</Text>
              <Text style={styles.menuSub}>View and manage your bookings</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={C.muted} />
          </TouchableOpacity>


          {/* 4. Change Password */}
          <TouchableOpacity
            style={styles.menuCard}
            onPress={() => (isAuthenticated ? navigate && navigate("EditProfile") : navigate && navigate("Login"))}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIconBox, { backgroundColor: isDark ? "rgba(245, 158, 11, 0.15)" : C.goldTint }]}>
              <Ionicons name="lock-closed-outline" size={20} color={C.warning} />
            </View>
            <View style={styles.menuTextCol}>
              <Text style={styles.menuTitle}>Change Password</Text>
              <Text style={styles.menuSub}>Keep your account secure</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={C.muted} />
          </TouchableOpacity>

          {/* 5. Invite Friends */}
          <TouchableOpacity
            style={styles.menuCard}
            onPress={handleShareApp}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIconBox, { backgroundColor: isDark ? "rgba(139, 92, 246, 0.15)" : C.infoBg }]}>
              <Ionicons name="people-outline" size={20} color={C.info} />
            </View>
            <View style={styles.menuTextCol}>
              <Text style={styles.menuTitle}>Invite Friends</Text>
              <Text style={styles.menuSub}>Earn rewards together</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={C.muted} />
          </TouchableOpacity>

          {/* 6. FAQs */}
          <TouchableOpacity
            style={styles.menuCard}
            onPress={() => navigate && navigate("Support")}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIconBox, { backgroundColor: isDark ? "rgba(239, 68, 68, 0.15)" : C.errorBg }]}>
              <Ionicons name="chatbubble-ellipses-outline" size={20} color={C.error} />
            </View>
            <View style={styles.menuTextCol}>
              <Text style={styles.menuTitle}>FAQs</Text>
              <Text style={styles.menuSub}>Find answers to common questions</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={C.muted} />
          </TouchableOpacity>

          {/* 7. About Us */}
          <TouchableOpacity
            style={styles.menuCard}
            onPress={() => navigate && navigate("About")}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIconBox, { backgroundColor: isDark ? "rgba(99, 102, 241, 0.15)" : C.infoBg }]}>
              <Ionicons name="information-circle-outline" size={20} color={C.info} />
            </View>
            <View style={styles.menuTextCol}>
              <Text style={styles.menuTitle}>About Us</Text>
              <Text style={styles.menuSub}>Learn more about our app</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={C.muted} />
          </TouchableOpacity>

          {/* 8. Login / Logout */}
          <TouchableOpacity
            style={styles.menuCard}
            onPress={isAuthenticated ? handleLogoutPress : () => navigate && navigate("Login")}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIconBox, { backgroundColor: isDark ? "rgba(16, 185, 129, 0.15)" : C.successBg }]}>
              <Ionicons name={isAuthenticated ? "log-out-outline" : "log-in-outline"} size={20} color={C.success} />
            </View>
            <View style={styles.menuTextCol}>
              <Text style={styles.menuTitle}>{isAuthenticated ? "Logout" : "Login"}</Text>
              <Text style={styles.menuSub}>{isAuthenticated ? "Sign out of your account" : "Access your account"}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={C.muted} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      <VerifyEmailModal
        visible={showVerifyModal}
        email={user?.email}
        onClose={() => setShowVerifyModal(false)}
        onVerified={() => setShowVerifyModal(false)}
      />
    </View>
  );
}

function getStyles(isDark) {
  const accentColor = C.main;
  const bg = isDark ? "#0A0A0A" : C.bg;
  const surface = isDark ? "#141414" : C.surface;
  const border = isDark ? "rgba(255,255,255,0.06)" : C.border;
  const ink = isDark ? "#F5F3F4" : C.ink;

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: bg,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingTop: TOP_INSET + 6,
      paddingBottom: 110,
    },
    headerContainer: {
      marginBottom: 20,
    },
    headerTopRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 14,
    },
    avatarWrap: {
      width: 72,
      height: 72,
      borderRadius: 36,
      position: "relative",
      backgroundColor: isDark ? surface : C.border,
    },
    avatarImage: {
      width: 72,
      height: 72,
      borderRadius: 36,
      resizeMode: "cover",
    },
    editBadge: {
      position: "absolute",
      bottom: 0,
      right: 0,
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: accentColor,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
      borderColor: bg,
    },
    topRightActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    iconCircleBtn: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: surface,
      borderWidth: 1,
      borderColor: border,
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
    },
    redBadgeDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: C.error,
      position: "absolute",
      top: 10,
      right: 10,
      borderWidth: 1.5,
      borderColor: surface,
    },
    favBadgeDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: accentColor,
      position: "absolute",
      top: 10,
      right: 10,
    },
    userNameText: {
      fontFamily: FONT_FAMILY.displayBold,
      fontSize: 22,
      color: ink,
      letterSpacing: 0.3,
      marginBottom: 4,
    },
    userSubtext: {
      fontSize: 13,
      fontFamily: "DMSans_400Regular",
      color: C.muted,
      lineHeight: 18,
      marginBottom: 14,
    },
    authButtonsRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginTop: 4,
    },
    primaryAuthBtn: {
      backgroundColor: accentColor,
      flexDirection: "row",
      ...getPlatformButtonStyle(isDark, "filled"),
      paddingHorizontal: 18,
      height: 44,
    },
    primaryAuthBtnText: {
      color: C.textLight,
      fontSize: 13.5,
      fontFamily: "Oswald_700Bold",
    },
    secondaryAuthBtn: {
      backgroundColor: surface,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 16,
      height: 44,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: border,
    },
    secondaryAuthBtnText: {
      color: C.muted,
      fontSize: 13.5,
      fontFamily: "Oswald_600SemiBold",
    },
    promoCard: {
      backgroundColor: surface,
      ...getPlatformCardStyle(isDark),
      padding: 16,
      marginBottom: 16,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    promoContentCol: {
      flex: 1,
      paddingRight: 10,
    },
    promoTagPill: {
      backgroundColor: isDark ? "rgba(10, 132, 255, 0.15)" : C.infoBg,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      alignSelf: "flex-start",
      marginBottom: 6,
    },
    promoTagText: {
      fontSize: 9.5,
      fontFamily: "Oswald_700Bold",
      color: accentColor,
      letterSpacing: 0.8,
    },
    promoTitle: {
      fontSize: 16,
      fontFamily: "Oswald_700Bold",
      color: ink,
      letterSpacing: 0.15,
      marginBottom: 4,
    },
    promoSub: {
      fontSize: 12.5,
      color: C.muted,
      lineHeight: 17,
      marginBottom: 10,
    },
    promoLinkRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    promoLinkText: {
      fontSize: 12.5,
      fontFamily: "Oswald_700Bold",
      color: accentColor,
    },
    promoIconWrap: {
      width: 52,
      height: 52,
      borderRadius: 16,
      backgroundColor: isDark ? "rgba(10, 132, 255, 0.15)" : C.infoBg,
      alignItems: "center",
      justifyContent: "center",
    },
    themeCard: {
      backgroundColor: surface,
      ...getPlatformCardStyle(isDark),
      padding: 14,
      marginBottom: 16,
    },
    themeCardHeader: {
      fontSize: 10,
      fontFamily: "Oswald_700Bold",
      color: C.muted,
      letterSpacing: 1,
      marginBottom: 10,
    },
    themeSegmentRow: {
      flexDirection: "row",
      backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "#F0EEEF",
      borderRadius: 10,
      padding: 3,
    },
    themeTab: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 8,
      borderRadius: 10,
      gap: 6,
    },
    themeTabActive: {
      backgroundColor: accentColor,
      shadowColor: accentColor,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 2,
    },
    themeTabLabel: {
      fontSize: 12,
      fontFamily: "Oswald_600SemiBold",
      color: C.muted,
    },
    themeTabLabelActive: {
      color: C.textLight,
      fontFamily: "Oswald_700Bold",
    },
    menuGroup: {
      gap: 10,
    },
    menuCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: surface,
      ...getPlatformCardStyle(isDark),
      padding: 14,
    },
    menuIconBox: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 14,
    },
    menuTextCol: {
      flex: 1,
    },
    menuTitle: {
      fontSize: 14.5,
      fontFamily: "Oswald_600SemiBold",
      color: ink,
      marginBottom: 2,
    },
    menuSub: {
      fontSize: 12,
      fontFamily: "DMSans_400Regular",
      color: C.muted,
    },
  });
}
