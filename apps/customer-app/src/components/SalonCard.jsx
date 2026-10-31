import React, { memo, useCallback } from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { C, FF, R } from "../theme";
import { useFavorites } from "../context/FavoritesContext";
import { useTheme } from "../context/ThemeContext";
import BouncyButton from "./BouncyButton";
import AppleTouchable from "./AppleTouchable";
import AnimatedHeart from "./AnimatedHeart";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const BLURHASH = "LKO2?U%2Tw=w]~RBVZRi};RPxuwH";

const DEMO_IMAGES = [
  "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1562322140-8baeececf3df?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?q=80&w=800&auto=format&fit=crop",
];

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

  return candidatePrices.length > 0 ? Math.min(...candidatePrices) : null;
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
    if (currentMinutes < openMinutes || currentMinutes >= closeMinutes) return false;
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
  const isNew = reviewsCount === 0;
  const isTopRated = !isNew && numericRating >= 4.5;
  const coverImage = salon.coverImage || salon.image || DEMO_IMAGES[index % DEMO_IMAGES.length];
  const isFav = isFavorite(salon._id || salon.id);

  const address = (salon.address && typeof salon.address === "object" ? salon.address : null) || salon.branches?.[0]?.address;
  const rawAddress = getArea(address) || address?.city || salon.city || "";
  const rawDistance = salon.distance ?? salon.distanceKm ?? null;
  const distance = rawDistance == null ? null : typeof rawDistance === "number" ? `${rawDistance} km` : rawDistance;
  const lowestServicePrice = getLowestServicePrice(salon);

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

  // ── Compact variant (list rows) ──────────────────────────────
  if (variant === "compact") {
    return (
      <BouncyButton
        style={s.compactCard}
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={`View ${salon.name}`}
      >
        <View style={s.compactImageWrap}>
          <Image source={coverImage} style={s.compactImage} contentFit="cover" placeholder={{ blurhash: BLURHASH }} transition={300} cachePolicy="memory-disk" recyclingKey={salon._id || salon.id} />
          {lowestServicePrice !== null && (
            <View style={s.pricePill}>
              <Text style={s.pricePillIcon}>✦</Text>
              <Text style={s.pricePillText}>₹{lowestServicePrice}</Text>
            </View>
          )}
        </View>
        <View style={s.compactInfo}>
          <Text style={s.compactName} numberOfLines={1}>{salon.name}</Text>
          <Text style={s.compactAddress} numberOfLines={1}>{rawAddress}</Text>
          <View style={s.compactMeta}>
            {isNew ? (
              <Text style={s.metaText}>New</Text>
            ) : (
              <View style={s.inlineRow}>
                <Ionicons name="star" size={10} color="#FBBF24" />
                <Text style={s.metaText}>{ratingStr}</Text>
              </View>
            )}
            {distance && (
              <View style={s.inlineRow}>
                <Ionicons name="location-outline" size={11} color={C.muted} />
                <Text style={s.metaText}>{distance}</Text>
              </View>
            )}
          </View>
        </View>
      </BouncyButton>
    );
  }

  // ── Full-bleed card (editorial, immersive) ───────────────────
  return (
    <BouncyButton
      style={[s.card, isHorizontal ? s.horizontal : s.full]}
      onPress={handlePress}
      activeOpacity={0.95}
    >
      {/* Full-bleed cover image */}
      <Image source={coverImage} style={s.coverImage} contentFit="cover" placeholder={{ blurhash: BLURHASH }} transition={400} cachePolicy="memory-disk" recyclingKey={salon._id || salon.id} />

      {/* Top overlay: rating + heart */}
      <View style={s.topRow}>
        <View style={s.ratingChip}>
          <Ionicons name="star" size={11} color="#FBBF24" />
          <Text style={s.ratingText}>
            {isNew ? "New" : ratingStr}
          </Text>
          {!isNew && reviewsCount > 0 && (
            <Text style={s.reviewCount}>({reviewsCount})</Text>
          )}
        </View>

        <AppleTouchable style={s.heartBtn} onPress={handleFavPress} scaleTo={0.88} hapticType="medium">
          <AnimatedHeart filled={isFav} size={17} />
        </AppleTouchable>
      </View>

      {/* Top-rated badge */}
      {isTopRated && (
        <View style={s.topRatedBadge}>
          <Ionicons name="sparkles" size={10} color="#FBBF24" />
          <Text style={s.topRatedText}>Guest Favourite</Text>
        </View>
      )}

      {/* Bottom gradient overlay with info */}
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.75)"]}
        locations={[0, 1]}
        style={s.gradientOverlay}
      >
        <View style={s.bottomInfo}>
          {/* Name row */}
          <View style={s.nameRow}>
            <Text style={s.salonName} numberOfLines={1}>{salon.name}</Text>
            {lowestServicePrice !== null && (
              <View style={s.priceTag}>
                <Text style={s.priceFrom}>from</Text>
                <Text style={s.priceValue}>₹{lowestServicePrice}</Text>
              </View>
            )}
          </View>

          {/* Meta row */}
          <View style={s.bottomMeta}>
            <View style={s.inlineRow}>
              <Ionicons name="location-outline" size={12} color="rgba(255,255,255,0.7)" />
              <Text style={s.locationText} numberOfLines={1}>{rawAddress}</Text>
            </View>
            <View style={s.statusDot}>
              <View style={[s.dot, { backgroundColor: isOpen ? "#34D399" : "#F87171" }]} />
              <Text style={s.statusText}>{isOpen ? "Open" : "Closed"}</Text>
            </View>
            {distance && (
              <View style={s.inlineRow}>
                <Ionicons name="navigate-outline" size={10} color="rgba(255,255,255,0.6)" />
                <Text style={s.distText}>{distance}</Text>
              </View>
            )}
          </View>
        </View>
      </LinearGradient>
    </BouncyButton>
  );
}

export default memo(SalonCard);

// ── Styles ─────────────────────────────────────────────────────
const CARD_HEIGHT = 220;
const CARD_RADIUS = R.lg;

const s = StyleSheet.create({
  // Full-bleed card
  card: {
    height: CARD_HEIGHT,
    borderRadius: CARD_RADIUS,
    overflow: "hidden",
    marginBottom: 16,
    backgroundColor: "#141414",
  },
  horizontal: {
    width: SCREEN_WIDTH * 0.78,
    marginRight: 14,
  },
  full: {
    width: "100%",
  },
  coverImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },

  // Top row (rating + heart)
  topRow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingTop: 12,
    zIndex: 2,
  },
  ratingChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    backdropFilter: "blur(8)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  ratingText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontFamily: "Oswald_700Bold",
    letterSpacing: 0.2,
  },
  reviewCount: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 11,
    fontFamily: "DMSans_400Regular",
  },
  heartBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    alignItems: "center",
    justifyContent: "center",
  },

  // Top-rated badge
  topRatedBadge: {
    position: "absolute",
    top: 12,
    left: "50%",
    transform: [{ translateX: -50 }],
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    zIndex: 2,
  },
  topRatedText: {
    color: "#FBBF24",
    fontSize: 10,
    fontFamily: "DMSans_600SemiBold",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },

  // Gradient overlay
  gradientOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: CARD_HEIGHT * 0.55,
    justifyContent: "flex-end",
    zIndex: 1,
  },
  bottomInfo: {
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  salonName: {
    fontFamily: "Oswald_600SemiBold",
    fontSize: 20,
    color: "#FFFFFF",
    flex: 1,
    marginRight: 8,
    letterSpacing: 0.3,
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  priceTag: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 3,
  },
  priceFrom: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 10,
    fontFamily: "DMSans_400Regular",
  },
  priceValue: {
    color: "#FFFFFF",
    fontSize: 18,
    fontFamily: "Oswald_700Bold",
    letterSpacing: 0.2,
  },

  // Bottom meta
  bottomMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  locationText: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 12,
    fontFamily: "DMSans_400Regular",
    flexShrink: 1,
  },
  statusDot: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  statusText: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 11,
    fontFamily: "DMSans_500Medium",
  },
  distText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 11,
    fontFamily: "DMSans_400Regular",
  },

  // Shared
  inlineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  metaText: {
    color: C.muted,
    fontSize: 12,
    fontFamily: "DMSans_500Medium",
  },

  // Compact card (list variant)
  compactCard: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 76,
    paddingVertical: 9,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.border,
  },
  compactImageWrap: {
    width: 58,
    height: 58,
    position: "relative",
  },
  compactImage: {
    width: 58,
    height: 58,
    borderRadius: 12,
    backgroundColor: C.lifted,
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
    color: C.main,
    fontSize: 10,
  },
  pricePillText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontFamily: "Oswald_700Bold",
  },
  compactInfo: {
    flex: 1,
    minWidth: 0,
    marginLeft: 11,
    justifyContent: "center",
  },
  compactName: {
    fontFamily: FF.displayMedium,
    color: C.ink,
    fontSize: 14,
    marginBottom: 3,
    letterSpacing: 0.1,
  },
  compactAddress: {
    fontFamily: "DMSans_400Regular",
    color: C.muted,
    fontSize: 11,
    marginBottom: 6,
  },
  compactMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});
