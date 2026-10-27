// src/screen/MapScreen.jsx
import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  StatusBar,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { useLocationStore } from "../store/useLocationStore";
import { browseService } from "../services/browseService";
import { calculateDistance, cleanCityName } from "../services/locationService";
import FilterModal from "../components/FilterModal";
import LocationPickerModal from "../components/LocationPickerModal";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import mapService from "../services/mapService";
import ComingSoonLocation from "../components/ComingSoonLocation";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH * 0.78;

const LIVE_CITIES = ["brahmapur", "bhubaneswar"];

// ids are the service.category values the API filters on
const CATEGORIES = [
  { id: "all", label: "All", icon: "✨" },
  { id: "combo", label: "Combos", icon: "🎁" },
  { id: "hair", label: "Haircut", icon: "✂️" },
  { id: "skin", label: "Facials", icon: "🧴" },
  { id: "nails", label: "Nails", icon: "💅" },
  { id: "spa", label: "Spa", icon: "🌿" },
];

// FilterModal "service type" ids -> API categories
const SERVICE_TYPE_TO_CATEGORY = { hair: "hair", facial: "skin", makeup: "makeup" };

// Map centre per city when we don't have the user's own position there
const CITY_COORDINATES = {
  brahmapur: { lat: 19.3150, lng: 84.7941 },
  berhampur: { lat: 19.3150, lng: 84.7941 },
  bhubaneswar: { lat: 20.2961, lng: 85.8245 },
  cuttack: { lat: 20.4625, lng: 85.8828 },
  puri: { lat: 19.8135, lng: 85.8312 },
  janla: { lat: 20.2400, lng: 85.7700 },
};
const DEFAULT_CENTER = CITY_COORDINATES.brahmapur;

// First branch that has real stored coordinates (Branch.address.coordinates = { lat, lng })
function getSalonCoords(salon) {
  for (const b of salon.branches || []) {
    const c = b?.address?.coordinates;
    if (Number.isFinite(c?.lat) && Number.isFinite(c?.lng)) return { lat: c.lat, lng: c.lng };
  }
  return null;
}

function getReviewCount(s) {
  return s.totalReviews ?? s.reviewsCount ?? s.rating?.totalReviews ?? 0;
}

// Salons without reviews only carry a placeholder score
function getRealRating(s) {
  if (getReviewCount(s) === 0) return null;
  const raw = typeof s.rating === "number" ? s.rating : s.rating?.avgScore;
  return Number.isFinite(raw) ? raw : null;
}

function getStartingPrice(s) {
  const p = s.startingPrice ?? s.minServicePrice;
  return typeof p === "number" && p > 0 ? p : null;
}

export default function MapScreen({ navigate }) {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => getStyles(isDark, insets), [isDark, insets]);
  const bottomBarInset = Math.max(insets.bottom, 10) + 68;
  // Header pills and map buttons are always white (they float over the map), so icons stay dark
  const iconColor = "#18181B";

  const selectedCity = useLocationStore((state) => state.selectedCity);
  const locationDetails = useLocationStore((state) => state.locationDetails);
  const setSelectedCity = useLocationStore((state) => state.setSelectedCity);
  const detectCurrentLocation = useLocationStore((state) => state.detectCurrentLocation);

  const [salons, setSalons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [filters, setFilters] = useState({
    minRating: "all",
    priceRange: "all",
    sortBy: "recommended",
    serviceType: "all",
  });

  const webViewRef = useRef(null);

  const cleanCity = cleanCityName(selectedCity || "");
  const cityKey = cleanCity.toLowerCase();
  const isCityLive = LIVE_CITIES.includes(cityKey);

  // The user's real position is only meaningful when it's in the city being browsed
  const hasGpsInCity =
    Boolean(locationDetails?.city) &&
    cleanCityName(locationDetails.city).toLowerCase() === cityKey &&
    Number.isFinite(locationDetails?.latitude) &&
    Number.isFinite(locationDetails?.longitude);
  const cityCenter = CITY_COORDINATES[cityKey] || DEFAULT_CENTER;
  const centerLat = hasGpsInCity ? locationDetails.latitude : cityCenter.lat;
  const centerLng = hasGpsInCity ? locationDetails.longitude : cityCenter.lng;

  const locationAddressText = hasGpsInCity
    ? locationDetails?.formattedAddress || locationDetails?.area || selectedCity || ""
    : selectedCity || "";
  const commaIdx = locationAddressText.indexOf(",");
  const locationTitle = commaIdx >= 0 ? locationAddressText.slice(0, commaIdx) : locationAddressText;
  const locationSubtitle = commaIdx >= 0 ? locationAddressText.slice(commaIdx + 1).trim() : "Tap to change city";

  // A category pill wins; otherwise fall back to the service type picked in the filter sheet
  const effectiveCategory =
    selectedCategory !== "all" ? selectedCategory : SERVICE_TYPE_TO_CATEGORY[filters.serviceType] || null;

  useEffect(() => {
    let isMounted = true;
    if (!isCityLive) {
      setSalons([]);
      setLoading(false);
      return;
    }
    async function loadSalons() {
      setLoading(true);
      setLoadError(null);
      try {
        const params = { city: cleanCity, limit: 100, bypassCache: true };
        if (effectiveCategory) params.category = effectiveCategory;
        const res = await browseService.getSalons(params);
        let list = [];
        if (Array.isArray(res?.data?.data?.salons)) list = res.data.data.salons;
        else if (Array.isArray(res?.data?.salons)) list = res.data.salons;
        else if (Array.isArray(res?.data)) list = res.data;
        if (isMounted) setSalons(list);
      } catch (err) {
        console.warn("MapScreen fetch error:", err?.message);
        if (isMounted) {
          setSalons([]);
          setLoadError(err?.message || "Unable to load salons");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadSalons();
    return () => { isMounted = false; };
  }, [cleanCity, isCityLive, effectiveCategory, reloadKey]);

  const activeFilterCount = useMemo(() => {
    return [
      filters.minRating !== "all",
      filters.priceRange !== "all",
      filters.sortBy !== "recommended",
      filters.serviceType !== "all",
    ].filter(Boolean).length;
  }, [filters]);

  // Apply client-side filters, then map to what the Leaflet page renders
  const { pinned, unpinnedCount, matchCount } = useMemo(() => {
    let list = [...salons];

    if (filters.minRating !== "all") {
      const minVal = parseFloat(filters.minRating);
      list = list.filter((s) => {
        const r = getRealRating(s);
        return r !== null && r >= minVal;
      });
    }
    if (filters.priceRange !== "all") {
      list = list.filter((s) => {
        const price = getStartingPrice(s);
        if (price === null) return false;
        if (filters.priceRange === "budget") return price < 500;
        if (filters.priceRange === "moderate") return price >= 500 && price <= 1500;
        if (filters.priceRange === "luxury") return price > 1500;
        return true;
      });
    }

    const mapped = list.map((s) => {
      const coords = getSalonCoords(s);
      const rating = getRealRating(s);
      const reviews = getReviewCount(s);
      const distance =
        coords && hasGpsInCity ? calculateDistance(centerLat, centerLng, coords.lat, coords.lng) : null;
      return {
        id: String(s._id || s.id),
        name: s.name,
        latitude: coords?.lat ?? null,
        longitude: coords?.lng ?? null,
        image: s.coverImage || s.logo || null,
        ratingText: rating !== null ? `${rating.toFixed(1)} (${reviews})` : "New",
        distanceText: Number.isFinite(distance) ? `${distance.toFixed(1)} km` : "",
      };
    });

    const withCoords = mapped.filter((s) => s.latitude !== null);
    return { pinned: withCoords, unpinnedCount: mapped.length - withCoords.length, matchCount: mapped.length };
  }, [salons, filters, hasGpsInCity, centerLat, centerLng]);

  const mapHtml = useMemo(() => {
    return mapService.generateMapHtml({
      salons: pinned,
      centerLat,
      centerLng,
      selectedSalonId: null,
      isDark,
      userLat: centerLat,
      userLng: centerLng,
    });
  }, [pinned, isDark, centerLat, centerLng]);

  const openSalon = useCallback((id) => {
    const salon = salons.find((s) => String(s._id || s.id) === String(id));
    if (salon && navigate) navigate("SalonDetail", { salon });
  }, [salons, navigate]);

  const handleMapMessage = useCallback((event) => {
    const data = mapService.parseMapMessage(event);
    if (data?.type === "NAVIGATE_SALON" && data?.id) openSalon(data.id);
  }, [openSalon]);

  // Web: one listener for the iframe's messages, always calling the latest handler
  const handleMapMessageRef = useRef(handleMapMessage);
  handleMapMessageRef.current = handleMapMessage;
  useEffect(() => {
    if (Platform.OS !== "web") return;
    const listener = (e) => handleMapMessageRef.current(e);
    window.addEventListener("message", listener);
    return () => window.removeEventListener("message", listener);
  }, []);

  const handleRecenterLocation = async () => {
    try {
      await detectCurrentLocation();
      const freshLoc = useLocationStore.getState().locationDetails;
      mapService.recenterMap({
        webViewRef,
        iframeId: "leaflet-map-iframe",
        lat: freshLoc?.latitude || centerLat,
        lng: freshLoc?.longitude || centerLng,
      });
    } catch (e) {
      console.warn("Recenter error:", e);
    }
  };

  const handleApplyFilters = useCallback((next) => {
    setFilters(next);
    // Keep the pills in sync with the service type chosen in the sheet
    const mapped = SERVICE_TYPE_TO_CATEGORY[next.serviceType];
    if (mapped) setSelectedCategory(mapped);
    else if (next.serviceType === "all" && SERVICE_TYPE_TO_CATEGORY[filters.serviceType] === selectedCategory) {
      setSelectedCategory("all");
    }
  }, [filters.serviceType, selectedCategory]);

  const renderNotice = () => {
    if (loading || loadError || !isCityLive) return null;
    let title = null;
    let sub = null;
    if (matchCount === 0) {
      title = "No salons match";
      sub = "Try a different category or filter.";
    } else if (unpinnedCount > 0) {
      title =
        unpinnedCount === matchCount
          ? `Salons in ${selectedCity} aren't on the map yet`
          : `${unpinnedCount} ${unpinnedCount === 1 ? "salon isn't" : "salons aren't"} on the map yet`;
      sub = "They haven't added their map location.";
    }
    if (!title) return null;
    return (
      <View style={[styles.emptyCard, styles.noticeCard, { bottom: bottomBarInset + 16 }]}>
        <Text style={styles.emptyTitle}>{title}</Text>
        <Text style={styles.emptySub}>{sub}</Text>
        {matchCount > 0 ? (
          <TouchableOpacity
            style={styles.noticeBtn}
            activeOpacity={0.85}
            onPress={() => navigate && navigate("AllSalons", { city: selectedCity })}
          >
            <Text style={styles.noticeBtnText}>View all as a list</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* HEADER OVERLAY */}
      <View style={[styles.headerOverlay, { paddingTop: Math.max(insets?.top || 20, 20) + 12 }]} pointerEvents="box-none">
        <View style={styles.topRow} pointerEvents="box-none">
          <TouchableOpacity activeOpacity={0.8} onPress={() => setLocationModalVisible(true)} style={styles.locationPill}>
            <Ionicons name="location" size={16} color="#762237" style={{ marginRight: 6 }} />
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text style={styles.locationCityText} numberOfLines={1}>{locationTitle || "Choose city"}</Text>
                <Ionicons name="chevron-down" size={12} color={iconColor} style={{ marginLeft: 4 }} />
              </View>
              <Text style={styles.locationAreaText} numberOfLines={1}>{locationSubtitle}</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.notificationBtn}
            onPress={() => navigate && navigate("NotificationCenter")}
          >
            <Ionicons name="notifications-outline" size={20} color={iconColor} />
          </TouchableOpacity>
        </View>

        {isCityLive && (
          <>
            {/* Search Pill */}
            <View style={styles.searchPill}>
              <Ionicons name="search-outline" size={18} color="#9999A0" style={{ marginRight: 8 }} />
              <TouchableOpacity activeOpacity={1} onPress={() => navigate && navigate("Explore")} style={{ flex: 1, paddingVertical: 14 }}>
                <Text style={{ fontSize: 14, fontWeight: "400", color: "#9999A0" }}>
                  Search by salon name...
                </Text>
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.7} onPress={() => setFilterModalVisible(true)} style={styles.filterIconButton}>
                <Ionicons name="options-outline" size={18} color={iconColor} />
                {activeFilterCount > 0 && (
                  <View style={styles.filterBadge}>
                    <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Categories */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12, flexGrow: 0 }} contentContainerStyle={{ paddingHorizontal: 16, gap: 10, paddingBottom: 10 }}>
              {CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <TouchableOpacity key={cat.id} onPress={() => setSelectedCategory(cat.id)} activeOpacity={0.85} style={[styles.catPill, isSelected ? styles.catPillActive : styles.catPillInactive]}>
                    <Text style={{ fontSize: 13, marginRight: 5 }}>{cat.icon}</Text>
                    <Text style={[styles.catText, isSelected ? styles.catTextActive : styles.catTextInactive]}>{cat.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </>
        )}
      </View>

      {/* MAIN CONTENT AREA */}
      {!isCityLive ? (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingTop: Math.max(insets?.top || 20, 20) + 70,
            paddingBottom: bottomBarInset + 20,
          }}
          showsVerticalScrollIndicator={false}
        >
          <ComingSoonLocation
            city={selectedCity}
            onChangeLocation={() => setLocationModalVisible(true)}
            onSelectQuickCity={(city) => setSelectedCity(city)}
          />
        </ScrollView>
      ) : loadError ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 }}>
          <View style={styles.emptyCard}>
            <Ionicons name="cloud-offline-outline" size={28} color="#71717A" />
            <Text style={[styles.emptyTitle, { marginTop: 8 }]}>Couldn't load salons</Text>
            <Text style={[styles.emptySub, { textAlign: "center" }]}>Check your internet connection and try again.</Text>
            <TouchableOpacity style={styles.noticeBtn} activeOpacity={0.85} onPress={() => setReloadKey((k) => k + 1)}>
              <Text style={styles.noticeBtnText}>Try again</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        /* INTERACTIVE MAP ENGINE */
        <View style={styles.mapContainer}>
          {Platform.OS === "web" ? (
            <iframe
              id="leaflet-map-iframe"
              title="Salon Interactive Map"
              srcDoc={mapHtml}
              style={{ width: "100%", height: "100%", border: "none" }}
            />
          ) : (
            <WebView
              ref={webViewRef}
              originWhitelist={["*"]}
              source={{ html: mapHtml, baseUrl: "https://localhost" }}
              style={{ flex: 1, width: "100%", height: "100%", backgroundColor: isDark ? "#121216" : "#EAEAEA" }}
              onMessage={handleMapMessage}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              scalesPageToFit={false}
              mixedContentMode="always"
            />
          )}

          {loading ? (
            <View style={[styles.emptyCard, styles.noticeCard, { bottom: bottomBarInset + 16, flexDirection: "row" }]}>
              <ActivityIndicator size="small" color="#762237" />
              <Text style={[styles.emptySub, { marginTop: 0, marginLeft: 8 }]}>Loading salons in {selectedCity}…</Text>
            </View>
          ) : null}

          {renderNotice()}

          {/* Floating Map Controls */}
          <TouchableOpacity activeOpacity={0.85} onPress={handleRecenterLocation} style={[styles.mapControlButton, { top: Math.max(insets?.top || 20, 20) + 160 }]}>
            <Ionicons name="locate-outline" size={20} color={iconColor} />
          </TouchableOpacity>
        </View>
      )}

      {/* MODALS */}
      <FilterModal
        visible={filterModalVisible}
        filters={filters}
        onApplyFilters={handleApplyFilters}
        onClose={() => setFilterModalVisible(false)}
      />

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

function getStyles(isDark, insets) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? "#121216" : "#F8F9FA",
    },

    // Header Overlay Styles
    headerOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      zIndex: 20,
    },
    topRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      marginBottom: 16,
    },
    locationPill: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#FFFFFF",
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 24,
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 5,
      maxWidth: "80%",
    },
    locationCityText: {
      fontSize: 15,
      fontWeight: "700",
      color: "#18181B",
    },
    locationAreaText: {
      fontSize: 12,
      color: "#71717A",
      marginTop: 2,
    },
    notificationBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: "#FFFFFF",
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 5,
    },
    searchPill: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#FFFFFF",
      borderRadius: 24,
      paddingHorizontal: 16,
      marginHorizontal: 16,
      height: 48,
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 4,
    },
    filterIconButton: {
      padding: 6,
      marginLeft: 6,
      backgroundColor: "#E5E5EA",
      borderRadius: 16,
      position: "relative",
    },
    filterBadge: {
      position: "absolute",
      top: -2,
      right: -2,
      width: 14,
      height: 14,
      borderRadius: 7,
      backgroundColor: "#EF4444",
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: "#FFFFFF",
    },
    filterBadgeText: {
      fontSize: 8,
      fontWeight: "700",
      color: "#FFFFFF",
    },

    // Category Filter Pills
    catPill: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 24,
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 3,
    },
    catPillActive: {
      backgroundColor: "#762237",
    },
    catPillInactive: {
      backgroundColor: "#FFFFFF",
    },
    catText: {
      fontSize: 13,
      fontWeight: "600",
    },
    catTextActive: {
      color: "#FFFFFF",
    },
    catTextInactive: {
      color: "#4B5563",
    },

    // Map Area
    mapContainer: {
      flex: 1,
      position: "relative",
    },
    mapControlButton: {
      position: "absolute",
      right: 16,
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: "#FFFFFF",
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 10,
      elevation: 6,
      zIndex: 15,
    },

    // Single Selected Salon Floating Card Styles

    // Empty / Loading
    emptyCard: {
      alignSelf: "center",
      width: CARD_WIDTH,
      backgroundColor: isDark ? "#1E1E24" : "#FFFFFF",
      borderRadius: 20,
      padding: 16,
      alignItems: "center",
      justifyContent: "center",
    },
    emptyTitle: {
      fontSize: 14,
      fontWeight: "700",
      color: isDark ? "#FFFFFF" : "#18181B",
    },
    emptySub: {
      fontSize: 12,
      fontWeight: "400",
      color: isDark ? "#888894" : "#71717A",
      marginTop: 2,
    },
    noticeCard: {
      position: "absolute",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
      elevation: 6,
    },
    noticeBtn: {
      marginTop: 12,
      paddingHorizontal: 16,
      paddingVertical: 9,
      borderRadius: 12,
      backgroundColor: "#762237",
    },
    noticeBtnText: {
      color: "#FFFFFF",
      fontSize: 13,
      fontWeight: "700",
    },
  });
}
