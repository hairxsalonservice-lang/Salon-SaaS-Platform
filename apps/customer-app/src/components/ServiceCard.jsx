// src/components/ServiceCard.jsx
import React, { memo, useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C, FF } from "../theme";
import { useTheme } from "../context/ThemeContext";
import { paiseToINR } from "../services/apiClient";

function ServiceCard({ service, selected, onSelect, onViewCombo }) {
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => getStyles(theme, isDark), [theme, isDark]);
  const duration = service.durationMinutes || service.duration || 30;
  const isCombo =
    service.category?.toLowerCase() === "combo" ||
    Boolean(service.includedServices && service.includedServices.length > 0);

  const handleCardPress = () => {
    if (isCombo && onViewCombo) {
      onViewCombo(service);
    } else if (onSelect) {
      onSelect(service);
    }
  };

  const buttonLabel = isCombo ? (selected ? "Added" : "View") : selected ? "Added" : "Add";
  const accessibilityAction = isCombo
    ? "Opens combo details"
    : selected
      ? "Remove service"
      : "Add service";

  return (
    <TouchableOpacity
      style={[styles.card, selected && styles.cardSelected]}
      onPress={handleCardPress}
      activeOpacity={0.9}
      accessibilityRole="button"
      accessibilityLabel={`${service.name}, ${paiseToINR(service.price)}, ${duration} minutes. ${accessibilityAction}`}
    >
      <View style={styles.infoCol}>
        <Text style={styles.name} numberOfLines={2}>
          {service.name}
        </Text>

        <View style={styles.metaRow}>
          <Text style={styles.price}>{paiseToINR(service.price)}</Text>
          <View style={styles.dotSeparator} />
          <Ionicons name="time-outline" size={11} color={theme.muted} />
          <Text style={styles.durationText}>{duration} mins</Text>
        </View>

        {service.description ? (
          <Text style={styles.description} numberOfLines={2}>
            {service.description}
          </Text>
        ) : null}
      </View>

      <View
        style={[styles.addBtn, selected ? styles.addBtnSelected : styles.addBtnDefault]}
        pointerEvents="none"
      >
        {selected ? (
          <Ionicons name="checkmark" size={11} color={theme.primary} />
        ) : null}
        <Text style={[styles.addBtnText, selected ? styles.addBtnTextSelected : styles.addBtnTextDefault]}>
          {buttonLabel}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default memo(ServiceCard);

function getStyles(theme, isDark) {
  return StyleSheet.create({
    card: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
      paddingTop: 13,
      paddingHorizontal: 13,
      paddingBottom: 13,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.hairline,
      backgroundColor: theme.surface,
    },
    cardSelected: {
      backgroundColor: isDark ? "rgba(255,122,154,0.06)" : "rgba(255,96,130,0.05)",
      borderColor: isDark ? "rgba(255,122,154,0.35)" : "rgba(255,96,130,0.25)",
    },
    infoCol: {
      flex: 1,
      minWidth: 0,
    },
    name: {
      fontSize: 15.5,
      lineHeight: 22,
      fontFamily: FF.display,
      color: theme.ink,
      letterSpacing: 0.1,
    },
    metaRow: {
      marginTop: 4,
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
    },
    price: {
      fontSize: 15,
      fontFamily: FF.display,
      color: theme.primaryActive,
      letterSpacing: 0.1,
    },
    dotSeparator: {
      width: 3,
      height: 3,
      borderRadius: 2,
      backgroundColor: isDark ? C.muted : C.border,
    },
    durationText: {
      fontSize: 12.5,
      fontFamily: FF.body,
      color: theme.muted,
    },
    description: {
      marginTop: 5,
      fontSize: 12.5,
      lineHeight: 18,
      fontFamily: FF.body,
      color: theme.muted,
    },
    addBtn: {
      flexGrow: 0,
      flexShrink: 0,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 3,
      height: 30,
      minWidth: 58,
      paddingHorizontal: 10,
      marginTop: 1,
      borderRadius: 8,
      borderWidth: 1,
    },
    addBtnDefault: {
      backgroundColor: "transparent",
      borderColor: isDark ? "rgba(255,122,154,0.3)" : "rgba(255,96,130,0.3)",
    },
    addBtnSelected: {
      backgroundColor: isDark ? "rgba(255,122,154,0.15)" : "rgba(255,96,130,0.1)",
      borderColor: isDark ? "rgba(255,122,154,0.4)" : "rgba(255,96,130,0.35)",
    },
    addBtnText: {
      fontSize: 13,
      fontFamily: FF.display,
    },
    addBtnTextDefault: {
      color: theme.primaryActive,
    },
    addBtnTextSelected: {
      color: theme.primary,
    },
  });
}
