// src/components/ErrorCardModal.jsx
import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C, S } from "../theme";
import { useTheme } from "../context/ThemeContext";
import SpringTouchable from "./SpringTouchable";

export default function ErrorCardModal({
  visible,
  title = "Notice",
  message,
  onClose,
  buttonText = "Got It",
}) {
  const { theme, isDark } = useTheme();
  const styles = getStyles(theme, isDark);
  if (!visible || !message) return null;

  return (
    <Modal
      visible={!!visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.cardContainer}>
              {/* Close Button Top Right */}
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={onClose}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={18} color={styles.closeIconColor.color} />
              </TouchableOpacity>

              {/* Redesigned Alert Logo / Icon Badge */}
              <View style={styles.iconWrapper}>
                <View style={styles.iconCircle}>
                  <Ionicons name="alert-circle-outline" size={34} color={C.error} />
                </View>
              </View>

              {/* Text Content */}
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.message}>{message}</Text>

              {/* Action Button */}
              <SpringTouchable
                style={styles.actionBtn}
                onPress={onClose}
                scaleTo={0.96}
                hapticType="light"
              >
                <Text style={styles.actionBtnText}>{buttonText}</Text>
              </SpringTouchable>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

function getStyles(theme, isDark) {
  const primaryAccent = C.main;

  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.65)",
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 24,
    },
    cardContainer: {
      width: "100%",
      maxWidth: 340,
      backgroundColor: C.surface,
      borderRadius: 28,
      padding: 24,
      alignItems: "center",
      borderWidth: 1,
      borderColor: isDark ? C.lifted : C.border,
      shadowColor: C.ink,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.25,
      shadowRadius: 20,
      elevation: 12,
      position: "relative",
    },
    closeBtn: {
      position: "absolute",
      top: 16,
      right: 16,
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: isDark ? C.lifted : C.border,
      justifyContent: "center",
      alignItems: "center",
      zIndex: 10,
    },
    closeIconColor: {
      color: C.mutedSoft,
    },
    iconWrapper: {
      marginBottom: 16,
      marginTop: 8,
    },
    iconCircle: {
      width: 68,
      height: 68,
      borderRadius: 34,
      backgroundColor: "rgba(239, 68, 68, 0.1)",
      borderWidth: 1.5,
      borderColor: "rgba(239, 68, 68, 0.25)",
      justifyContent: "center",
      alignItems: "center",
    },
    title: {
      fontSize: 20,
      fontFamily: "Oswald_700Bold",
      color: C.ink,
      textAlign: "center",
      marginBottom: 8,
      letterSpacing: 0.15,
    },
    message: {
      fontSize: 14,
      fontFamily: "Oswald_400Regular",
      color: C.muted,
      textAlign: "center",
      lineHeight: 20,
      marginBottom: 24,
      paddingHorizontal: 8,
    },
    actionBtn: {
      width: "100%",
      alignSelf: "stretch",
      height: 52,
      backgroundColor: primaryAccent,
      borderRadius: 26,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: primaryAccent,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 4,
    },
    actionBtnText: {
      fontSize: 16,
      fontFamily: "Oswald_700Bold",
      color: C.textLight,
      letterSpacing: 0.1,
    },
  });
}
