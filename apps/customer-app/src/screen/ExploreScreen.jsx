import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
  StyleSheet,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { C, FF } from "../theme";
import { storage } from "../services/storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import FilterModal from "../components/FilterModal";
import { useLocationStore } from "../store/useLocationStore";
import ComingSoonLocation from "../components/ComingSoonLocation";
import LocationPickerModal from "../components/LocationPickerModal";

const HISTORY_KEY = "@recent_searches";

export default function ExploreScreen({ goBack, navigate }) {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const selectedCity = useLocationStore((state) => state.selectedCity);
  const setSelectedCity = useLocationStore((state) => state.setSelectedCity);
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const LIVE_CITIES = ["brahmapur", "bhubaneswar"];
  const isCityEmpty = selectedCity && !LIVE_CITIES.includes(selectedCity.toLowerCase());
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState({});
  const [history, setHistory] = useState([
    "Royal Cut Salon",
    "Haircut near me",
    "Facial in Brahmapur",
    "Unisex salon"
  ]);

  useEffect(() => {
    loadHistory();
  }, []);

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

  const saveHistory = async (newHistory) => {
    try {
      setHistory(newHistory);
      await storage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
    } catch (e) {
      console.warn("Failed to save history", e);
    }
  };

  const handleExecuteSearch = (queryText) => {
    const q = (queryText || searchQuery).trim();
    if (!q) return;
    const filtered = history.filter(item => item.toLowerCase() !== q.toLowerCase());
    const newHistory = [q, ...filtered].slice(0, 15);
    saveHistory(newHistory);
    setSearchQuery(q);
  };

  const handleClearAll = () => {
    saveHistory([]);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.canvas }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={theme.canvas} />

      {/* Main Content Area with ScrollView */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: Math.max(insets.top || 20, 20) + 8 }
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header Bar */}
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={goBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="arrow-back" size={24} color={C.ink} />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={[styles.headerTitle, { color: C.ink }]}>Search Salons</Text>
            <Text style={[styles.headerSubtitle, { color: C.muted }]}>
              Find your favorite salons and services
            </Text>
          </View>
        </View>

        {isCityEmpty ? (
          <ComingSoonLocation
            city={selectedCity}
            onChangeLocation={() => setLocationModalVisible(true)}
            onSelectQuickCity={(c) => setSelectedCity(c)}
          />
        ) : (
          <>
            {/* Search Bar Input */}
            <View style={[styles.searchPill, { backgroundColor: C.lifted }]}>
              <Ionicons name="search-outline" size={20} color={C.muted} style={{ marginRight: 10 }} />
              <TextInput
                style={[styles.searchInput, { color: C.ink }]}
                placeholder="Search by salon name, area or service..."
                placeholderTextcolor={C.muted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={() => handleExecuteSearch(searchQuery)}
                returnKeyType="search"
                autoFocus={false}
              />
              {searchQuery.length > 0 ? (
                <TouchableOpacity onPress={() => setSearchQuery("")} style={{ padding: 4, marginRight: 6 }}>
                  <Ionicons name="close-circle" size={18} color={C.muted} />
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity 
                style={[styles.filterButton, { backgroundColor: C.surface }]}
                activeOpacity={0.8}
                onPress={() => setIsFilterOpen(true)}
              >
                <Ionicons name="options-outline" size={18} color={C.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Recent Searches */}
            {history.length > 0 && (
              <View style={styles.sectionContainer}>
                <View style={styles.historyHeader}>
                  <Text style={[styles.sectionTitle, { color: C.ink }]}>Recent Searches</Text>
                  <TouchableOpacity onPress={handleClearAll} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Text style={styles.clearText}>Clear All</Text>
                  </TouchableOpacity>
                </View>

                <View style={[styles.historyCard, { backgroundColor: C.surface, borderColor: C.border }]}>
                  {history.map((item, index) => (
                    <TouchableOpacity
                      key={`${item}-${index}`}
                      style={[
                        styles.historyItem,
                        index < history.length - 1 && {
                          borderBottomWidth: 1,
                          borderBottomColor: C.border
                        }
                      ]}
                      onPress={() => handleExecuteSearch(item)}
                      activeOpacity={0.6}
                    >
                      <Ionicons name="time-outline" size={19} color={C.muted} style={{ marginRight: 12 }} />
                      <Text style={[styles.historyText, { color: C.ink }]} numberOfLines={1}>
                        {item}
                      </Text>
                      <Ionicons name="chevron-forward" size={18} color={C.muted} />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Empty State / Center Illustration */}
            <View style={styles.illustrationContainer}>
              <View style={styles.graphicWrapper}>
                <View style={styles.blobBackgroundLarge} />
                <View style={styles.blobBackgroundSmall} />
                <View style={styles.magnifierCircle}>
                  <Ionicons name="search-outline" size={44} color={C.muted} />
                </View>
              </View>
              <Text style={[styles.illustrationTitle, { color: C.ink }]}>Search for Salons</Text>
              <Text style={[styles.illustrationSubtitle, { color: C.muted }]}>
                Type a salon name, service or area{"\n"}to find the best results
              </Text>
            </View>
          </>
        )}

      </ScrollView>

      {/* Filter Modal */}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 20,
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
    letterSpacing: 0.2,
  },
  headerSubtitle: {
    fontSize: 13,
    fontFamily: "DMSans_400Regular",
    marginTop: 2,
  },
  searchPill: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 24,
    paddingLeft: 16,
    paddingRight: 6,
    height: 48,
    marginBottom: 24,
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
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: C.ink,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Oswald_700Bold",
    marginBottom: 12,
  },
  popularRow: {
    paddingRight: 20,
  },
  popularPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 10,
  },
  pillIconBg: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  popularText: {
    fontSize: 14,
    fontFamily: "DMSans_500Medium",
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  clearText: {
    fontSize: 13,
    color: C.main,
    fontFamily: "Oswald_600SemiBold",
  },
  historyCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  historyText: {
    fontSize: 14,
    fontFamily: "DMSans_500Medium",
    flex: 1,
  },
  illustrationContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    paddingVertical: 20,
  },
  graphicWrapper: {
    width: 140,
    height: 120,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  blobBackgroundLarge: {
    position: "absolute",
    width: 100,
    height: 80,
    borderRadius: 40,
    backgroundColor: C.crimsonTint,
    transform: [{ rotate: "-15deg" }],
    top: 10,
    right: 10,
  },
  blobBackgroundSmall: {
    position: "absolute",
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: C.crimsonTint,
    bottom: 5,
    left: 15,
  },
  magnifierCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 5,
    borderColor: C.muted,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    transform: [{ rotate: "-10deg" }],
  },
  illustrationTitle: {
    fontSize: 18,
    fontFamily: "Oswald_700Bold",
    marginBottom: 6,
  },
  illustrationSubtitle: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
  },
});

