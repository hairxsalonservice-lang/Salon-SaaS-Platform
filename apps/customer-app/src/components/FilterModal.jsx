// src/components/FilterModal.jsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import AppleBottomSheet from "./AppleBottomSheet";
import AppleTouchable from "./AppleTouchable";
import { C } from "../theme";

const RATING_OPTIONS = [
  { id: "all", label: "Any Rating" },
  { id: "4.0", label: "4.0+ ★" },
  { id: "4.5", label: "4.5+ ★ (Top Rated)" },
  { id: "4.8", label: "4.8+ ★ (Premier)" },
];

const PRICE_OPTIONS = [
  { id: "all", label: "All Prices" },
  { id: "budget", label: "₹ Budget (< ₹500)" },
  { id: "moderate", label: "₹₹ Moderate (₹500-₹1500)" },
  { id: "luxury", label: "₹₹₹ Luxury (₹1500+)" },
];

const SORT_OPTIONS = [
  { id: "recommended", label: "Recommended" },
  { id: "rating", label: "Highest Rated" },
  { id: "price_low", label: "Price: Low to High" },
  { id: "price_high", label: "Price: High to Low" },
];

const SERVICE_OPTIONS = [
  { id: "all", label: "All Services", icon: "sparkles-outline" },
  { id: "hair", label: "Hair Care & Cut", icon: "cut-outline" },
  { id: "facial", label: "Facials & Skin", icon: "water-outline" },
  { id: "makeup", label: "Bridal & Makeup", icon: "rose-outline" },
];

export default function FilterModal({
  visible,
  filters = {},
  onApplyFilters,
  onClose,
}) {
  const { theme, isDark } = useTheme();
  const styles = getStyles(theme, isDark);

  const [minRating, setMinRating] = useState(filters.minRating || "all");
  const [priceRange, setPriceRange] = useState(filters.priceRange || "all");
  const [sortBy, setSortBy] = useState(filters.sortBy || "recommended");
  const [serviceType, setServiceType] = useState(filters.serviceType || "all");

  useEffect(() => {
    if (visible) {
      setMinRating(filters.minRating || "all");
      setPriceRange(filters.priceRange || "all");
      setSortBy(filters.sortBy || "recommended");
      setServiceType(filters.serviceType || "all");
    }
  }, [visible, filters]);

  const activeCount = [
    minRating !== "all",
    priceRange !== "all",
    sortBy !== "recommended",
    serviceType !== "all",
  ].filter(Boolean).length;

  const handleReset = () => {
    setMinRating("all");
    setPriceRange("all");
    setSortBy("recommended");
    setServiceType("all");
  };

  const handleApply = () => {
    if (onApplyFilters) {
      onApplyFilters({
        minRating,
        priceRange,
        sortBy,
        serviceType,
      });
    }
    if (onClose) onClose();
  };

  return (
    <AppleBottomSheet visible={visible} onClose={onClose} height="82%">
      <View style={styles.sheetInner}>
        {/* Sheet Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>FILTER &amp; REFINE</Text>
            <Text style={styles.title}>Refine Search</Text>
          </View>

          {activeCount > 0 && (
            <TouchableOpacity
              style={styles.resetBtn}
              onPress={handleReset}
              activeOpacity={0.7}
            >
              <Text style={styles.resetBtnText}>Reset All</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={20} color={C.ink} />
          </TouchableOpacity>
        </View>

        {/* Filter Options Content */}
        <ScrollView
          style={styles.scrollBody}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* 1. Sort By */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>SORT BY</Text>
            <View style={styles.chipGrid}>
              {SORT_OPTIONS.map((opt) => {
                const isSelected = sortBy === opt.id;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    style={[
                      styles.chip,
                      isSelected ? styles.chipSelected : styles.chipUnselected,
                    ]}
                    onPress={() => setSortBy(opt.id)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        isSelected ? styles.chipTextSelected : styles.chipTextUnselected,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* 2. Minimum Rating */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>MINIMUM RATING</Text>
            <View style={styles.chipGrid}>
              {RATING_OPTIONS.map((opt) => {
                const isSelected = minRating === opt.id;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    style={[
                      styles.chip,
                      isSelected ? styles.chipSelected : styles.chipUnselected,
                    ]}
                    onPress={() => setMinRating(opt.id)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        isSelected ? styles.chipTextSelected : styles.chipTextUnselected,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* 3. Price Range */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>PRICE RANGE</Text>
            <View style={styles.chipGrid}>
              {PRICE_OPTIONS.map((opt) => {
                const isSelected = priceRange === opt.id;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    style={[
                      styles.chip,
                      isSelected ? styles.chipSelected : styles.chipUnselected,
                    ]}
                    onPress={() => setPriceRange(opt.id)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        isSelected ? styles.chipTextSelected : styles.chipTextUnselected,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* 4. Services */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>SERVICES &amp; SPECIALTY</Text>
            <View style={styles.chipGrid}>
              {SERVICE_OPTIONS.map((opt) => {
                const isSelected = serviceType === opt.id;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    style={[
                      styles.chip,
                      isSelected ? styles.chipSelected : styles.chipUnselected,
                    ]}
                    onPress={() => setServiceType(opt.id)}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={opt.icon}
                      size={14}
                      color={isSelected ? C.textLight : theme.primary}
                      style={{ marginRight: 6 }}
                    />
                    <Text
                      style={[
                        styles.chipText,
                        isSelected ? styles.chipTextSelected : styles.chipTextUnselected,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </ScrollView>

        {/* Bottom Apply Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.applyBtn}
            onPress={handleApply}
            activeOpacity={0.88}
          >
            <Ionicons name="checkmark-circle" size={20} color={C.textLight} style={{ marginRight: 8 }} />
            <Text style={styles.applyBtnText}>
              Apply Filters {activeCount > 0 ? `(${activeCount})` : ""}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </AppleBottomSheet>
  );
}

function getStyles(theme, isDark) {
  const primaryColor = theme?.primary || C.main;
  return StyleSheet.create({
    sheetInner: {
      flex: 1,
      backgroundColor: C.surface,
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: Platform.OS === "ios" ? 28 : 16,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingBottom: 16,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: isDark ? C.border : C.border,
    },
    eyebrow: {
      fontSize: 10,
      fontFamily: "Oswald_700Bold",
      color: primaryColor,
      letterSpacing: 1.2,
      marginBottom: 2,
    },
    title: {
      fontSize: 22,
      fontFamily: "Oswald_700Bold",
      color: C.ink,
      letterSpacing: 0.15,
    },
    resetBtn: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      marginRight: 8,
      backgroundColor: isDark ? "rgba(212, 155, 69, 0.15)" : "rgba(196, 139, 54, 0.08)",
      borderRadius: 12,
    },
    resetBtnText: {
      fontSize: 12,
      fontFamily: "Oswald_700Bold",
      color: primaryColor,
    },
    closeBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: C.border,
      alignItems: "center",
      justifyContent: "center",
    },
    scrollBody: {
      flex: 1,
    },
    scrollContent: {
      paddingVertical: 16,
      gap: 20,
    },
    section: {
      gap: 8,
    },
    sectionTitle: {
      fontSize: 10,
      fontFamily: "Oswald_700Bold",
      color: isDark ? C.muted : C.muted,
      letterSpacing: 1,
      marginBottom: 4,
    },
    chipGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    chip: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 20,
    },
    chipSelected: {
      backgroundColor: primaryColor,
      shadowColor: primaryColor,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.3,
      shadowRadius: 6,
      elevation: 3,
    },
    chipUnselected: {
      backgroundColor: isDark ? C.surface : C.lifted,
      borderWidth: 1,
      borderColor: isDark ? C.surface : C.border,
    },
    chipText: {
      fontSize: 13,
    },
    chipTextSelected: {
      color: C.textLight,
      fontFamily: "Oswald_700Bold",
    },
    chipTextUnselected: {
      color: isDark ? C.border : C.surface,
      fontFamily: "Oswald_600SemiBold",
    },
    footer: {
      paddingTop: 12,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: isDark ? C.border : C.border,
    },
    applyBtn: {
      backgroundColor: primaryColor,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      height: 50,
      borderRadius: 16,
      shadowColor: primaryColor,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 10,
      elevation: 4,
    },
    applyBtnText: {
      color: C.textLight,
      fontSize: 15,
      fontFamily: "Oswald_700Bold",
      letterSpacing: 0.2,
    },
  });
}
