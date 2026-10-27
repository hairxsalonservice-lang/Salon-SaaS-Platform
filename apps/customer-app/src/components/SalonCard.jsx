import React, { memo, useCallback } from "react";
import { View, Text, Image, StyleSheet, Dimensions, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import VerifiedBadge from "./VerifiedBadge";
import { C, S, FS, FW, R, SHADOWS, FONT_FAMILY, getPlatformCardStyle } from "../theme";
import { useFavorites } from "../context/FavoritesContext";
import { useTheme } from "../context/ThemeContext";
import BouncyButton from "./BouncyButton";
import AppleTouchable from "./AppleTouchable";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const DEMO_IMAGES = [
  "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1562322140-8baeececf3df?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?q=80&w=800&auto=format&fit=crop",
];

// Area/locality is the last segment of the street, e.g. "Plot 12, KIIT Square, Patia" -> "Patia"
function getArea(address) {
  const street = address?.street;
  if (typeof street !== "string") return null;
  const parts = street.split(",").map((p) => p.trim()).filter(Boolean);
  return parts.length > 0 ? parts[parts.length - 1] : null;
}

function getLowestServicePrice(salon) {
  if (!salon) return null;

  const candidatePrices = [];

  [salon.minServicePrice, salon.startingPrice, salon.minPrice].forEach((p) => {
    if (typeof p === "number" && p > 0) {
      candidatePrices.push(p >= 1000 ? Math.round(p / 100) : Math.round(p));
    } else if (typeof p === "string" && p.trim()) {
      const parsed = parseFloat(p.replace(/[^0-9.]/g, ""));
      if (Number.isFinite(parsed) && parsed > 0) {
        candidatePrices.push(parsed >= 1000 ? Math.round(parsed / 100) : Math.round(parsed));
      }
    }
  });

  if (Array.isArray(salon.services)) {
    salon.services.forEach((s) => {
      if (typeof s?.price === "number" && s.price > 0) {
        candidatePrices.push(s.price >= 1000 ? Math.round(s.price / 100) : Math.round(s.price));
      }
    });
  }

  if (salon.serviceSummary?.priceRange?.min) {
    const parsed = parseFloat(String(salon.serviceSummary.priceRange.min).replace(/[^0-9.]/g, ""));
    if (Number.isFinite(parsed) && parsed > 0) {
      candidatePrices.push(Math.round(parsed));
    }
  }

  if (candidatePrices.length > 0) {
    return Math.min(...candidatePrices);
  }

  return null;
}

function checkIsOpen(salon) {
  if (!salon) return true;
  if (salon.isActive === false || salon.deactivatedByAdmin === true || salon.isOpen === false || salon.status === "CLOSED") {
    return false;
  }
  const workingHours = salon.workingHours || salon.branches?.[0]?.workingHours;
  if (!Array.isArray(workingHours) || workingHours.length === 0) return true;

  const now = new Date();
  const dayOfWeek = now.getDay();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const todayWorking = workingHours.find((w) => w.day === dayOfWeek);
  if (!todayWorking || todayWorking.isOpen === false) return false;

  if (todayWorking.openTime && todayWorking.closeTime) {
    const [openH, openM] = todayWorking.openTime.split(":").map(Number);
    const [closeH, closeM] = todayWorking.closeTime.split(":").map(Number);
    const openMinutes = openH * 60 + (openM || 0);
    const closeMinutes = closeH * 60 + (closeM || 0);

    if (currentMinutes < openMinutes || currentMinutes >= closeMinutes) {
      return false;
    }
  }

  return true;
}

function SalonCard({ salon, onPress, isHorizontal = false, index = 0, variant = "default" }) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const isOpen = checkIsOpen(salon);

  const ratingObj = typeof salon?.rating === "object" && salon?.rating !== null ? salon.rating : null;
  const rawAvg = typeof salon?.rating === "number"
    ? salon.rating
    : (ratingObj?.avgScore || ratingObj?.average || ratingObj?.score || salon?.avgScore || salon?.avgRating);

  const rawReviews = salon?.totalReviews ?? salon?.reviewCount ?? salon?.reviewsCount ?? ratingObj?.totalReviews ?? ratingObj?.reviewsCount ?? ratingObj?.count ?? (Array.isArray(salon?.reviews) ? salon.reviews.length : undefined);

  const numericRating = typeof rawAvg === "number" && !isNaN(rawAvg) && rawAvg > 0 ? rawAvg : 5.0;
  const ratingStr = numericRating.toFixed(1);
  const reviewsCount = typeof rawReviews === "number" ? rawReviews : 0;
  // No reviews yet → the 5.0 above is only a placeholder, so don't present it as a rating
  const isNew = reviewsCount === 0;
  const isTopRated = !isNew && numericRating >= 4.5;
  const coverImage = salon.coverImage || salon.image || DEMO_IMAGES[index % DEMO_IMAGES.length];
  const isFav = isFavorite(salon._id || salon.id);
  const isCompact = variant === "compact";

  // Salons don't carry an address themselves — it lives on their branches.
  const address = (salon.address && typeof salon.address === "object" ? salon.address : null) || salon.branches?.[0]?.address;
  const rawAddress = getArea(address) || address?.city || salon.city || "";
  // Only show a distance when one was actually calculated
  const rawDistance = salon.distance ?? salon.distanceKm ?? null;
  const distance = rawDistance == null ? null : typeof rawDistance === "number" ? `${rawDistance} km` : rawDistance;
  const lowestServicePrice = getLowestServicePrice(salon);

  const categories = salon.categories && salon.categories.length > 0
    ? salon.categories
    : ["Haircut", "Facial", "Hair Spa", "Beard Styling"];

  const displayTags = categories.slice(0, 4);
  const extraCount = categories.length > 4 ? categories.length - 4 : (index === 0 ? 3 : index === 1 ? 2 : 0);

  const handlePress = useCallback(() => {
    if (onPress) onPress(salon);
  }, [salon, onPress]);

  const handleFavPress = useCallback(
    (e) => {
      e?.stopPropagation && e.stopPropagation();
      toggleFavorite(salon);
    },
    [toggleFavorite, salon]
  );

  const { theme, isDark } = useTheme();
  const styles = getStyles(theme, isDark);

  if (isCompact) {
    return (
      <BouncyButton
        style={styles.compactCard}
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={`View ${salon.name}`}
      >
        <View style={styles.compactImageWrap}>
          <Image source={{ uri: coverImage }} style={styles.compactImage} resizeMode="cover" />
          {lowestServicePrice !== null ? (
            <View style={styles.pricePill}>
              <Text style={styles.pricePillIcon}>✦</Text>
              <Text style={styles.pricePillText}>₹{lowestServicePrice}</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.compactInfo}>
          <Text style={styles.compactName} numberOfLines={1}>{salon.name}</Text>
          <Text style={styles.compactAddress} numberOfLines={1}>{rawAddress}</Text>
          <View style={styles.compactMeta}>
            {isNew ? (
              <Text style={styles.distanceText}>New</Text>
            ) : (
              <View style={styles.stars}>
                {[0, 1, 2, 3, 4].map((star) => (
                  <Ionicons
                    key={star}
                    name={star < Math.round(numericRating) ? "star" : "star-outline"}
                    size={10}
                    color="#FF9500"
                  />
                ))}
              </View>
            )}
            {distance ? (
              <View style={styles.distance}>
                <Ionicons name="location-outline" size={11} color={isDark ? "#A1A1AA" : "#71717A"} />
                <Text style={styles.distanceText}>{distance}</Text>
              </View>
            ) : null}
          </View>
        </View>
      </BouncyButton>
    );
  }

  return (
    <BouncyButton
      style={[styles.card, isHorizontal ? styles.horizontal : styles.full]}
      onPress={handlePress}
      activeOpacity={0.95}
    >
      {/* Image container */}
      <View style={styles.imageFrame}>
        <Image source={{ uri: coverImage }} style={styles.image} resizeMode="cover" />

        {/* Top-Left Rating Badge Pill */}
        <View style={styles.ratingBadge}>
          <Ionicons name="star" size={12} color="#FFD700" style={{ marginRight: 4 }} />
          <Text style={styles.ratingBadgeText}>
            {isNew ? "New" : <>{ratingStr} <Text style={styles.reviewsText}>({reviewsCount})</Text></>}
          </Text>
        </View>

        {/* Favorite Heart Button */}
        <AppleTouchable style={styles.favBtn} onPress={handleFavPress} scaleTo={0.88} hapticType="medium">
          <Ionicons
            name={isFav ? "heart" : "heart-outline"}
            size={18}
            color={isFav ? "#FF3B30" : "#18181B"}
          />
        </AppleTouchable>

        {/* Guest Favourite Badge Pill — Bottom-Right of Image */}
        {isTopRated ? (
          <View style={styles.guestFavBadge}>
            <Ionicons name="sparkles" size={12} color="#FFD700" style={{ marginRight: 4 }} />
            <Text style={styles.guestFavText}>Guest Favourite</Text>
          </View>
        ) : null}
      </View>

      {/* Info Content */}
      <View style={styles.info}>
        {/* Title & Distance Row */}
        <View style={styles.titleRow}>
          <Text style={styles.name} numberOfLines={1}>{salon.name}</Text>
          {distance ? (
            <View style={styles.distanceBadge}>
              <Ionicons name="location-sharp" size={12} color={isDark ? "#A1A1AA" : "#71717A"} style={{ marginRight: 2 }} />
              <Text style={styles.distanceText}>{distance}</Text>
              <Ionicons name="navigate-outline" size={11} color={isDark ? "#A1A1AA" : "#71717A"} style={{ marginLeft: 3 }} />
            </View>
          ) : null}
        </View>

        {/* Location & Status Single Row Side-by-Side */}
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={13} color={isDark ? "#A1A1AA" : "#71717A"} style={{ marginRight: 4 }} />
          <Text style={styles.locationText} numberOfLines={1}>{rawAddress}</Text>
          <Text style={[styles.statusStatusText, { color: isOpen ? "#16A34A" : "#DC2626" }]}>
            {" · "}{isOpen ? "Open" : "Closed"}
          </Text>
        </View>

        {/* Service Tag Pills */}
        {/* <View style={styles.tagsRow}>
          {displayTags.map((tag, idx) => (
            <View key={idx} style={styles.tagPill}>
              <Text style={styles.tagText}>{typeof tag === "object" ? tag.name : tag}</Text>
            </View>
          ))}
          {extraCount > 0 ? (
            <View style={[styles.tagPill, styles.extraTagPill]}>
              <Text style={styles.tagText}>+{extraCount}</Text>
            </View>
          ) : null}
        </View> */}

        {/* Bottom Status & Book Now CTA */}
        {/* <View style={styles.footerRow}>
          <View style={styles.statusCol}>
            <View style={styles.statusDotRow}>
              <Ionicons name="time-outline" size={14} color={isDark ? "#A1A1AA" : "#71717A"} style={{ marginRight: 4 }} />
              <Text style={styles.statusTimeText}>
                Closes {index === 1 ? "8:30 PM" : "9:00 PM"}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.bookBtn, index === 0 ? styles.bookBtnFilled : styles.bookBtnOutline]}
            onPress={handlePress}
            activeOpacity={0.8}
          >
            <Text style={[styles.bookBtnText, index === 0 ? styles.bookBtnTextFilled : styles.bookBtnTextOutline]}>
              Book Now
            </Text>
            <Ionicons
              name="arrow-forward"
              size={14}
              color={index === 0 ? "#FFFFFF" : isDark ? "#0A84FF" : "#0071e3"}
              style={{ marginLeft: 6 }}
            />
          </TouchableOpacity>
        </View> */}
      </View>
    </BouncyButton>
  );
}

export default memo(SalonCard);

function getStyles(theme = {}, isDark = false) {
  return StyleSheet.create({
    card: {
      backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
      ...getPlatformCardStyle(isDark),
      marginBottom: 14,
      overflow: "hidden",
    },
    horizontal: {
      width: SCREEN_WIDTH * 0.75,
      marginRight: 16,
    },
    full: {
      width: "100%",
    },
    compactCard: {
      flexDirection: "row",
      alignItems: "center",
      minHeight: 76,
      paddingVertical: 9,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: isDark ? "#38383A" : "#E5E5EA",
    },
    compactImage: {
      width: 58,
      height: 58,
      borderRadius: 12,
      backgroundColor: isDark ? "#2C2C2E" : "#F2F2F7",
    },
    compactImageWrap: {
      width: 58,
      height: 58,
      position: "relative",
    },
    pricePill: {
      position: "absolute",
      right: -8,
      bottom: -6,
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
      backgroundColor: "rgba(15, 15, 13, 0.9)",
      paddingHorizontal: 7,
      paddingVertical: 4,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.18)",
      zIndex: 2,
    },
    pricePillIcon: {
      color: "#0A84FF",
      fontSize: 10,
    },
    pricePillText: {
      color: "#FFFFFF",
      fontSize: 12,
      fontWeight: "700",
    },
    compactInfo: {
      flex: 1,
      minWidth: 0,
      marginLeft: 11,
      justifyContent: "center",
    },
    compactName: {
      color: isDark ? "#FFFFFF" : "#18181B",
      fontSize: 14,
      fontWeight: "700",
      marginBottom: 3,
    },
    compactAddress: {
      color: isDark ? "#A1A1AA" : "#71717A",
      fontSize: 11,
      marginBottom: 6,
    },
    compactMeta: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    stars: {
      flexDirection: "row",
      alignItems: "center",
      gap: 1,
    },
    distance: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
    },
    distanceText: {
      color: isDark ? "#A1A1AA" : "#71717A",
      fontSize: 12,
      fontWeight: "500",
    },
    imageFrame: {
      height: 160,
      backgroundColor: isDark ? "#2C2C2E" : "#F2F2F7",
      position: "relative",
      width: "100%",
    },
    image: {
      width: "100%",
      height: "100%",
    },
    ratingBadge: {
      position: "absolute",
      top: 12,
      left: 12,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "rgba(0, 0, 0, 0.65)",
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 16,
    },
    ratingBadgeText: {
      color: "#FFFFFF",
      fontSize: 13,
      fontWeight: "700",
    },
    reviewsText: {
      color: "#D4D4D8",
      fontSize: 12,
      fontWeight: "400",
    },
    favBtn: {
      position: "absolute",
      top: 12,
      right: 12,
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: "#FFFFFF",
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 3,
    },
    guestFavBadge: {
      position: "absolute",
      bottom: 12,
      right: 12,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "rgba(0, 0, 0, 0.65)",
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 16,
    },
    guestFavText: {
      color: "#FFFFFF",
      fontSize: 11,
      fontWeight: "700",
    },
    info: {
      padding: 16,
    },
    titleRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 4,
    },
    name: {
      fontSize: 16,
      fontWeight: "700",
      color: isDark ? "#FFFFFF" : "#18181B",
      flex: 1,
      marginRight: 8,
    },
    distanceBadge: {
      flexDirection: "row",
      alignItems: "center",
    },
    locationRow: {
      flexDirection: "row",
      alignItems: "center",
      // marginBottom: 10,
    },
    locationText: {
      color: isDark ? "#A1A1AA" : "#71717A",
      fontSize: 12,
      fontWeight: "400",
      flexShrink: 1,
    },
    tagsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
      marginBottom: 12,
    },
    tagPill: {
      backgroundColor: isDark ? "#1C2A3E" : "#E8F0FE",
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 12,
    },
    extraTagPill: {
      backgroundColor: isDark ? "#2C2C2E" : "#F2F2F7",
    },
    tagText: {
      fontSize: 11,
      color: isDark ? "#0A84FF" : "#0071e3",
      fontWeight: "600",
    },
    footerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 2,
    },
    statusCol: {
      flex: 1,
    },
    statusDotRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    statusStatusText: {
      fontSize: 12,
      fontWeight: "700",
    },
    statusTimeText: {
      fontSize: 12,
      color: isDark ? "#A1A1AA" : "#71717A",
    },
    bookBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 18,
      height: 38,
      borderRadius: 19,
    },
    bookBtnFilled: {
      backgroundColor: isDark ? "#0A84FF" : "#0071e3",
    },
    bookBtnOutline: {
      backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
      borderWidth: 1.5,
      borderColor: isDark ? "#0A84FF" : "#0071e3",
    },
    bookBtnText: {
      fontSize: 13,
      fontWeight: "700",
    },
    bookBtnTextFilled: {
      color: "#FFFFFF",
    },
    bookBtnTextOutline: {
      color: isDark ? "#0A84FF" : "#0071e3",
    },
  });
}
