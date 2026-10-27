// src/components/ComboServiceModal.jsx
import React, { memo, useMemo } from "react";
import {
  View,
  Text,
  Modal,
  Image,
  ScrollView,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { C, S, FS, FW, R, FONT_FAMILY } from "../theme";
import { useTheme } from "../context/ThemeContext";
import { paiseToINR } from "../services/apiClient";
import AppleTouchable from "./AppleTouchable";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const DEFAULT_COMBO_IMAGE =
  "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=800&auto=format&fit=crop";

const DEFAULT_INCLUDED_SERVICES = [
  "Hairstyling",
  "Nail",
  "Hair color",
  "Body Glowing",
  "Facial",
  "Spa",
  "Eyebrows",
  "Make up",
  "Retouch",
  "Corner Lashes",
];

function ComboServiceModal({
  visible,
  service,
  onClose,
  onSelectService,
  isSelected = false,
}) {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => getStyles(theme, isDark, insets), [theme, isDark, insets]);

  if (!service) return null;

  const coverImage =
    service.imageUrl || service.image || service.photoUrl || DEFAULT_COMBO_IMAGE;

  const includedList =
    Array.isArray(service.includedServices) && service.includedServices.length > 0
      ? service.includedServices
      : DEFAULT_INCLUDED_SERVICES;

  // Only what the salon actually set — no invented offers, deadlines, copy or durations
  const offerTag = service.packageOfferTag || service.offerTag || null;

  const description = service.description || null;

  const durationMins = service.durationMinutes || service.duration || null;

  const handleToggleSelect = () => {
    if (onSelectService) {
      onSelectService(service);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdropTouchArea} />
        </TouchableWithoutFeedback>

        <View style={styles.sheetContainer}>
          {/* Top Grabber Handle */}
          <View style={styles.handleContainer}>
            <View style={styles.handleBar} />
          </View>

          {/* Close Button */}
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.7}
          >
            <Ionicons
              name="close"
              size={20}
              color={isDark ? C.border : C.muted}
            />
          </TouchableOpacity>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            bounces={true}
          >
            {/* Banner Image */}
            <View style={styles.imageCard}>
              <Image
                source={{ uri: coverImage }}
                style={styles.bannerImage}
                resizeMode="cover"
              />
              <View style={styles.comboBadgePill}>
                <Text style={styles.comboBadgeText}>✦ ALL-IN-ONE COMBO</Text>
              </View>
            </View>

            {/* Title & Offer Subtitle */}
            <View style={styles.headerBlock}>
              <Text style={styles.titleText}>{service.name}</Text>
              {offerTag ? (
                <Text style={styles.offerSubtitleText}>{offerTag}</Text>
              ) : null}
            </View>

            {/* Description Text */}
            {description ? <Text style={styles.descriptionText}>{description}</Text> : null}

            {/* Included Services Checklist */}
            <View style={styles.servicesSection}>
              <Text style={styles.servicesHeading}>Service</Text>

              <View style={styles.checklistGrid}>
                {includedList.map((item, index) => {
                  const label = typeof item === "string" ? item : item?.name || String(item);
                  return (
                    <View key={index} style={styles.checklistItem}>
                      <View style={styles.checkIconWrap}>
                        <Ionicons
                          name="checkmark"
                          size={15}
                          color={C.success}
                          style={styles.checkIcon}
                        />
                      </View>
                      <Text style={styles.checklistLabel} numberOfLines={1}>
                        {label}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </ScrollView>

          {/* Bottom Action / Price Bar */}
          <View style={styles.bottomBar}>
            <View style={styles.priceMetaCol}>
              <Text style={styles.priceLabel}>TOTAL PACKAGE PRICE</Text>
              <View style={styles.priceRow}>
                <Text style={styles.priceValue}>
                  {paiseToINR(service.price)}
                </Text>
                {durationMins ? (
                  <Text style={styles.durationValue}>
                    • {durationMins} mins
                  </Text>
                ) : null}
              </View>
            </View>

            <AppleTouchable
              style={[
                styles.actionBtn,
                isSelected && styles.actionBtnSelected,
              ]}
              onPress={handleToggleSelect}
              scaleTo={0.94}
              hapticType="medium"
            >
              <Ionicons
                name={isSelected ? "checkmark-circle" : "add-circle"}
                size={18}
                color={C.textLight}
                style={{ marginRight: 6 }}
              />
              <Text style={styles.actionBtnText}>
                {isSelected ? "Added to Booking" : "Select Package"}
              </Text>
            </AppleTouchable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default memo(ComboServiceModal);

function getStyles(theme, isDark, insets) {
  const bottomPadding = Math.max(insets.bottom, 16);

  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.62)",
      justifyContent: "flex-end",
    },
    backdropTouchArea: {
      flex: 1,
    },
    sheetContainer: {
      backgroundColor: C.surface,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      maxHeight: SCREEN_HEIGHT * 0.88,
      paddingTop: 10,
      shadowColor: C.ink,
      shadowOffset: { width: 0, height: -6 },
      shadowOpacity: 0.25,
      shadowRadius: 16,
      elevation: 24,
    },
    handleContainer: {
      alignItems: "center",
      paddingVertical: 6,
    },
    handleBar: {
      width: 44,
      height: 4.5,
      borderRadius: 3,
      backgroundColor: isDark ? C.borderDark : C.border,
    },
    closeBtn: {
      position: "absolute",
      top: 14,
      right: 18,
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: isDark ? C.surface : C.border,
      alignItems: "center",
      justifyContent: "center",
      zIndex: 10,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingTop: 6,
      paddingBottom: 24,
    },
    imageCard: {
      width: "100%",
      height: 185,
      borderRadius: 20,
      overflow: "hidden",
      backgroundColor: isDark ? "#222" : C.border,
      marginBottom: 16,
      position: "relative",
    },
    bannerImage: {
      width: "100%",
      height: "100%",
    },
    comboBadgePill: {
      position: "absolute",
      top: 12,
      left: 12,
      backgroundColor: "rgba(15, 15, 13, 0.82)",
      paddingHorizontal: 10,
      paddingVertical: 4.5,
      borderRadius: R.pill,
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.22)",
    },
    comboBadgeText: {
      color: C.warning,
      fontSize: 10,
      fontFamily: "Oswald_700Bold",
      letterSpacing: 0.6,
    },
    headerBlock: {
      marginBottom: 10,
    },
    titleText: {
      fontFamily: FONT_FAMILY.serif,
      fontSize: 21,
      fontFamily: "Oswald_700Bold",
      color: isDark ? C.lifted : C.ink,
      lineHeight: 26,
      marginBottom: 4,
    },
    offerSubtitleText: {
      fontSize: 12,
      fontFamily: "Oswald_600SemiBold",
      color: C.muted,
      letterSpacing: 0.2,
    },
    descriptionText: {
      fontSize: 13,
      lineHeight: 20,
      color: isDark ? C.border : C.muted,
      marginBottom: 20,
    },
    servicesSection: {
      marginBottom: 10,
    },
    servicesHeading: {
      fontSize: 16,
      fontFamily: "Oswald_700Bold",
      color: isDark ? C.lifted : C.ink,
      marginBottom: 14,
    },
    checklistGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      rowGap: 12,
    },
    checklistItem: {
      width: "50%",
      flexDirection: "row",
      alignItems: "center",
      paddingRight: 8,
    },
    checkIconWrap: {
      width: 20,
      height: 20,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 8,
    },
    checkIcon: {
      fontFamily: "Oswald_700Bold",
    },
    checklistLabel: {
      fontSize: 13.5,
      fontFamily: "Oswald_600SemiBold",
      color: isDark ? C.border : C.textSecondary,
      flex: 1,
    },
    bottomBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingTop: 14,
      paddingBottom: bottomPadding,
      borderTopWidth: 1,
      borderTopColor: isDark ? C.surface : C.lifted,
      backgroundColor: C.surface,
    },
    priceMetaCol: {
      flex: 1,
    },
    priceLabel: {
      fontSize: 9.5,
      fontFamily: "Oswald_700Bold",
      color: C.muted,
      letterSpacing: 0.8,
      marginBottom: 2,
    },
    priceRow: {
      flexDirection: "row",
      alignItems: "baseline",
      gap: 6,
    },
    priceValue: {
      fontSize: 18,
      fontFamily: "Oswald_700Bold",
      color: C.ink,
    },
    durationValue: {
      fontSize: 12,
      fontFamily: "Oswald_600SemiBold",
      color: isDark ? C.muted : C.muted,
    },
    actionBtn: {
      backgroundColor: C.blue || C.info,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 18,
      paddingVertical: 12,
      borderRadius: R.button,
      shadowColor: C.blue || C.info,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 6,
      elevation: 3,
    },
    actionBtnSelected: {
      backgroundColor: C.success,
      shadowColor: C.success,
    },
    actionBtnText: {
      color: C.textLight,
      fontSize: 13.5,
      fontFamily: "Oswald_700Bold",
    },
  });
}
