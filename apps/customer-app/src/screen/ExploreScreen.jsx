import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { C, FF } from "../theme";
import { storage } from "../services/storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import FilterModal from "../components/FilterModal";
import { useLocationStore } from "../store/useLocationStore";
import { browseService } from "../services/browseService";
import { cleanCityName } from "../services/locationService";
import ComingSoonLocation from "../components/ComingSoonLocation";
import LocationPickerModal from "../components/LocationPickerModal";
import SalonCard from "../components/SalonCard";

const HISTORY_KEY = "@recent_searches";

export default function ExploreScreen({ goBack, navigate, routeParams }) {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => getStyles(isDark, theme), [isDark, theme]);
  const selectedCity = useLocationStore((state) => state.selectedCity);
  const setSelectedCity = useLocationStore((state) => state.setSelectedCity);
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const LIVE_CITIES = ["brahmapur", "bhubaneswar"];
  const isCityEmpty = selectedCity && !LIVE_CITIES.includes(selectedCity.toLowerCase());

  const initialSearch = routeParams?.search || "";
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [debouncedQuery, setDebouncedQuery] = useState(initialSearch);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState({});
  const [history, setHistory] = useState([]);

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const requestIdRef = useRef(0);
  const inputRef = useRef(null);

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery.trim()), 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (!debouncedQuery) {
      setResults([]);
      setSearched(false);
      return;
    }
    fetchResults(debouncedQuery);
  }, [debouncedQuery, selectedCity]);

  const fetchResults = useCallback(async (query) => {
    const reqId = ++requestIdRef.current;
    setLoading(true);
    setSearched(true);
    try {
      const params = {
        city: cleanCityName(selectedCity),
        search: query,
        limit: 50,
        bypassCache: true,
      };
      const res = await browseService.getSalons(params);
      let list = [];
      if (Array.isArray(res?.data?.data?.salons)) list = res.data.data.salons;
      else if (Array.isArray(res?.data?.salons)) list = res.data.salons;
      else if (Array.isArray(res?.data?.data)) list = res.data.data;
      else if (Array.isArray(res?.data)) list = res.data;
      else if (Array.isArray(res)) list = res;

      if (reqId !== requestIdRef.current) return;
      setResults(list);
    } catch (err) {
      if (reqId !== requestIdRef.current) return;
      console.warn("ExploreScreen search error:", err?.message);
      setResults([]);
    } finally {
      if (reqId === requestIdRef.current) setLoading(false);
    }
  }, [selectedCity]);

  const loadHistory = async () => {
    try {
      const data = await storage.getItem(HISTORY_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setHistory(parsed);
        }
      }
    } catch (e) {
      console.warn("Failed to load history", e);
    }
  };

  const saveToHistory = (q) => {
    const filtered = history.filter(item => item.toLowerCase() !== q.toLowerCase());
    const newHistory = [q, ...filtered].slice(0, 15);
    setHistory(newHistory);
    storage.setItem(HISTORY_KEY, JSON.stringify(newHistory)).catch(() => {});
  };

  const handleSubmitSearch = () => {
    const q = searchQuery.trim();
    if (!q) return;
    saveToHistory(q);
    setDebouncedQuery(q);
  };

  const handleHistoryTap = (item) => {
    setSearchQuery(item);
    setDebouncedQuery(item);
    saveToHistory(item);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setDebouncedQuery("");
    setResults([]);
    setSearched(false);
    inputRef.current?.focus();
  };

  const handleClearAll = () => {
    setHistory([]);
    storage.setItem(HISTORY_KEY, JSON.stringify([])).catch(() => {});
  };

  const handleSalonPress = useCallback((salon) => {
    if (navigate) navigate("SalonDetail", { salon });
  }, [navigate]);

  const showHistory = !searched && history.length > 0;
  const showEmptyIllustration = !searched && history.length === 0;
  const showResults = searched;

  return (
    <View style={[styles.container, { backgroundColor: theme.canvas }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={theme.canvas} />

      <View style={[styles.header, { paddingTop: Math.max(insets.top || 20, 20) + 8 }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={goBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="arrow-back" size={24} color={theme.ink} />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={[styles.headerTitle, { color: theme.ink }]}>Search Salons</Text>
            <Text style={[styles.headerSubtitle, { color: theme.muted }]}>
              Find your favorite salons and services
            </Text>
          </View>
        </View>

        {!isCityEmpty && (
          <View style={styles.searchPill}>
            <Ionicons name="search-outline" size={20} color={theme.muted} style={{ marginRight: 10 }} />
            <TextInput
              ref={inputRef}
              style={[styles.searchInput, { color: theme.ink }]}
              placeholder="Search by salon name, area or service..."
              placeholderTextColor={theme.muted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSubmitSearch}
              returnKeyType="search"
              autoFocus
            />
            {searchQuery.length > 0 ? (
              <TouchableOpacity onPress={handleClearSearch} style={{ padding: 4, marginRight: 6 }}>
                <Ionicons name="close-circle" size={18} color={theme.muted} />
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              style={styles.filterButton}
              activeOpacity={0.8}
              onPress={() => setIsFilterOpen(true)}
            >
              <Ionicons name="options-outline" size={18} color={theme.ink} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {isCityEmpty ? (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          <ComingSoonLocation
            city={selectedCity}
            onChangeLocation={() => setLocationModalVisible(true)}
            onSelectQuickCity={(c) => setSelectedCity(c)}
          />
        </ScrollView>
      ) : showResults ? (
        <FlatList
          data={results}
          keyExtractor={(item) => String(item._id || item.id)}
          contentContainerStyle={styles.resultsContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <SalonCard salon={item} isHorizontal={false} index={index} onPress={handleSalonPress} />
          )}
          ListHeaderComponent={
            !loading ? (
              <Text style={styles.resultsCount}>
                {results.length === 0
                  ? `No results for "${debouncedQuery}"`
                  : `${results.length} ${results.length === 1 ? "result" : "results"} for "${debouncedQuery}"`}
              </Text>
            ) : null
          }
          ListEmptyComponent={
            loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={theme.primary} />
                <Text style={styles.loadingText}>Searching...</Text>
              </View>
            ) : (
              <View style={styles.noResultsContainer}>
                <View style={styles.noResultsIcon}>
                  <Ionicons name="search-outline" size={28} color={theme.muted} />
                </View>
                <Text style={styles.noResultsTitle}>No salons found</Text>
                <Text style={styles.noResultsSub}>Try a different name, service or area</Text>
              </View>
            )
          }
        />
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {showHistory && (
            <View style={styles.sectionContainer}>
              <View style={styles.historyHeader}>
                <Text style={[styles.sectionTitle, { color: theme.ink }]}>Recent Searches</Text>
                <TouchableOpacity onPress={handleClearAll} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Text style={styles.clearText}>Clear All</Text>
                </TouchableOpacity>
              </View>

              <View style={[styles.historyCard, { backgroundColor: theme.surface, borderColor: theme.hairline }]}>
                {history.map((item, index) => (
                  <TouchableOpacity
                    key={`${item}-${index}`}
                    style={[
                      styles.historyItem,
                      index < history.length - 1 && {
                        borderBottomWidth: 1,
                        borderBottomColor: theme.hairline,
                      }
                    ]}
                    onPress={() => handleHistoryTap(item)}
                    activeOpacity={0.6}
                  >
                    <Ionicons name="time-outline" size={19} color={theme.muted} style={{ marginRight: 12 }} />
                    <Text style={[styles.historyText, { color: theme.ink }]} numberOfLines={1}>
                      {item}
                    </Text>
                    <Ionicons name="arrow-forward-outline" size={16} color={theme.muted} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {showEmptyIllustration && (
            <View style={styles.illustrationContainer}>
              <View style={styles.graphicWrapper}>
                <View style={styles.blobBackgroundLarge} />
                <View style={styles.blobBackgroundSmall} />
                <View style={styles.magnifierCircle}>
                  <Ionicons name="search-outline" size={44} color={theme.muted} />
                </View>
              </View>
              <Text style={[styles.illustrationTitle, { color: theme.ink }]}>Search for Salons</Text>
              <Text style={[styles.illustrationSubtitle, { color: theme.muted }]}>
                Type a salon name, service or area{"\n"}to find the best results
              </Text>
            </View>
          )}
        </ScrollView>
      )}

      <FilterModal
        visible={isFilterOpen}
        filters={filters}
        onApplyFilters={(newFilters) => {
          setFilters(newFilters);
          setIsFilterOpen(false);
        }}
        onClose={() => setIsFilterOpen(false)}
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

function getStyles(isDark, theme) {
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      paddingHorizontal: 20,
      paddingBottom: 8,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      marginBottom: 16,
    },
    backButton: {
      paddingRight: 14,
      paddingTop: 4,
    },
    titleContainer: {
      flex: 1,
    },
    headerTitle: {
      fontFamily: FF.displayBold,
      fontSize: 22,
      letterSpacing: 0.3,
    },
    headerSubtitle: {
      fontSize: 13,
      fontFamily: "DMSans_400Regular",
      marginTop: 2,
    },
    searchPill: {
      flexDirection: "row",
      alignItems: "center",
      borderRadius: 14,
      paddingLeft: 16,
      paddingRight: 6,
      height: 48,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
      backgroundColor: isDark ? "rgba(255,255,255,0.04)" : C.lifted,
    },
    searchInput: {
      flex: 1,
      fontSize: 14,
      fontFamily: "DMSans_400Regular",
      paddingVertical: 0,
    },
    filterButton: {
      width: 36,
      height: 36,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: isDark ? "rgba(255,255,255,0.08)" : C.surface,
    },

    // Results
    resultsContent: {
      paddingHorizontal: 20,
      paddingBottom: 40,
    },
    resultsCount: {
      fontSize: 13,
      fontFamily: "DMSans_400Regular",
      color: C.muted,
      marginBottom: 12,
    },
    loadingContainer: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 60,
    },
    loadingText: {
      marginTop: 10,
      fontSize: 13,
      fontFamily: "DMSans_400Regular",
      color: C.muted,
    },
    noResultsContainer: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 50,
    },
    noResultsIcon: {
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: isDark ? "rgba(255,96,130,0.12)" : C.crimsonTint,
      marginBottom: 12,
    },
    noResultsTitle: {
      fontSize: 16,
      fontFamily: "Oswald_600SemiBold",
      color: C.ink,
    },
    noResultsSub: {
      marginTop: 4,
      fontSize: 13,
      fontFamily: "DMSans_400Regular",
      color: C.muted,
    },

    // History
    sectionContainer: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 16,
      fontFamily: "Oswald_600SemiBold",
      letterSpacing: 0.3,
    },
    historyHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    },
    clearText: {
      fontSize: 12,
      color: C.main,
      fontFamily: "DMSans_600SemiBold",
    },
    historyCard: {
      borderRadius: 16,
      borderWidth: 1,
      overflow: "hidden",
    },
    historyItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 13,
      paddingHorizontal: 16,
    },
    historyText: {
      fontSize: 14,
      fontFamily: "DMSans_400Regular",
      flex: 1,
    },

    // Illustration
    illustrationContainer: {
      alignItems: "center",
      justifyContent: "center",
      marginTop: 32,
      paddingVertical: 20,
    },
    graphicWrapper: {
      width: 140,
      height: 120,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 20,
    },
    blobBackgroundLarge: {
      position: "absolute",
      width: 100,
      height: 80,
      borderRadius: 40,
      backgroundColor: isDark ? "rgba(255,96,130,0.12)" : C.crimsonTint,
      transform: [{ rotate: "-15deg" }],
      top: 10,
      right: 10,
    },
    blobBackgroundSmall: {
      position: "absolute",
      width: 70,
      height: 70,
      borderRadius: 35,
      backgroundColor: isDark ? "rgba(255,96,130,0.08)" : C.crimsonTint,
      bottom: 5,
      left: 15,
    },
    magnifierCircle: {
      width: 72,
      height: 72,
      borderRadius: 36,
      borderWidth: 4,
      borderColor: isDark ? "rgba(255,255,255,0.15)" : C.muted,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "transparent",
      transform: [{ rotate: "-10deg" }],
    },
    illustrationTitle: {
      fontSize: 18,
      fontFamily: "Oswald_600SemiBold",
      marginBottom: 6,
      letterSpacing: 0.3,
    },
    illustrationSubtitle: {
      fontSize: 13,
      fontFamily: "DMSans_400Regular",
      textAlign: "center",
      lineHeight: 20,
    },
  });
}
