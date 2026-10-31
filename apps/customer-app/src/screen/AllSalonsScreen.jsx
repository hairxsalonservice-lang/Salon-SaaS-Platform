// src/screen/AllSalonsScreen.jsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  StatusBar,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import SalonCard from "../components/SalonCard";
import ComingSoonLocation from "../components/ComingSoonLocation";
import LocationPickerModal from "../components/LocationPickerModal";
import FilterModal from "../components/FilterModal";
import { browseService } from "../services/browseService";
import { cleanCityName } from "../services/locationService";
import { useLocationStore } from "../store/useLocationStore";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { C } from "../theme";

const PAGE_SIZE = 7;
// The API caps a page at 100; fetch the whole city in one go and paginate on the client
const FETCH_LIMIT = 100;
const LIVE_CITIES = ["brahmapur", "bhubaneswar"];

// ids are the service.category values the API filters on
const CATEGORIES = [
  { id: "all", label: "All", iconName: "grid" },
  { id: "hair", label: "Haircut", iconName: "cut-outline" },
  { id: "skin", label: "Facials", iconName: "water-outline" },
  { id: "spa", label: "Spa", iconName: "flower-outline" },
  { id: "makeup", label: "Makeup", iconName: "rose-outline" },
  { id: "nails", label: "Nails", iconName: "hand-left-outline" },
  { id: "combo", label: "Combos", iconName: "gift-outline" },
];

// FilterModal "service type" ids -> API categories
const SERVICE_TYPE_TO_CATEGORY = { hair: "hair", facial: "skin", makeup: "makeup" };

function getReviewCount(s) {
  return s.totalReviews ?? s.reviewsCount ?? s.rating?.totalReviews ?? 0;
}

// Salons without reviews only carry a placeholder score, so they have no rating to compare
function getRealRating(s) {
  if (getReviewCount(s) === 0) return null;
  const raw = typeof s.rating === "number" ? s.rating : s.rating?.avgScore ?? s.avgScore;
  const r = typeof raw === "number" ? raw : parseFloat(raw);
  return Number.isFinite(r) ? r : null;
}

function getStartingPrice(s) {
  const p = s.startingPrice ?? s.minServicePrice ?? s.minPrice;
  return typeof p === "number" && p > 0 ? p : null;
}

export default function AllSalonsScreen({ navigate, goBack, routeParams }) {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const selectedCity = useLocationStore((state) => state.selectedCity);
  const setSelectedCity = useLocationStore((state) => state.setSelectedCity);
  const initLocation = useLocationStore((state) => state.initLocation);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [salons, setSalons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Pagination state: show 7 initially, 7 more on scroll
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filters, setFilters] = useState({
    minRating: "all",
    priceRange: "all",
    sortBy: "recommended",
    serviceType: "all",
  });

  const requestIdRef = useRef(0);
  const isCityLive = LIVE_CITIES.includes(cleanCityName(selectedCity || "").toLowerCase());

  // A category pill wins; otherwise fall back to the service type picked in the filter sheet
  const effectiveCategory =
    selectedCategory !== "all" ? selectedCategory : SERVICE_TYPE_TO_CATEGORY[filters.serviceType] || null;

  const filteredSalons = useMemo(() => {
    let list = [...salons];

    if (filters.minRating && filters.minRating !== "all") {
      const minVal = parseFloat(filters.minRating);
      list = list.filter((s) => {
        const r = getRealRating(s);
        return r !== null && r >= minVal;
      });
    }

    if (filters.priceRange && filters.priceRange !== "all") {
      list = list.filter((s) => {
        const price = getStartingPrice(s);
        if (price === null) return false;
        if (filters.priceRange === "budget") return price < 500;
        if (filters.priceRange === "moderate") return price >= 500 && price <= 1500;
        if (filters.priceRange === "luxury") return price > 1500;
        return true;
      });
    }

    if (filters.sortBy === "rating") {
      list.sort((a, b) => (getRealRating(b) ?? -1) - (getRealRating(a) ?? -1) || getReviewCount(b) - getReviewCount(a));
    } else if (filters.sortBy === "price_low") {
      list.sort((a, b) => (getStartingPrice(a) ?? Infinity) - (getStartingPrice(b) ?? Infinity));
    } else if (filters.sortBy === "price_high") {
      list.sort((a, b) => (getStartingPrice(b) ?? -Infinity) - (getStartingPrice(a) ?? -Infinity));
    }

    return list;
  }, [salons, filters]);

  // Reset pagination when the result set changes
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [selectedCity, debouncedSearch, effectiveCategory, filters]);

  const displayedSalons = useMemo(() => filteredSalons.slice(0, visibleCount), [filteredSalons, visibleCount]);

  useEffect(() => {
    if (routeParams?.city) {
      setSelectedCity(routeParams.city);
    } else {
      initLocation();
    }
  }, [routeParams?.city, initLocation, setSelectedCity]);

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchSalons = useCallback(async (silent = false) => {
    const requestId = ++requestIdRef.current;
    if (!silent) setLoading(true);
    setError(null);
    try {
      const params = { city: cleanCityName(selectedCity), limit: FETCH_LIMIT };
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
      if (effectiveCategory) params.category = effectiveCategory;

      const res = await browseService.getSalons({ ...params, bypassCache: true });
      let list = [];
      if (Array.isArray(res?.data?.data?.salons)) list = res.data.data.salons;
      else if (Array.isArray(res?.data?.salons)) list = res.data.salons;
      else if (Array.isArray(res?.data?.data)) list = res.data.data;
      else if (Array.isArray(res?.data)) list = res.data;
      else if (Array.isArray(res)) list = res;

      // Ignore responses for a search/city the user has already moved on from
      if (requestId !== requestIdRef.current) return;
      setSalons(list);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      console.log("AllSalonsScreen fetch error:", err.message);
      setError("Check your internet connection and try again.");
      setSalons([]);
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [selectedCity, debouncedSearch, effectiveCategory]);

  useEffect(() => {
    fetchSalons(false);
  }, [fetchSalons]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setVisibleCount(PAGE_SIZE);
    fetchSalons(true);
  }, [fetchSalons]);

  const handleSalonPress = useCallback((salon) => {
    if (navigate) navigate("SalonDetail", { salon });
  }, [navigate]);

  // Everything is already in memory, so "loading more" is just revealing the next page
  const handleLoadMore = useCallback(() => {
    if (loading || visibleCount >= filteredSalons.length) return;
    setVisibleCount((prev) => prev + PAGE_SIZE);
  }, [loading, visibleCount, filteredSalons.length]);

  const handleApplyFilters = useCallback((next) => {
    setFilters(next);
    // Keep the pills in sync with the service type chosen in the sheet
    const mapped = SERVICE_TYPE_TO_CATEGORY[next.serviceType];
    if (mapped) setSelectedCategory(mapped);
    else if (next.serviceType === "all" && SERVICE_TYPE_TO_CATEGORY[filters.serviceType] === selectedCategory) {
      setSelectedCategory("all");
    }
  }, [filters.serviceType, selectedCategory]);

  const styles = useMemo(() => buildStyles(isDark, insets), [isDark, insets]);
  const iconColor = C.ink;
  const hasActiveFilterOrSearch = Boolean(
    debouncedSearch.trim() || effectiveCategory || filters.minRating !== "all" || filters.priceRange !== "all"
  );

  // Rendered as an element (not a component) so the search TextInput keeps focus while typing
  const listHeader = (
    <View style={styles.headerWrapper}>
      <View style={styles.headerContainer}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => (goBack ? goBack() : navigate && navigate("Home"))}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color={iconColor} />
        </TouchableOpacity>
      </View>

      {/* Search & Filter Bar */}
      <View style={styles.searchRow}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search-outline" size={20} color={C.muted} style={{ marginRight: 10 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search salons by name..."
            placeholderTextcolor={C.muted}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          {search.length > 0 ? (
            <TouchableOpacity onPress={() => setSearch("")} style={{ padding: 4 }}>
              <Ionicons name="close-circle" size={18} color={C.muted} />
            </TouchableOpacity>
          ) : null}
        </View>

        <TouchableOpacity style={styles.filterBtn} onPress={() => setFilterModalVisible(true)} activeOpacity={0.85}>
          <Ionicons name="options-outline" size={20} color={C.textLight} />
        </TouchableOpacity>
      </View>

      {/* Category Pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.catScroll}
        contentContainerStyle={styles.catScrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              style={[styles.catPill, isSelected ? styles.catPillActive : styles.catPillInactive]}
              onPress={() => setSelectedCategory(cat.id)}
              activeOpacity={0.8}
            >
              <View style={[styles.catIconWrap, isSelected && styles.catIconWrapActive]}>
                <Ionicons name={cat.iconName} size={15} color={isSelected ? C.textLight : C.main} />
              </View>
              <Text style={[styles.catText, isSelected ? styles.catTextActive : styles.catTextInactive]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Results Bar */}
      {!loading && !error && isCityLive && filteredSalons.length > 0 ? (
        <View style={styles.resultsHeaderRow}>
          <Text style={styles.resultsCountText}>
            Showing {displayedSalons.length} of {filteredSalons.length} {filteredSalons.length === 1 ? "studio" : "studios"} in {selectedCity}
          </Text>

          <TouchableOpacity style={styles.sortBtn} onPress={() => setFilterModalVisible(true)} activeOpacity={0.7}>
            <Ionicons name="swap-vertical-outline" size={14} color={iconColor} style={{ marginRight: 4 }} />
            <Text style={styles.sortBtnText}>Sort by</Text>
            <Ionicons name="chevron-down" size={14} color={iconColor} style={{ marginLeft: 2 }} />
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );

  const renderEmpty = () => {
    if (loading) {
      return (
        <View style={styles.centerBlock}>
          <ActivityIndicator size="small" color={C.main} />
          <Text style={styles.loadingText}>Loading partner studios in {selectedCity}...</Text>
        </View>
      );
    }
    if (!isCityLive) {
      return (
        <ComingSoonLocation
          city={selectedCity}
          onChangeLocation={() => setLocationModalVisible(true)}
          onSelectQuickCity={(c) => setSelectedCity(c)}
        />
      );
    }
    if (error) {
      return (
        <View style={styles.centerBlock}>
          <Ionicons name="cloud-offline-outline" size={28} color={C.muted} />
          <Text style={styles.emptyTitle}>Unable to load salons</Text>
          <Text style={styles.emptySub}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => fetchSalons(false)}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <View style={styles.centerBlock}>
        <Ionicons name="search-outline" size={28} color={C.muted} />
        <Text style={styles.emptyTitle}>{hasActiveFilterOrSearch ? "No salons match" : "No salons yet"}</Text>
        <Text style={styles.emptySub}>
          {hasActiveFilterOrSearch
            ? "Try a different search, category or filter."
            : `There are no salons listed in ${selectedCity} right now.`}
        </Text>
      </View>
    );
  };

  const listFooter =
    !loading && visibleCount < filteredSalons.length ? (
      <TouchableOpacity style={styles.loadMoreBtn} onPress={handleLoadMore} activeOpacity={0.8}>
        <Text style={styles.loadMoreBtnText}>
          Load More Salons ({filteredSalons.length - visibleCount} remaining)
        </Text>
      </TouchableOpacity>
    ) : (
      <View style={{ height: 24 }} />
    );

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={isDark ? "#0A0A0A" : C.bg} />

      <FlatList
        data={loading ? [] : displayedSalons}
        keyExtractor={(item, index) => String(item._id || item.id || index)}
        contentContainerStyle={styles.flatListContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.main} colors={[C.main]} />}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={listFooter}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.4}
        renderItem={({ item, index }) => (
          <SalonCard salon={item} isHorizontal={false} index={index} onPress={handleSalonPress} />
        )}
      />

      <LocationPickerModal
        visible={locationModalVisible}
        selectedCity={selectedCity}
        onSelectCity={(c) => setSelectedCity(c)}
        onClose={() => setLocationModalVisible(false)}
      />

      <FilterModal
        visible={filterModalVisible}
        filters={filters}
        onApplyFilters={handleApplyFilters}
        onClose={() => setFilterModalVisible(false)}
      />
    </View>
  );
}

function buildStyles(isDark, insets) {
  const bg = isDark ? "#0A0A0A" : C.bg;
  const surface = isDark ? "#141414" : C.surface;
  const lifted = isDark ? "#1A1A1A" : C.lifted;
  const border = isDark ? "rgba(255,255,255,0.06)" : C.border;
  const ink = isDark ? "#F5F3F4" : C.ink;

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: bg,
    },
    flatListContent: {
      paddingTop: Math.max(insets?.top || 20, 20) + 12,
      paddingHorizontal: 20,
      paddingBottom: 40,
    },
    scrollContent: {
      paddingTop: Math.max(insets?.top || 20, 20) + 12,
      paddingHorizontal: 20,
      paddingBottom: 40,
    },
    headerWrapper: {
      marginBottom: 8,
    },
    headerContainer: {
      marginBottom: 0,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: lifted,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 16,
    },
    searchRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 20,
    },
    searchInputContainer: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: lifted,
      height: 48,
      borderRadius: 24,
      paddingHorizontal: 16,
      marginRight: 12,
    },
    searchInput: {
      flex: 1,
      fontSize: 14,
      color: ink,
      paddingVertical: 0,
    },
    filterBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: C.main,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: C.main,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 6,
      elevation: 3,
    },
    catScroll: {
      marginBottom: 20,
    },
    catScrollContent: {
      paddingRight: 20,
    },
    catPill: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 14,
      height: 40,
      borderRadius: 20,
      marginRight: 10,
    },
    catPillActive: {
      backgroundColor: C.main,
    },
    catPillInactive: {
      backgroundColor: surface,
      borderWidth: 1,
      borderColor: border,
    },
    catIconWrap: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: C.infoBg,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 8,
    },
    catIconWrapActive: {
      backgroundColor: "rgba(255, 255, 255, 0.2)",
    },
    catText: {
      fontSize: 14,
      fontFamily: "Oswald_600SemiBold",
    },
    catTextActive: {
      color: C.textLight,
    },
    catTextInactive: {
      color: isDark ? "#F5F3F4" : C.textSecondary,
    },
    resultsHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 16,
    },
    resultsCountText: {
      fontSize: 13,
      color: C.muted,
      fontFamily: "DMSans_500Medium",
    },
    sortBtn: {
      flexDirection: "row",
      alignItems: "center",
    },
    sortBtnText: {
      fontSize: 13,
      fontFamily: "Oswald_600SemiBold",
      color: ink,
    },
    centerBlock: {
      padding: 32,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 20,
      gap: 8,
    },
    loadingText: {
      fontSize: 14,
      color: C.muted,
      marginTop: 8,
    },
    emptyTitle: {
      fontSize: 16,
      fontFamily: "Oswald_700Bold",
      color: C.ink,
    },
    emptySub: {
      fontSize: 13,
      color: C.muted,
      textAlign: "center",
    },
    retryBtn: {
      backgroundColor: C.main,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 20,
      marginTop: 8,
    },
    retryText: {
      color: C.textLight,
      fontFamily: "Oswald_600SemiBold",
      fontSize: 14,
    },
    loadMoreBtn: {
      alignSelf: "center",
      backgroundColor: C.lifted,
      paddingHorizontal: 18,
      paddingVertical: 10,
      borderRadius: 20,
      marginVertical: 12,
    },
    loadMoreBtnText: {
      fontSize: 13,
      color: C.main,
      fontFamily: "Oswald_700Bold",
    },
  });
}
