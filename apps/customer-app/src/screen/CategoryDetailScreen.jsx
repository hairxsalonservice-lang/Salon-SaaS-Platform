// src/screen/CategoryDetailScreen.jsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { C, FF } from "../theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocationStore } from "../store/useLocationStore";
import { browseService } from "../services/browseService";
import { cleanCityName } from "../services/locationService";
import { useFavorites } from "../context/FavoritesContext";
import ComingSoonLocation from "../components/ComingSoonLocation";
import LocationPickerModal from "../components/LocationPickerModal";

const CATEGORY_CONFIGS = {
  haircut: {
    title: "Haircut",
    subtitle: "Stylish cuts for a better you",
    eyebrow: "HAIRCUT",
    heroTitle: "Fresh Look\nNew You",
    heroDesc: (city) => `Get stylish haircuts from expert professionals in ${city}`,
    badge: "Good Hair\nBetter Mood",
    heroImage: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80",
    tags: ["Men's Haircut", "Beard Styling", "Hair Spa", "Hair Color"],
  },
  facial: {
    title: "Facial",
    subtitle: "Glow & revitalize your skin",
    eyebrow: "FACIAL & CARE",
    heroTitle: "Radiant Skin\nPure Bliss",
    heroDesc: (city) => `Discover rejuvenating facial treatments in ${city}`,
    badge: "Glow From\nWithin",
    heroImage: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=80",
    tags: ["Clean Up", "Fruit Facial", "Gold Facial", "Anti-Aging"],
  },
  makeup: {
    title: "Makeup",
    subtitle: "Glamour for every occasion",
    eyebrow: "MAKEUP ARTISTRY",
    heroTitle: "Flawless Beauty\nUnmatched Style",
    heroDesc: (city) => `Book professional makeup artists in ${city}`,
    badge: "Own Your\nGlam",
    heroImage: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=800&q=80",
    tags: ["Bridal Makeup", "Party Makeup", "HD Makeup", "Eye Styling"],
  },
  massage: {
    title: "Massage",
    subtitle: "Relaxation & therapeutic therapy",
    eyebrow: "BODY & MASSAGE",
    heroTitle: "Unwind & Reset\nYour Mind",
    heroDesc: (city) => `Premium body spa & massage therapy in ${city}`,
    badge: "Ultimate\nRelaxation",
    heroImage: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=800&q=80",
    tags: ["Swedish Massage", "Deep Tissue", "Head Massage", "Aroma Spa"],
  },
  nails: {
    title: "Nails",
    subtitle: "Artistic nail care & extensions",
    eyebrow: "NAIL ART & CARE",
    heroTitle: "Perfect Nails\nBold Statements",
    heroDesc: (city) => `Top nail art salons & manicure experts in ${city}`,
    badge: "Nail Magic\nEvery Day",
    heroImage: "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=800&q=80",
    tags: ["Nail Art", "Gel Polish", "Manicure", "Pedicure"],
  },
};

// Home screen category labels -> service.category enum values in the API
const API_CATEGORY = {
  haircut: "hair",
  facial: "skin",
  massage: "spa",
  makeup: "makeup",
  nails: "nails",
};

const LIVE_CITIES = ["brahmapur", "bhubaneswar"];
const PLACEHOLDER_COVER = "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80";

// Area is the last segment of the branch street: "Plot 12, KIIT Square, Patia" -> "Patia"
function getArea(salon) {
  const addr = (salon.address && typeof salon.address === "object" ? salon.address : null) || salon.branches?.[0]?.address;
  const parts = (addr?.street || "").split(",").map((p) => p.trim()).filter(Boolean);
  return parts[parts.length - 1] || addr?.city || null;
}

// Map an API salon to what the list renders, without inventing ratings, distances or tags
function normalizeSalon(s) {
  const ratingObj = s.rating && typeof s.rating === "object" ? s.rating : null;
  const reviewCount = s.totalReviews ?? s.reviewsCount ?? ratingObj?.totalReviews ?? 0;
  const score = typeof s.rating === "number" ? s.rating : ratingObj?.avgScore || 0;
  const tags = (s.categories || s.tags || []).filter((t) => typeof t === "string");
  return {
    _id: s._id || s.id,
    raw: s,
    name: s.name || "Salon",
    score,
    reviewCount,
    area: getArea(s),
    distance: s.distance ?? s.distanceKm ?? null,
    coverImage: s.coverImage || s.logo || PLACEHOLDER_COVER,
    tags,
    isVerified: s.isVerified === true,
    startingPrice: typeof s.startingPrice === "number" ? s.startingPrice : null,
  };
}

export default function CategoryDetailScreen({ goBack, navigate, routeParams = {} }) {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const selectedCity = useLocationStore((state) => state.selectedCity) || "Brahmapur";
  const setSelectedCity = useLocationStore((state) => state.setSelectedCity);
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const { isFavorite, toggleFavorite } = useFavorites();

  const categoryName = routeParams?.category || routeParams?.search || "Haircut";
  const configKey = categoryName.toLowerCase();
  const config = CATEGORY_CONFIGS[configKey] || {
    title: categoryName,
    subtitle: `Stylish ${categoryName.toLowerCase()} services near you`,
    eyebrow: categoryName.toUpperCase(),
    heroTitle: `Fresh Look\nNew You`,
    heroDesc: (city) => `Get top-rated ${categoryName.toLowerCase()} services from professionals in ${city}`,
    badge: "Good Hair\nBetter Mood",
    heroImage: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80",
    tags: [categoryName, "Styling", "Treatment", "Grooming"],
  };

  const [activeSort, setActiveSort] = useState("Recommended"); // "Recommended" | "Rating" | "Price"
  const [ratingFilter, setRatingFilter] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [salons, setSalons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const isCityLive = LIVE_CITIES.includes(cleanCityName(selectedCity).toLowerCase());

  // The API already filters by category, so its results are used as-is
  useEffect(() => {
    let isMounted = true;
    async function loadSalons() {
      setLoading(true);
      setLoadError(null);
      try {
        const cleanCity = cleanCityName(selectedCity);
        // The API matches the service's stored category (hair, skin, spa, ...), not the display label
        const apiCategory = API_CATEGORY[categoryName.toLowerCase()] || categoryName.toLowerCase();
        const res = await browseService.getSalons({ city: cleanCity, category: apiCategory, limit: 100, bypassCache: true });
        const fetched = res.data?.salons || (Array.isArray(res.data) ? res.data : []);
        if (isMounted) setSalons(fetched.map(normalizeSalon));
      } catch (err) {
        console.warn("Failed to fetch salons for category screen:", err);
        if (isMounted) {
          setSalons([]);
          setLoadError(err.message || "Unable to load salons");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadSalons();
    return () => { isMounted = false; };
  }, [selectedCity, categoryName, reloadKey]);

  const filteredSalons = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = salons.filter((s) => {
      if (q) {
        const haystack = [s.name, s.area, ...s.tags].filter(Boolean).join(" ").toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      // Salons without reviews have no real rating, so they can't satisfy a rating filter
      if (ratingFilter && (s.reviewCount === 0 || s.score < ratingFilter)) return false;
      return true;
    });

    if (activeSort === "Rating") {
      list.sort((a, b) => (b.reviewCount > 0 ? b.score : 0) - (a.reviewCount > 0 ? a.score : 0) || b.reviewCount - a.reviewCount);
    } else if (activeSort === "Price") {
      list.sort((a, b) => (a.startingPrice ?? Infinity) - (b.startingPrice ?? Infinity));
    }
    return list;
  }, [salons, searchQuery, ratingFilter, activeSort]);

  const handleSalonPress = useCallback((salon) => {
    if (navigate) {
      navigate("SalonDetail", { salonId: salon._id, salon: salon.raw });
    }
  }, [navigate]);

  // Booking needs a branch and chosen services, which are picked on the salon page
  const handleBookNow = handleSalonPress;

  const toggleSort = (sort) => setActiveSort((prev) => (prev === sort ? "Recommended" : sort));

  const styles = buildStyles(isDark);

  return (
    <View style={[styles.container, { backgroundColor: isDark ? C.bg : C.lifted }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={isDark ? C.bg : C.lifted} />

      {/* Header Bar */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <TouchableOpacity style={styles.backBtn} onPress={goBack} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={C.ink} />
        </TouchableOpacity>

        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>{config.title}</Text>
          <Text style={styles.headerSubtitle}>{config.subtitle}</Text>
        </View>

        <TouchableOpacity
          style={styles.searchIconBtn}
          onPress={() => setIsSearching((prev) => !prev)}
          activeOpacity={0.7}
        >
          <Ionicons name={isSearching ? "close" : "search-outline"} size={20} color={C.ink} />
        </TouchableOpacity>
      </View>

      {/* Search Input Box (Collapsible) */}
      {isSearching && (
        <View style={styles.searchPillWrap}>
          <Ionicons name="search-outline" size={18} color={C.muted} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder={`Search ${config.title.toLowerCase()} salons...`}
            placeholderTextcolor={C.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={18} color={C.muted} />
            </TouchableOpacity>
          ) : null}
        </View>
      )}

      {/* Scrollable Content Body */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero Banner Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroLeft}>
            <Text style={styles.heroEyebrow}>{config.eyebrow}</Text>
            <Text style={styles.heroTitle}>{config.heroTitle}</Text>
            <Text style={styles.heroDesc}>{config.heroDesc(selectedCity)}</Text>
          </View>

          <View style={styles.heroRight}>
            <Image
              source={{ uri: config.heroImage }}
              style={styles.heroImage}
              resizeMode="cover"
            />
            {/* Stamp Badge */}
            <View style={styles.badgeStamp}>
              <Text style={styles.badgeStampText}>{config.badge}</Text>
            </View>
          </View>
        </View>

        {/* Sort & Filter Controls Row */}
        {isCityLive && !loadError ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
          >
            {[
              { key: "Rating", label: "Top rated", icon: "trending-up", active: activeSort === "Rating", onPress: () => toggleSort("Rating") },
              { key: "Price", label: "Price: low to high", icon: "pricetag-outline", active: activeSort === "Price", onPress: () => toggleSort("Price") },
              { key: "Stars", label: "4.0+", icon: "star", active: ratingFilter === 4.0, onPress: () => setRatingFilter((prev) => (prev === 4.0 ? null : 4.0)) },
            ].map((pill) => (
              <TouchableOpacity
                key={pill.key}
                style={[styles.filterPill, pill.active && styles.filterPillActive]}
                onPress={pill.onPress}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={pill.icon}
                  size={14}
                  color={pill.active ? C.main : C.textSecondary}
                  style={{ marginRight: 5 }}
                />
                <Text style={[styles.filterPillText, pill.active && styles.filterPillTextActive]}>{pill.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : null}

        {/* Count Header & Map View Button */}
        {!loading && isCityLive && !loadError && salons.length > 0 && (
          <View style={styles.listHeaderRow}>
            <Text style={styles.salonsCountText}>
              {filteredSalons.length} {filteredSalons.length === 1 ? "salon" : "salons"} found
            </Text>

            <TouchableOpacity
              style={styles.mapViewBtn}
              onPress={() => navigate && navigate("Map")}
              activeOpacity={0.8}
            >
              <Ionicons name="map-outline" size={15} color={C.main} style={{ marginRight: 5 }} />
              <Text style={styles.mapViewBtnText}>Map View</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Salons List */}
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={C.main} />
            <Text style={styles.loadingText}>Loading salons...</Text>
          </View>
        ) : !isCityLive ? (
          <ComingSoonLocation
            city={selectedCity}
            onChangeLocation={() => setLocationModalVisible(true)}
            onSelectQuickCity={(c) => setSelectedCity(c)}
          />
        ) : loadError ? (
          <View style={styles.emptyBox}>
            <Ionicons name="cloud-offline-outline" size={40} color={C.muted} />
            <Text style={styles.emptyTitle}>Couldn't load salons</Text>
            <Text style={styles.emptySub}>Check your internet connection and try again.</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => setReloadKey((k) => k + 1)} activeOpacity={0.85}>
              <Ionicons name="refresh" size={14} color={C.textLight} style={{ marginRight: 5 }} />
              <Text style={styles.retryBtnText}>Try again</Text>
            </TouchableOpacity>
          </View>
        ) : salons.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="storefront-outline" size={40} color={C.muted} />
            <Text style={styles.emptyTitle}>No {config.title.toLowerCase()} salons yet</Text>
            <Text style={styles.emptySub}>No salons in {selectedCity} offer this service right now.</Text>
          </View>
        ) : filteredSalons.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="search-outline" size={40} color={C.muted} />
            <Text style={styles.emptyTitle}>No salons found</Text>
            <Text style={styles.emptySub}>Try adjusting your filters or search criteria</Text>
          </View>
        ) : (
          filteredSalons.map((salon) => {
            const isNew = salon.reviewCount === 0;
            const distanceText =
              salon.distance == null ? null : typeof salon.distance === "number" ? `${salon.distance} km` : salon.distance;
            const locationLine = [salon.area || selectedCity, distanceText].filter(Boolean).join(" · ");

            return (
              <TouchableOpacity
                key={salon._id}
                style={styles.salonCard}
                onPress={() => handleSalonPress(salon)}
                activeOpacity={0.9}
              >
                {/* Salon Thumbnail Box */}
                <View style={styles.salonThumbWrap}>
                  <Image
                    source={{ uri: salon.coverImage }}
                    style={styles.salonThumb}
                    resizeMode="cover"
                  />
                </View>

                {/* Center Salon Details */}
                <View style={styles.salonDetails}>
                  {/* Name + Verified Circle */}
                  <View style={styles.salonTitleRow}>
                    <Text style={styles.salonName} numberOfLines={1}>
                      {salon.name}
                    </Text>
                    {salon.isVerified ? (
                      <Ionicons name="checkmark-circle" size={16} color={C.info} style={{ marginLeft: 4 }} />
                    ) : null}
                  </View>

                  {/* Rating & Reviews */}
                  <View style={styles.ratingRow}>
                    <Ionicons name="star" size={13} color={C.warning} />
                    {isNew ? (
                      <Text style={styles.ratingScore}>New</Text>
                    ) : (
                      <>
                        <Text style={styles.ratingScore}>{(salon.score || 0).toFixed(1)}</Text>
                        <Text style={styles.ratingCount}>
                          ({salon.reviewCount >= 1000 ? `${(salon.reviewCount / 1000).toFixed(1)}k` : salon.reviewCount} {salon.reviewCount === 1 ? "review" : "reviews"})
                        </Text>
                      </>
                    )}
                  </View>

                  {/* Location & Distance */}
                  <View style={styles.locationRow}>
                    <Ionicons name="location-outline" size={13} color={C.muted} />
                    <Text style={styles.locationText} numberOfLines={1}>{locationLine}</Text>
                  </View>

                  {/* Starting price & tags */}
                  <View style={styles.tagsRow}>
                    {salon.startingPrice != null ? (
                      <View style={styles.tagPill}>
                        <Text style={styles.tagText}>From ₹{salon.startingPrice}</Text>
                      </View>
                    ) : null}
                    {salon.tags.slice(0, 2).map((tag) => (
                      <View key={tag} style={styles.tagPill}>
                        <Text style={styles.tagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Right Side Favorite & Book Action */}
                <View style={styles.rightActions}>
                  <TouchableOpacity
                    style={styles.favBtn}
                    onPress={() => toggleFavorite(salon.raw)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={isFavorite(salon._id) ? "heart" : "heart-outline"}
                      size={20}
                      color={isFavorite(salon._id) ? C.error : C.muted}
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.bookNowBtn}
                    onPress={() => handleBookNow(salon)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.bookNowText}>Book Now</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })
        )}

        {/* Bottom Consultation CTA Banner */}
        <View style={styles.ctaBanner}>
          <View style={styles.ctaIconCircle}>
            <Ionicons name="headset-outline" size={22} color={C.main} />
          </View>

          <View style={styles.ctaTextWrap}>
            <Text style={styles.ctaTitle}>Not sure what to choose?</Text>
            <Text style={styles.ctaSub}>Get free advice from our beauty experts.</Text>
          </View>

          <TouchableOpacity
            style={styles.chatNowBtn}
            onPress={() => navigate && navigate("Support")}
            activeOpacity={0.8}
          >
            <Text style={styles.chatNowText}>Chat Now</Text>
            <Ionicons name="arrow-forward" size={13} color={isDark ? C.crimsonLight : C.main} style={{ marginLeft: 3 }} />
          </TouchableOpacity>
        </View>
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

function buildStyles(isDark) {
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingBottom: 12,
      backgroundColor: isDark ? C.bg : C.lifted,
    },
    backBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 8,
    },
    headerTextWrap: {
      flex: 1,
    },
    headerTitle: {
      fontFamily: FF.displayBold,
      fontSize: 20,
      color: C.ink,
      letterSpacing: 0.2,
    },
    headerSubtitle: {
      fontSize: 12,
      color: C.muted,
      marginTop: 1,
    },
    searchIconBtn: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: isDark ? C.surface : C.lifted,
      alignItems: "center",
      justifyContent: "center",
    },
    searchPillWrap: {
      flexDirection: "row",
      alignItems: "center",
      marginHorizontal: 16,
      marginBottom: 12,
      backgroundColor: isDark ? C.surface : C.lifted,
      borderRadius: 20,
      paddingHorizontal: 14,
      height: 44,
    },
    searchInput: {
      flex: 1,
      fontSize: 14,
      color: C.ink,
      paddingVertical: 0,
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingBottom: 36,
    },
    /* Hero Card */
    heroCard: {
      flexDirection: "row",
      backgroundColor: isDark ? C.surface : C.lifted,
      borderRadius: 20,
      padding: 16,
      marginBottom: 16,
      overflow: "hidden",
      alignItems: "center",
      minHeight: 160,
    },
    heroLeft: {
      flex: 1,
      paddingRight: 10,
    },
    heroEyebrow: {
      fontSize: 10,
      fontFamily: "Oswald_700Bold",
      letterSpacing: 1.2,
      color: C.muted,
      marginBottom: 6,
    },
    heroTitle: {
      fontSize: 22,
      fontFamily: "Oswald_700Bold",
      color: C.ink,
      lineHeight: 26,
      letterSpacing: 0.15,
      marginBottom: 8,
    },
    heroDesc: {
      fontSize: 12,
      color: isDark ? C.textSecondary : C.muted,
      lineHeight: 16,
    },
    heroRight: {
      width: 130,
      height: 140,
      borderRadius: 16,
      overflow: "hidden",
      position: "relative",
    },
    heroImage: {
      width: "100%",
      height: "100%",
      borderRadius: 16,
    },
    badgeStamp: {
      position: "absolute",
      bottom: 8,
      right: 8,
      backgroundColor: "rgba(255, 255, 255, 0.92)",
      borderRadius: 10,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderWidth: 1,
      borderColor: "rgba(192, 82, 120, 0.3)",
      shadowColor: C.ink,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 3,
    },
    badgeStampText: {
      fontSize: 9,
      fontFamily: "Oswald_700Bold",
      color: C.main,
      textAlign: "center",
      fontStyle: "italic",
    },
    /* Filter Row */
    filterRow: {
      flexDirection: "row",
      marginBottom: 18,
      paddingRight: 10,
    },
    filterPill: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: C.surface,
      borderWidth: 1,
      borderColor: C.border,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      marginRight: 8,
    },
    filterPillActive: {
      borderColor: C.main,
      backgroundColor: isDark ? C.surface : C.infoBg,
    },
    filterPillText: {
      fontSize: 13,
      fontFamily: "Oswald_600SemiBold",
      color: C.textSecondary,
    },
    filterPillTextActive: {
      color: C.main,
    },
    /* List Header */
    listHeaderRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 14,
    },
    salonsCountText: {
      fontSize: 15,
      fontFamily: "Oswald_700Bold",
      color: C.ink,
    },
    mapViewBtn: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: isDark ? C.surface : C.infoBg,
      borderWidth: 1,
      borderColor: "rgba(192, 82, 120, 0.3)",
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
    },
    mapViewBtnText: {
      fontSize: 12,
      fontFamily: "Oswald_700Bold",
      color: C.main,
    },
    /* Salon Cards */
    salonCard: {
      flexDirection: "row",
      backgroundColor: C.surface,
      borderRadius: 18,
      padding: 12,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: C.border,
      shadowColor: C.ink,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 6,
      elevation: 2,
    },
    salonThumbWrap: {
      width: 90,
      height: 96,
      borderRadius: 14,
      overflow: "hidden",
      marginRight: 12,
      position: "relative",
    },
    salonThumb: {
      width: "100%",
      height: "100%",
    },
    salonDetails: {
      flex: 1,
      justifyContent: "center",
    },
    salonTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 4,
    },
    salonName: {
      fontSize: 15,
      fontFamily: "Oswald_700Bold",
      color: C.ink,
      flexShrink: 1,
    },
    ratingRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 4,
    },
    ratingScore: {
      fontSize: 12,
      fontFamily: "Oswald_700Bold",
      color: C.ink,
      marginLeft: 4,
      marginRight: 3,
    },
    ratingCount: {
      fontSize: 12,
      color: C.muted,
    },
    locationRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 8,
    },
    locationText: {
      fontSize: 11,
      color: C.muted,
      marginLeft: 3,
      flexShrink: 1,
    },
    tagsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
    },
    tagPill: {
      backgroundColor: C.border,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
      marginRight: 4,
      marginBottom: 2,
    },
    tagText: {
      fontSize: 10,
      fontFamily: "DMSans_500Medium",
      color: isDark ? C.textSecondary : C.muted,
    },
    rightActions: {
      alignItems: "flex-end",
      justifyContent: "space-between",
      marginLeft: 6,
    },
    favBtn: {
      padding: 4,
    },
    bookNowBtn: {
      backgroundColor: isDark ? C.surface : C.infoBg,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 12,
      marginTop: 10,
    },
    bookNowText: {
      fontSize: 12,
      fontFamily: "Oswald_700Bold",
      color: isDark ? C.crimsonLight : C.main,
    },
    /* Consultation Banner */
    ctaBanner: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: isDark ? C.ink : C.infoBg,
      borderRadius: 18,
      padding: 14,
      marginTop: 10,
      borderWidth: 1,
      borderColor: "rgba(192, 82, 120, 0.2)",
    },
    ctaIconCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: "rgba(192, 82, 120, 0.12)",
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },
    ctaTextWrap: {
      flex: 1,
    },
    ctaTitle: {
      fontSize: 13,
      fontFamily: "Oswald_700Bold",
      color: C.ink,
    },
    ctaSub: {
      fontSize: 11,
      color: C.muted,
      marginTop: 2,
    },
    chatNowBtn: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: isDark ? C.ink : C.crimsonTint,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 14,
    },
    chatNowText: {
      fontSize: 12,
      fontFamily: "Oswald_700Bold",
      color: isDark ? C.crimsonLight : C.main,
    },
    loadingBox: {
      alignItems: "center",
      paddingVertical: 40,
    },
    loadingText: {
      fontSize: 13,
      color: C.muted,
      marginTop: 8,
    },
    emptyBox: {
      alignItems: "center",
      paddingVertical: 40,
    },
    emptyTitle: {
      fontSize: 16,
      fontFamily: "Oswald_700Bold",
      color: C.ink,
      marginTop: 10,
    },
    emptySub: {
      fontSize: 12,
      color: C.muted,
      marginTop: 4,
      textAlign: "center",
    },
    retryBtn: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 14,
      paddingHorizontal: 18,
      height: 40,
      borderRadius: 12,
      backgroundColor: C.main,
    },
    retryBtnText: {
      color: C.textLight,
      fontSize: 13,
      fontFamily: "Oswald_700Bold",
    },
  });
}
