// src/components/CategoryAccordionList.jsx
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  LayoutAnimation,
  Platform,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C } from "../theme";
import { useTheme } from "../context/ThemeContext";
import { paiseToINR } from "../services/apiClient";
import SpringTouchable from "./SpringTouchable";

export default function CategoryAccordionList({
  services = [],
  selectedServices = [],
  onSelectService,
  onViewComboService,
}) {
  const { theme, isDark } = useTheme();
  const styles = getStyles(theme, isDark);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");

  const filteredServices = React.useMemo(() => {
    if (!searchQuery.trim()) return services;
    const query = searchQuery.toLowerCase().trim();
    return services.filter(
      (s) =>
        s.name?.toLowerCase().includes(query) ||
        s.description?.toLowerCase().includes(query) ||
        s.category?.toLowerCase().includes(query)
    );
  }, [services, searchQuery]);

  // Group services by category
  const groupedCategories = React.useMemo(() => {
    const groups = {};
    filteredServices.forEach((s) => {
      const cat = (s.category || "General").trim();
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(s);
    });
    return Object.keys(groups).map((catName) => ({
      name: catName,
      items: groups[catName],
    }));
  }, [filteredServices]);

  // Keep track of expanded category name (default: first category expanded)
  const [expandedCat, setExpandedCat] = useState(
    groupedCategories.length > 0 ? groupedCategories[0].name : null
  );

  const toggleCategory = (catName) => {
    try {
      LayoutAnimation.configureNext(
        LayoutAnimation.create(
          220,
          LayoutAnimation.Types.easeInEaseOut,
          LayoutAnimation.Properties.opacity
        )
      );
    } catch (e) { }
    setExpandedCat((prev) => (prev === catName ? null : catName));
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      {services.length > 0 && (
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color={isDark ? C.muted : C.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for a service..."
            placeholderTextColor={isDark ? C.muted : C.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close-circle" size={16} color={isDark ? C.muted : C.muted} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {groupedCategories.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>
            {searchQuery.trim() ? "No matching services found." : "No services available at this time."}
          </Text>
        </View>
      ) : (
        groupedCategories.map((group) => {
        const isExpanded = expandedCat === group.name;
        const count = group.items.length;
        const isComboGroup = group.name.toLowerCase().includes("combo") || group.name.toLowerCase().includes("package");

        // Find if any service in this category is currently selected by customer
        const selectedInGroup = group.items.find((item) =>
          selectedServices.some(
            (sel) => (sel._id || sel.id) === (item._id || item.id)
          )
        );

        return (
          <View
            key={group.name}
            style={[
              styles.groupCardWrapper,
              (isExpanded || selectedInGroup) && styles.groupCardWrapperActive,
            ]}
          >
            {/* Category Accordion Header Capsule */}
            <TouchableOpacity
              style={[
                styles.accordionHeader,
                isExpanded && styles.accordionHeaderExpanded,
              ]}
              onPress={() => toggleCategory(group.name)}
              activeOpacity={0.88}
            >
              {/* Left: Category Name */}
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Text
                  style={[
                    styles.categoryTitle,
                    (isExpanded || selectedInGroup) && styles.categoryTitleActive,
                  ]}
                >
                  {group.name}
                </Text>
                {isComboGroup && (
                  <View style={styles.comboHeaderPill}>
                    <Text style={styles.comboHeaderPillText}>✦ Bundle</Text>
                  </View>
                )}
              </View>

              {/* Right: Selected Sub-service Name + Price OR Count + Chevron */}
              <View style={styles.headerRightRow}>
                {selectedInGroup ? (
                  <View style={styles.selectedMetaCol}>
                    <Text style={styles.selectedSubName} numberOfLines={1}>
                      {selectedInGroup.name}
                    </Text>
                    <Text style={styles.selectedPriceText}>
                      +{paiseToINR(selectedInGroup.price)}
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.countText}>
                    {count} {count === 1 ? "type" : "types"}
                  </Text>
                )}

                <Ionicons
                  name={isExpanded ? "chevron-up" : "chevron-down"}
                  size={18}
                  color={
                    isExpanded || selectedInGroup
                      ? C.main
                      : C.muted
                  }
                  style={{ marginLeft: 6 }}
                />
              </View>
            </TouchableOpacity>

            {/* Sub-Services Content */}
            {isExpanded && (
              <View style={styles.expandedContent}>
                {group.items.map((service, index) => {
                  const serviceId = service._id || service.id;
                  const isSelected = selectedServices.some(
                    (s) => (s._id || s.id) === serviceId
                  );
                  const isLast = index === group.items.length - 1;
                  const isCombo =
                    service.category?.toLowerCase() === "combo" ||
                    isComboGroup ||
                    Boolean(service.includedServices && service.includedServices.length > 0);

                  return (
                    <TouchableOpacity
                      key={serviceId}
                      style={[
                        styles.serviceRow,
                        isLast && styles.serviceRowLast,
                        isCombo && styles.comboServiceRow,
                      ]}
                      onPress={() => {
                        if (isCombo && onViewComboService) {
                          onViewComboService(service);
                        } else {
                          onSelectService?.(service);
                        }
                      }}
                      activeOpacity={0.88}
                    >
                      <View style={styles.serviceInfo}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 }}>
                          <Text style={styles.serviceName}>{service.name}</Text>
                          {/* {isCombo && (
                            <View style={styles.comboItemTag}>
                              <Text style={styles.comboItemTagText}>View Details ↗</Text>
                            </View>
                          )} */}
                        </View>
                        <Text style={styles.serviceMeta}>
                          {service.durationMinutes || service.duration || 30} mins
                          {/* {service.packageOfferTag
                            ? ` • ${service.packageOfferTag}`
                            : service.description
                              ? ` • ${service.description}`
                              : ""} */}
                        </Text>
                      </View>

                      <View style={styles.serviceRight}>
                        <Text style={styles.servicePrice}>
                          {paiseToINR(service.price)}
                        </Text>

                        <SpringTouchable
                          style={[
                            styles.selectBtn,
                            isSelected && styles.selectBtnActive,
                          ]}
                          onPress={() => onSelectService?.(service)}
                          scaleTo={0.92}
                          hapticType="light"
                        >
                          <Ionicons
                            name={isSelected ? "checkmark" : "add"}
                            size={16}
                            color={isSelected ? C.textLight : C.main}
                          />
                        </SpringTouchable>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        );
      })
      )}
    </View>
  );
}

function getStyles(theme, isDark) {
  const accentColor = C.main;

  return StyleSheet.create({
    container: {
      gap: 12,
    },
    searchContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: C.surface,
      borderRadius: 16,
      paddingHorizontal: 16,
      height: 48,
      marginBottom: 4,
    },
    searchInput: {
      flex: 1,
      marginLeft: 10,
      fontSize: 15,
      color: isDark ? C.textLight : C.surface,
    },
    groupCardWrapper: {
      borderRadius: 20,
      backgroundColor: C.surface,
      borderWidth: 1.5,
      borderColor: "transparent",
      overflow: "hidden",
    },
    groupCardWrapperActive: {
      backgroundColor: C.surface,
      borderColor: accentColor,
      shadowColor: accentColor,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    },
    accordionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      height: 56,
    },
    accordionHeaderExpanded: {
      borderBottomWidth: 1,
      borderBottomColor: isDark ? C.lifted : C.border,
    },
    categoryTitle: {
      fontSize: 16,
      fontFamily: "Oswald_600SemiBold",
      color: C.muted,
    },
    categoryTitleActive: {
      color: accentColor,
      fontFamily: "Oswald_700Bold",
    },
    headerRightRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    countText: {
      fontSize: 14,
      fontFamily: "Oswald_700Bold",
      color: isDark ? C.border : C.ink,
    },
    selectedMetaCol: {
      alignItems: "flex-end",
    },
    selectedSubName: {
      fontSize: 13,
      fontFamily: "Oswald_700Bold",
      color: C.ink,
      maxWidth: 140,
    },
    selectedPriceText: {
      fontSize: 12,
      fontFamily: "Oswald_700Bold",
      color: accentColor,
      marginTop: 1,
    },
    expandedContent: {
      backgroundColor: C.surface,
      paddingHorizontal: 18,
      paddingVertical: 8,
    },
    serviceRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? C.lifted : C.lifted,
    },
    serviceRowLast: {
      borderBottomWidth: 0,
    },
    serviceInfo: {
      flex: 1,
      marginRight: 12,
    },
    serviceName: {
      fontSize: 15,
      fontFamily: "Oswald_700Bold",
      color: C.ink,
      marginBottom: 2,
    },
    serviceMeta: {
      fontSize: 12,
      color: C.muted,
    },
    serviceRight: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    servicePrice: {
      fontSize: 15,
      fontFamily: "Oswald_700Bold",
      color: C.ink,
    },
    comboHeaderPill: {
      backgroundColor: isDark ? "rgba(245, 158, 11, 0.2)" : C.goldTint,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: isDark ? "rgba(245, 158, 11, 0.4)" : C.goldTint,
    },
    comboHeaderPillText: {
      fontSize: 10.5,
      fontFamily: "Oswald_700Bold",
      color: isDark ? C.warning : C.warning,
      letterSpacing: 0.2,
    },
    comboServiceRow: {
      backgroundColor: isDark ? "rgba(245, 158, 11, 0.05)" : "rgba(245, 158, 11, 0.04)",
      borderRadius: 12,
      paddingHorizontal: 8,
      marginVertical: 2,
    },
    comboItemTag: {
      backgroundColor: isDark ? "rgba(59, 130, 246, 0.2)" : C.infoBg,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: isDark ? "rgba(59, 130, 246, 0.4)" : C.infoBg,
    },
    comboItemTagText: {
      fontSize: 9.5,
      fontFamily: "Oswald_700Bold",
      color: isDark ? C.info : C.info,
    },
    selectBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: isDark ? "rgba(108, 92, 231, 0.2)" : "rgba(108, 92, 231, 0.12)",
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: accentColor,
    },
    selectBtnActive: {
      backgroundColor: accentColor,
    },
    emptyCard: {
      padding: 24,
      alignItems: "center",
      backgroundColor: C.surface,
      borderRadius: 20,
    },
    emptyText: {
      color: C.muted,
      fontSize: 14,
    },
  });
}
