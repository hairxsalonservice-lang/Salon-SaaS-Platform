// src/store/useLocationStore.js
import { create } from "zustand";
import { storage } from "../services/storage";
import { cleanCityName, getCurrentLocation } from "../services/locationService";

const STORAGE_CITY_KEY = "@user_selected_city";

export const useLocationStore = create((set, get) => ({
  selectedCity: "Bhubaneswar",
  locationDetails: null,
  isDetecting: false,
  initialized: false,

  setSelectedCity: async (city) => {
    if (!city) return;
    const cleaned = cleanCityName(city);
    const currentLoc = get().locationDetails;
    if (currentLoc && currentLoc.city && cleanCityName(currentLoc.city).toLowerCase() !== cleaned.toLowerCase()) {
      set({ selectedCity: cleaned, locationDetails: null });
    } else {
      set({ selectedCity: cleaned });
    }
    try {
      await storage.setItem(STORAGE_CITY_KEY, cleaned);
    } catch (err) {
      console.warn("[LocationStore] Failed to save city to storage:", err);
    }
  },

  setLocationDetails: (details) => {
    if (!details) return;
    const cityName = details.city ? cleanCityName(details.city) : get().selectedCity;
    set({
      selectedCity: cityName,
      locationDetails: details,
    });
    if (cityName) {
      storage.setItem(STORAGE_CITY_KEY, cityName).catch(() => {});
    }
  },

  detectCurrentLocation: async () => {
    set({ isDetecting: true });
    try {
      const geoResult = await getCurrentLocation();
      if (
        geoResult &&
        Number.isFinite(geoResult.latitude) &&
        Number.isFinite(geoResult.longitude)
      ) {
        const detectedCity = geoResult.city
          ? cleanCityName(geoResult.city)
          : get().selectedCity;
        set({
          selectedCity: detectedCity,
          locationDetails: geoResult,
          isDetecting: false,
        });
        if (detectedCity) {
          await storage.setItem(STORAGE_CITY_KEY, detectedCity);
        }
        return geoResult;
      }
    } catch (err) {
      console.warn("[LocationStore] Auto-detect location failed:", err.message);
    } finally {
      set({ isDetecting: false });
    }
    return null;
  },

  initLocation: async () => {
    if (get().initialized) return get().selectedCity;
    set({ initialized: true });
    try {
      const saved = await storage.getItem(STORAGE_CITY_KEY);
      if (saved && saved.trim()) {
        const cleaned = cleanCityName(saved);
        set({ selectedCity: cleaned });
        return cleaned;
      }
      await get().detectCurrentLocation();
      return get().selectedCity;
    } catch (err) {
      console.warn("[LocationStore] Init failed:", err.message);
    }
    return get().selectedCity;
  },
}));
