// src/screen/homeScreen.jsx
import React, { useEffect, useState, useCallback, memo } from "react";
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  Image,
  Dimensions,
} from "react-native";
import { C, S, FS, FW, R, TYPO } from "../theme";
import { useTheme } from "../context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import SalonCard from "../components/SalonCard";
import * as Location from "expo-location";
import Constants, { ExecutionEnvironment } from "expo-constants";
import PermissionPromptModal from "../components/PermissionPromptModal";
import LocationPickerModal from "../components/LocationPickerModal";
import InteractiveMapModal from "../components/InteractiveMapModal";
import ComingSoonLocation from "../components/ComingSoonLocation";
import { browseService } from "../services/browseService";
import { customerService } from "../services/customerService";
import { useAuth } from "../context/AuthContext";
import { storage } from "../services/storage";
import { cleanCityName, getCurrentLocation } from "../services/locationService";
import { useLocationStore } from "../store/useLocationStore";
import { socketClient } from "../services/socketClient";

const isExpoGo = Constants?.executionEnvironment === ExecutionEnvironment?.StoreClient;
let Notifications = null;
if (!isExpoGo) {
  try {
    Notifications = require("expo-notifications");
  } catch (e) { }
}

const DEFAULT_HERO_BANNERS = [
  {
    _id: "b-1",
    tag: "B E A U T Y · C A R E · Y O U",
    title: "Self Care\nFeels Better",
    subtitle: null, // resolved dynamically using selectedCity in the render
    ctaText: "Book Now",
    imageUrl: "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=1000&auto=format&fit=crop",
  },
  {
    _id: "b-2",
    tag: "S P E C I A L  S P A  &  G L O W",
    title: "Radiant Skin\nPure Bliss",
    subtitle: null, // resolved dynamically
    ctaText: "Explore Offers",
    imageUrl: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=1000&auto=format&fit=crop",
  },
  {
    _id: "b-3",
    tag: "E X P E R T  H A I R  C A R E",
    title: "Fresh Look\nNew Confidence",
    subtitle: null, // resolved dynamically
    ctaText: "View Salons",
    imageUrl: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=1000&auto=format&fit=crop",
  },
];

// Subtitle templates for DEFAULT_HERO_BANNERS (kept as data, not functions, to avoid non-serializable nav params)
const DEFAULT_BANNER_SUBTITLES = [
  (city) => `Book trusted salons & beauty experts in ${city}`,
  (city) => `Discover rejuvenating facial & spa treatments in ${city}`,
  (city) => `Top hair stylists and coloring specialists in ${city}`,
];

const SalonCarousel = memo(({ salons, onSalonPress, styles }) => (
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    style={styles.horizontalCarousel}
    contentContainerStyle={{ paddingLeft: S.md, paddingRight: S.xs }}
  >
    {salons.map((salon, idx) => (
      <SalonCard key={salon._id || salon.id} salon={salon} isHorizontal={true} index={idx} onPress={onSalonPress} />
    ))}
  </ScrollView>
));

const SalonVerticalList = memo(({ salons, onSalonPress, styles }) => (
  <View style={styles.verticalList}>
    {salons.map((salon, idx) => (
      <SalonCard key={`full_${salon._id || salon.id}`} salon={salon} isHorizontal={false} index={idx + 2} onPress={onSalonPress} />
    ))}
  </View>
));

const GLOBAL_SALON_CACHE = {};

function getSalonRating(s) {
  if (!s) return 0;
  if (typeof s.rating === "number" && s.rating > 0) return s.rating;
  if (typeof s.rating === "object" && s.rating !== null) {
    return s.rating.avgScore || s.rating.average || s.rating.score || s.rating.avg || 4.8;
  }
  return s.avgScore || s.avgRating || 4.8;
}

function sanitizeImageUrl(url) {
  if (!url || typeof url !== "string") return null;
  let cleaned = url.trim();
  if (!cleaned.startsWith("http://") && !cleaned.startsWith("https://")) return null;

  if (cleaned.includes("images.unsplash.com")) {
    cleaned = cleaned.replace(/auto=format&?/gi, "");
    if (!cleaned.includes("fm=jpg") && !cleaned.includes("format=jpg")) {
      cleaned += (cleaned.includes("?") ? "&" : "?") + "fm=jpg";
    }
  }

  return cleaned;
}


function HomeScreen({ navigate, onScroll }) {
  const { theme, isDark } = useTheme();
  const styles = React.useMemo(() => buildStyles(theme, isDark), [theme, isDark]);
  const palette = React.useMemo(() => getPalette(theme, isDark), [theme, isDark]);
  const { user, isAuthenticated } = useAuth();
  const selectedCity = useLocationStore((state) => state.selectedCity);
  const setSelectedCity = useLocationStore((state) => state.setSelectedCity);
  const initLocation = useLocationStore((state) => state.initLocation);
  const detectCurrentLocation = useLocationStore((state) => state.detectCurrentLocation);
  const initialCleanCity = cleanCityName(selectedCity || "Brahmapur");
  const initialSalons = GLOBAL_SALON_CACHE[initialCleanCity] || [];
  const [salons, setSalons] = useState(initialSalons);
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(initialSalons.length === 0);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [mapModalVisible, setMapModalVisible] = useState(false);
  const [permissionModalType, setPermissionModalType] = useState(null); // "location" | "notification" | null
  const [permissionLoading, setPermissionLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Filter salons to only show those with > 3 stars rating
  const topRatedSalons = React.useMemo(() => {
    return (salons || []).filter((s) => getSalonRating(s) > 3.0);
  }, [salons]);

  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const bannerScrollRef = React.useRef(null);

  const displayBanners = React.useMemo(() => {
    return banners && banners.length > 0 ? banners : DEFAULT_HERO_BANNERS;
  }, [banners]);

  useEffect(() => {
    if (!displayBanners || displayBanners.length <= 1) return;

    const screenWidth = Dimensions.get("window").width;
    const interval = setInterval(() => {
      setActiveBannerIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % displayBanners.length;
        if (bannerScrollRef.current) {
          bannerScrollRef.current.scrollTo({
            x: nextIndex * screenWidth,
            animated: true,
          });
        }
        return nextIndex;
      });
    }, 3500);

    return () => clearInterval(interval);
  }, [displayBanners]);

  const handleBannerScroll = useCallback((event) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const screenWidth = Dimensions.get("window").width;
    const newIndex = Math.round(contentOffsetX / screenWidth);
    if (newIndex >= 0 && newIndex < displayBanners.length) {
      setActiveBannerIndex(newIndex);
    }
  }, [displayBanners.length]);

  useEffect(() => {
    let active = true;
    const initLocationAndPermissions = async () => {
      try {
        await initLocation();

        // Check Location permission / GPS status
        try {
          const locPerm = await Location.getForegroundPermissionsAsync();
          if (!locPerm.granted && locPerm.canAskAgain) {
            if (active) setPermissionModalType("location");
          }
        } catch (e) { }

        // Check Notification permission
        try {
          if (Notifications) {
            const notifPerm = await Notifications.getPermissionsAsync();
            if (!notifPerm.granted && notifPerm.canAskAgain) {
              if (active) setPermissionModalType("notification");
            }
          }
        } catch (e) { }
      } catch (err) {
        console.warn("📍 [HOME] Auto-location detection fallback:", err.message);
      }
    };
    initLocationAndPermissions();
    return () => { active = false; };
  }, [initLocation]);

  const handleEnablePermission = async () => {
    setPermissionLoading(true);
    if (permissionModalType === "location") {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          const geoResult = await getCurrentLocation();
          if (geoResult && geoResult.city) {
            const detectedCity = cleanCityName(geoResult.city);
            setSelectedCity(detectedCity);
            await storage.setItem("@user_selected_city", detectedCity);
          }
        }
      } catch (e) {
        console.warn("Location permission error:", e);
      }

      // Automatically move to Notification permission check if needed
      try {
        if (Notifications) {
          const notifPerm = await Notifications.getPermissionsAsync();
          if (!notifPerm.granted && notifPerm.canAskAgain) {
            setPermissionLoading(false);
            setPermissionModalType("notification");
            return;
          }
        }
      } catch (e) { }

      setPermissionModalType(null);
    } else if (permissionModalType === "notification") {
      try {
        if (Notifications) {
          await Notifications.requestPermissionsAsync();
        }
      } catch (e) {
        console.warn("Notification permission error:", e);
      }
      setPermissionModalType(null);
    }
    setPermissionLoading(false);
  };

  const handleSkipPermission = async () => {
    if (permissionModalType === "location") {
      try {
        if (Notifications) {
          const notifPerm = await Notifications.getPermissionsAsync();
          if (!notifPerm.granted && notifPerm.canAskAgain) {
            setPermissionModalType("notification");
            return;
          }
        }
      } catch (e) { }
      setPermissionModalType(null);
    } else {
      setPermissionModalType(null);
    }
  };

  const salonCacheRef = React.useRef({});
  const loadRequestIdRef = React.useRef(0);
  const prevCityRef = React.useRef(selectedCity);

  useEffect(() => {
    if (prevCityRef.current !== selectedCity) {
      prevCityRef.current = selectedCity;
      const cleanCity = cleanCityName(selectedCity);
      const cached = GLOBAL_SALON_CACHE[cleanCity] || salonCacheRef.current[cleanCity];
      if (cached && cached.length > 0) { setSalons(cached); setLoading(false); }
      else { setSalons([]); setLoading(true); }
      setLoadError(null);
    }
  }, [selectedCity]);

  const loadData = useCallback(async (silent = false) => {
    const cleanCity = cleanCityName(selectedCity);
    const cachedList = GLOBAL_SALON_CACHE[cleanCity] || salonCacheRef.current[cleanCity] || [];
    const hasCachedData = cachedList.length > 0;
    // A slower response for a previously selected city must not overwrite the current one
    const requestId = ++loadRequestIdRef.current;
    const isStale = () => requestId !== loadRequestIdRef.current;
    try {
      setLoadError(null);
      if (!silent && !hasCachedData) setLoading(true);
      const res = await browseService.getSalons({ city: cleanCity, limit: 100, bypassCache: true });
      const salonList = res.data?.salons || (Array.isArray(res.data) ? res.data : []);
      salonCacheRef.current[cleanCity] = salonList;
      GLOBAL_SALON_CACHE[cleanCity] = salonList;
      if (isStale()) return;
      setSalons(salonList);

      try {
        const bannerRes = await browseService.getBanners({ city: cleanCity, bypassCache: true });
        const fetchedBanners =
          (Array.isArray(bannerRes?.data) ? bannerRes.data : null) ||
          (Array.isArray(bannerRes?.data?.data) ? bannerRes.data.data : null) ||
          (Array.isArray(bannerRes) ? bannerRes : null) ||
          [];
        if (!isStale()) setBanners(fetchedBanners);
      } catch (e) {
        console.warn("Failed to fetch banners", e);
      }

      // Review prompts for completed visits are handled by the Bookings tab, which is mounted alongside this one
      if (isAuthenticated) {
        try {
          const unreadRes = await customerService.getUnreadCount();
          const count = unreadRes?.data?.unreadCount ?? unreadRes?.data?.count ?? 0;
          if (!isStale()) setUnreadCount(count);
        } catch (e) { }
      } else {
        setUnreadCount(0);
      }
    } catch (err) {
      if (isStale()) return;
      if (!hasCachedData) { setSalons([]); setLoadError(err.message || "Unable to connect"); }
    } finally {
      if (!isStale()) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [selectedCity, isAuthenticated]);

  useEffect(() => {
    loadData(false);
  }, [selectedCity, isAuthenticated, loadData]);

  useEffect(() => {
    const cleanupSocket = socketClient.onAppointmentStatusChanged(({ appointment }) => {
      loadData(true);
    });
    return () => {
      if (typeof cleanupSocket === "function") cleanupSocket();
    };
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData(true);
  }, [loadData]);

  const handleSalonPress = useCallback((salon) => {
    if (navigate) navigate("SalonDetail", { salonId: salon._id || salon.id, salon });
  }, [navigate]);

  const handleSearchClick = useCallback(() => { if (navigate) navigate("Explore"); }, [navigate]);
  // Only track clicks for real DB banners — valid 24-char hex MongoDB ObjectIds.
  // Default placeholder banners (_id: "b-1", "b-2", "b-3") must NOT be sent to the API.
  const IS_OBJECT_ID = /^[a-f\d]{24}$/i;

  const handleBannerPress = useCallback((banner) => {
    if (!navigate) return;
    const bannerId = banner._id || banner.id;
    if (bannerId && IS_OBJECT_ID.test(bannerId)) {
      browseService.trackBannerClick(bannerId);
    }
    // Resolve subtitle to a plain string BEFORE passing to navigation.
    // Passing a function as a route param causes a non-serializable warning
    // and a 'Functions are not valid as a React child' crash in BannerDetail.
    const bannerIdx = displayBanners.indexOf(banner);
    const resolvedSubtitle =
      typeof banner.subtitle === "function"
        ? banner.subtitle(selectedCity)
        : typeof banner.subtitle === "string" && banner.subtitle
        ? banner.subtitle
        : (DEFAULT_BANNER_SUBTITLES[bannerIdx] || DEFAULT_BANNER_SUBTITLES[0])(selectedCity);
    navigate("BannerDetail", {
      banner: { ...banner, subtitle: resolvedSubtitle },
    });
  }, [navigate, displayBanners, selectedCity]);
  const handleExplore = useCallback(() => { if (navigate) navigate("Explore"); }, [navigate]);
  const handleCitySelect = useCallback((city) => { setSelectedCity(city); storage.setItem("@user_selected_city", city); }, []);
  const handleLocationClose = useCallback(() => setLocationModalVisible(false), []);
  const handleLocationClick = useCallback(() => setLocationModalVisible(true), []);
  const handleSearchSubmit = useCallback((term) => { if (navigate) navigate("Explore", { search: term }); }, [navigate]);

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroller}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.primary} colors={[palette.primary]} progressBackgroundColor={palette.surface} />}
      >
        {/* NEW HEADER */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={handleLocationClick} style={styles.headerLocation}>
            <Ionicons name="location" size={22} color={palette.primary} />
            <View style={{ marginLeft: 6 }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text style={styles.headerCityText}>{selectedCity}</Text>
                <Ionicons name="chevron-down" size={14} color={palette.body} style={{ marginLeft: 4 }} />
              </View>
              <Text style={styles.headerSubtitleText}>Your beauty destination</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBellBtn} onPress={() => navigate && navigate("NotificationCenter")}>
            <Ionicons name="notifications-outline" size={22} color={palette.ink} />
            {unreadCount > 0 ? <View style={styles.headerBellBadge} /> : null}
          </TouchableOpacity>
        </View>

        {/* HERO BANNER & CATEGORIES — Only shown when salons are available */}
        {!loading && (salons.length === 0 || loadError) ? null : (
          <>
            {/* HERO BANNER - AUTOMATIC SLIDE */}
            <View style={{ marginBottom: 24 }}>
              <ScrollView
                ref={bannerScrollRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={handleBannerScroll}
                scrollEventThrottle={16}
                decelerationRate="fast"
              >
                {displayBanners.map((banner, idx) => {
                  const screenWidth = Dimensions.get("window").width;
                  const cardWidth = screenWidth - 32;
                  const titleText = banner.title || "Self Care\nFeels Better";
                  // Resolve subtitle: DB banners have a plain string; default banners have null
                  // with a companion template in DEFAULT_BANNER_SUBTITLES keyed by banner index.
                  let subText;
                  if (typeof banner.subtitle === "string" && banner.subtitle) {
                    subText = banner.subtitle;
                  } else if (typeof banner.subtitle === "function") {
                    // Safety fallback: DB banners should never have function subtitles,
                    // but guard here just in case.
                    subText = banner.subtitle(selectedCity);
                  } else {
                    // Default banner: look up the template by index
                    const templateFn = DEFAULT_BANNER_SUBTITLES[idx];
                    subText = templateFn
                      ? templateFn(selectedCity)
                      : `Book trusted salons & beauty experts in ${selectedCity}`;
                  }
                  const tagText = banner.tag || banner.eyebrow || "B E A U T Y · C A R E · Y O U";
                  const ctaText = banner.ctaText || "Book Now";

                  const rawImg = banner.imageUrl || banner.image || banner.photoUrl;
                  const bannerImgUri = sanitizeImageUrl(rawImg) || "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=1000&fit=crop&fm=jpg";

                  return (
                    <View key={banner._id || idx} style={{ width: screenWidth, alignItems: "center" }}>
                      <TouchableOpacity
                        activeOpacity={0.92}
                        onPress={() => handleBannerPress(banner)}
                        style={[
                          styles.heroBannerContainer,
                          { width: cardWidth, marginBottom: 0, marginHorizontal: 0 },
                        ]}
                      >
                        <Image source={{ uri: bannerImgUri }} style={styles.heroBannerImage} resizeMode="cover" />
                        <View style={styles.heroBannerOverlay} pointerEvents="none" />

                        <View style={styles.heroBannerContent}>
                          <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", marginBottom: 4 }}>
                            <Text style={styles.heroEyebrow}>{tagText}</Text>
                            {banner.promoCode ? (
                              <View style={styles.promoCodeBadge}>
                                <Ionicons name="pricetag" size={10} color="#FFFFFF" style={{ marginRight: 3 }} />
                                <Text style={styles.promoCodeBadgeText}>Code: {banner.promoCode}</Text>
                              </View>
                            ) : null}
                          </View>
                          <Text style={styles.heroTitle}>{titleText}</Text>
                          <Text style={styles.heroSubtitle}>{subText}</Text>

                          <View style={styles.heroBookBtn}>
                            <Text style={styles.heroBookBtnText}>{ctaText}</Text>
                            <Ionicons name="arrow-forward" size={16} color="#FFFFFF" style={{ marginLeft: 6 }} />
                          </View>
                        </View>

                        <View style={styles.heroDotsRow}>
                          {displayBanners.map((_, dotIdx) => (
                            <View
                              key={dotIdx}
                              style={[styles.heroDot, dotIdx === activeBannerIndex && styles.heroDotActive]}
                            />
                          ))}
                        </View>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </ScrollView>
            </View>

            {/* CATEGORIES */}
            <View style={styles.categoriesContainer}>
              {[
                { id: "haircut", label: "Haircut", icon: "cut-outline" },
                { id: "facial", label: "Facial", icon: "happy-outline" },
                { id: "makeup", label: "Makeup", icon: "color-wand-outline" },
                { id: "massage", label: "Massage", icon: "leaf-outline" },
                { id: "nails", label: "Nails", icon: "hand-left-outline" },
              ].map((cat, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.categoryItem}
                  onPress={() =>
                    navigate && navigate("CategoryDetail", { category: cat.label })
                  }
                >
                  <View style={[styles.categoryIconCircle, { backgroundColor: CATEGORY_TINTS[cat.id][isDark ? 1 : 0] }]}>
                    <Ionicons name={cat.icon} size={24} color={palette.ink} />
                  </View>
                  <Text style={styles.categoryLabel}>{cat.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {loading ? (
          <View style={styles.emptyBlock}>
            <ActivityIndicator size="small" color={palette.primary} />
            <Text style={styles.emptyText}>Loading salons in {selectedCity}…</Text>
          </View>
        ) : loadError && salons.length === 0 ? (
          <View style={styles.emptyBlock}>
            <Ionicons name="cloud-offline-outline" size={32} color={palette.muted} />
            <Text style={styles.emptyTitle}>Couldn't load salons</Text>
            <Text style={styles.emptyText}>Check your internet connection and try again.</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => loadData(false)} activeOpacity={0.85}>
              <Ionicons name="refresh" size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.retryBtnText}>Try again</Text>
            </TouchableOpacity>
          </View>
        ) : salons.length === 0 ? (
          <ComingSoonLocation
            city={selectedCity}
            onChangeLocation={handleLocationClick}
            onSelectQuickCity={handleCitySelect}
          />
        ) : (
          <>
            {/* Section: Top Rated Salons */}
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleBlock}>
                <Text style={styles.sectionTitle}>Top Rated Salons Near You</Text>
              </View>
              <TouchableOpacity style={styles.seeAllBtn} onPress={() => navigate && navigate("AllSalons", { city: selectedCity })}>
                <Text style={styles.seeAllText}>See All</Text>
                <Ionicons name="arrow-forward" size={14} color={palette.ink} style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            </View>

            {topRatedSalons.length > 0 ? (
              <SalonCarousel salons={topRatedSalons} onSalonPress={handleSalonPress} styles={styles} />
            ) : null}

            {/* THANK YOU LETTER */}
            <View style={styles.noteCard}>
              <Text style={styles.noteEyebrow}>
                A NOTE FROM US
              </Text>
              <Text style={styles.noteQuote}>
                "Thank you for letting us be a part of your beauty journey. We promise to bring you the best experts, the finest salons, and an experience you'll love."
              </Text>
              <Text style={styles.noteSignature}>
                — The Salon Team
              </Text>
            </View>

            {/* Section: All Studios */}
            {/* <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleBlock}>
                <Text style={styles.sectionTitle}>Every salon in {selectedCity}</Text>
              </View>
            </View>

            <SalonVerticalList salons={paginatedSalons} onSalonPress={handleSalonPress} styles={styles} /> */}

          </>
        )}

        {/* 80px Section rhythm bottom padding per cursor/DESIGN.md */}
        <View style={{ height: S.section }} />
      </ScrollView>

      <PermissionPromptModal
        visible={!!permissionModalType}
        type={permissionModalType || "location"}
        onEnable={handleEnablePermission}
        onSkip={handleSkipPermission}
        loading={permissionLoading}
      />
      <LocationPickerModal visible={locationModalVisible} selectedCity={selectedCity} onSelectCity={handleCitySelect} onClose={handleLocationClose} />
      <InteractiveMapModal visible={mapModalVisible} onClose={() => setMapModalVisible(false)} salons={salons} onSelectSalon={handleSalonPress} />
    </View>
  );
}

export default memo(HomeScreen);

// Category tile tints — pastel on light, translucent on dark so icons stay readable
const CATEGORY_TINTS = {
  haircut: ["#FCE8E8", "rgba(230, 57, 115, 0.16)"],
  facial: ["#FEF1E6", "rgba(245, 158, 11, 0.16)"],
  makeup: ["#F1EBFC", "rgba(139, 92, 246, 0.18)"],
  massage: ["#E9F8F1", "rgba(16, 185, 129, 0.16)"],
  nails: ["#FDF0F3", "rgba(236, 72, 153, 0.16)"],
};

function getPalette(theme = {}, isDark = false) {
  return {
    canvas: theme.canvas || (isDark ? "#0D0D0D" : "#FBFBF9"),
    header: isDark ? theme.canvas || "#0D0D0D" : "#FFFFFF",
    surface: theme.surface || (isDark ? "#1C1C1E" : "#FFFFFF"),
    ink: theme.ink || (isDark ? "#F4F4F2" : "#1E1E1E"),
    body: isDark ? "#D0D0CB" : "#333333",
    muted: isDark ? "#A0A09C" : "#666666",
    hairline: theme.hairline || (isDark ? "#2A2A2C" : "#EEEEEE"),
    primary: theme.primary || (isDark ? "#E63973" : "#B3261E"),
  };
}

function buildStyles(theme, isDark) {
  const p = getPalette(theme, isDark);

  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: p.canvas,
    },
    scroller: {
      flex: 1,
    },
    content: {
      paddingBottom: 56,
    },

    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-end",
      paddingHorizontal: S.md,
      marginBottom: S.sm,
    },
    sectionTitleBlock: {
      flex: 1,
    },
    sectionTitle: {
      fontSize: FS.titleLg,
      fontWeight: "700",
      color: p.ink,
      letterSpacing: -0.32,
    },
    seeAllBtn: {
      flexDirection: "row",
      alignItems: "center",
    },
    seeAllText: {
      fontSize: 13,
      fontWeight: "600",
      color: p.ink,
    },

    // Header
    headerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingTop: 54,
      paddingBottom: 16,
      backgroundColor: p.header,
    },
    headerLocation: {
      flexDirection: "row",
      alignItems: "center",
    },
    headerCityText: {
      fontSize: 16,
      fontWeight: "700",
      color: p.ink,
    },
    headerSubtitleText: {
      fontSize: 12,
      color: p.muted,
      marginTop: 2,
    },
    headerBellBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: p.surface,
      borderWidth: 1,
      borderColor: p.hairline,
      alignItems: "center",
      justifyContent: "center",
    },
    headerBellBadge: {
      position: "absolute",
      top: 10,
      right: 12,
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: "#FF3B30",
    },

    // Hero banner — a cream wash on light, a dark scrim on dark, so text contrast holds either way
    heroBannerContainer: {
      marginHorizontal: 16,
      borderRadius: 16,
      overflow: "hidden",
      height: 220,
      backgroundColor: isDark ? p.surface : "#F3EBE1",
      marginBottom: 24,
    },
    heroBannerImage: {
      ...StyleSheet.absoluteFillObject,
      width: "100%",
      height: "100%",
      zIndex: 0,
    },
    heroBannerOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: isDark ? "rgba(10, 10, 12, 0.66)" : "rgba(245, 239, 230, 0.72)",
      zIndex: 1,
    },
    heroBannerContent: {
      ...StyleSheet.absoluteFillObject,
      padding: 20,
      justifyContent: "center",
      zIndex: 10,
      elevation: 10,
    },
    heroEyebrow: {
      fontSize: 10,
      fontWeight: "700",
      color: isDark ? "#E5B05D" : "#6D554D",
      letterSpacing: 1.5,
      marginBottom: 0,
    },
    promoCodeBadge: {
      backgroundColor: "rgba(179, 38, 30, 0.90)",
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      flexDirection: "row",
      alignItems: "center",
      marginLeft: 8,
    },
    promoCodeBadgeText: {
      color: "#FFFFFF",
      fontSize: 10,
      fontWeight: "700",
      letterSpacing: 0.5,
    },
    heroTitle: {
      fontSize: 26,
      fontWeight: "800",
      color: isDark ? "#FFFFFF" : "#1E1E1E",
      lineHeight: 32,
      marginBottom: 8,
    },
    heroSubtitle: {
      fontSize: 12,
      color: isDark ? "rgba(255, 255, 255, 0.82)" : "#333333",
      lineHeight: 18,
      marginBottom: 16,
    },
    heroBookBtn: {
      backgroundColor: isDark ? p.primary : "#1E1E1E",
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 24,
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "flex-start",
    },
    heroBookBtnText: {
      color: "#FFFFFF",
      fontSize: 13,
      fontWeight: "600",
    },
    heroDotsRow: {
      flexDirection: "row",
      position: "absolute",
      bottom: 16,
      left: 20,
      gap: 6,
    },
    heroDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: isDark ? "rgba(255, 255, 255, 0.3)" : "rgba(0, 0, 0, 0.2)",
    },
    heroDotActive: {
      width: 16,
      backgroundColor: isDark ? "#FFFFFF" : "#5D3B3E",
    },

    // Categories
    categoriesContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      paddingHorizontal: 16,
      marginBottom: 32,
    },
    categoryItem: {
      flex: 1,
      alignItems: "center",
    },
    categoryIconCircle: {
      width: 50,
      height: 50,
      borderRadius: 25,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 8,
    },
    categoryLabel: {
      fontSize: 12,
      color: p.body,
      fontWeight: "500",
      textAlign: "center",
    },

    // "A note from us" card
    noteCard: {
      marginHorizontal: 16,
      marginTop: 16,
      minHeight: 140,
      borderRadius: 16,
      padding: 20,
      justifyContent: "center",
      backgroundColor: isDark ? "#1F1A16" : "#F3EBE1",
      borderWidth: isDark ? 1 : 0,
      borderColor: isDark ? "#2E2620" : "transparent",
    },
    noteEyebrow: {
      fontSize: 14,
      fontWeight: "700",
      color: isDark ? "#C9A68E" : "#6D554D",
      letterSpacing: 1.5,
      marginBottom: 12,
      textAlign: "center",
    },
    noteQuote: {
      fontSize: 18,
      fontStyle: "italic",
      color: p.ink,
      lineHeight: 26,
      textAlign: "center",
      marginBottom: 12,
    },
    noteSignature: {
      fontSize: 14,
      fontWeight: "600",
      color: isDark ? "#D9B8A8" : "#5D3B3E",
      textAlign: "center",
    },

    horizontalCarousel: {
      marginBottom: S.sm,
    },
    verticalList: {
      paddingHorizontal: S.md,
    },

    // Empty / loading / error states
    emptyBlock: {
      paddingVertical: S.xxl,
      alignItems: "center",
      marginHorizontal: S.md,
      backgroundColor: p.surface,
      borderRadius: R.lg,
      borderWidth: 1,
      borderColor: p.hairline,
      padding: S.lg,
      gap: S.xs,
    },
    emptyTitle: {
      fontSize: FS.body,
      fontWeight: "700",
      color: p.ink,
      textAlign: "center",
    },
    emptyText: {
      fontSize: FS.bodySm,
      color: p.muted,
      textAlign: "center",
    },
    retryBtn: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 14,
      paddingHorizontal: 20,
      height: 42,
      borderRadius: 12,
      backgroundColor: p.primary,
    },
    retryBtnText: {
      color: "#FFFFFF",
      fontSize: 14,
      fontWeight: "700",
    },
  });
}
