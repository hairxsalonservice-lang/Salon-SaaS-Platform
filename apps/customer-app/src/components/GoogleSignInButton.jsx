// src/components/GoogleSignInButton.jsx
import React from "react";
import { View, StyleSheet, Text, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import SpringTouchable from "./SpringTouchable";
import { C, R } from "../theme";

export default function GoogleSignInButton({ onPress, loading = false, disabled = false, variant = "full" }) {
  const { isDark } = useTheme();

  if (variant === "circle") {
    return (
      <SpringTouchable
        style={[
          styles.circleBtn,
          isDark ? styles.googleBtnDark : styles.googleBtnLight,
          disabled && { opacity: 0.6 },
        ]}
        onPress={onPress}
        disabled={disabled || loading}
        scaleTo={0.92}
        hapticType="medium"
      >
        {loading ? (
          <ActivityIndicator color={C.ink} size="small" />
        ) : (
          <Ionicons name="logo-google" size={24} color={C.error} />
        )}
      </SpringTouchable>
    );
  }

  return (
    <SpringTouchable
      style={[
        styles.googleBtn,
        isDark ? styles.googleBtnDark : styles.googleBtnLight,
        disabled && { opacity: 0.6 },
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      scaleTo={0.96}
      hapticType="medium"
    >
      {loading ? (
        <ActivityIndicator color={C.ink} size="small" />
      ) : (
        <View style={styles.contentRow}>
          <Ionicons name="logo-google" size={20} color={C.error} style={{ marginRight: 12 }} />
          <Text style={[styles.btnText, { color: C.ink }]}>
            Continue with Google
          </Text>
        </View>
      )}
    </SpringTouchable>
  );
}

const styles = StyleSheet.create({
  circleBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
  },
  googleBtn: {
    height: 54,
    borderRadius: R.md,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
    paddingHorizontal: 20,
    borderWidth: 1.5,
  },
  googleBtnLight: {
    backgroundColor: C.textLight,
    borderColor: C.border,
    shadowColor: C.ink,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  googleBtnDark: {
    backgroundColor: C.surface,
    borderColor: C.lifted,
    shadowColor: C.ink,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: {
    fontSize: 16,
    fontFamily: "Oswald_700Bold",
    letterSpacing: 0.1,
  },
});
