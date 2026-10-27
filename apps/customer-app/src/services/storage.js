// src/services/storage.js
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const memoryStore = new Map();

// SecureStore keys may only contain alphanumeric characters, '.', '-', and '_'
function toSecureKey(key) {
  if (typeof key !== "string") return null;
  const cleaned = key.replace(/^[^a-zA-Z0-9]+/, "").replace(/[^a-zA-Z0-9._-]/g, "_");
  if (!cleaned || !/^[\w.-]+$/.test(cleaned)) return null;
  return cleaned;
}

const SECURE_STORE_MAX_BYTES = 2048;

export const storage = {
  getItem: async (key) => {
    if (!key || typeof key !== "string") return null;

    try {
      // 1. Web localStorage
      if (Platform.OS === "web" && typeof window !== "undefined" && window.localStorage) {
        const webVal = window.localStorage.getItem(key);
        if (webVal && webVal !== "undefined" && webVal !== "null") {
          memoryStore.set(key, webVal);
          return webVal;
        }
      }

      // 2. Try SecureStore (with sanitized key for securely persisted tokens / values)
      const secKey = toSecureKey(key);
      if (secKey && Platform.OS !== "web") {
        try {
          const secVal = await SecureStore.getItemAsync(secKey);
          if (secVal !== null && secVal !== undefined && secVal !== "undefined" && secVal !== "null") {
            memoryStore.set(key, secVal);
            return secVal;
          }
        } catch (secErr) {
          // Fall through to AsyncStorage
        }
      }

      // 3. Try AsyncStorage (Standard persistent storage, handles arbitrary keys and sizes)
      if (Platform.OS !== "web") {
        try {
          const asyncVal = await AsyncStorage.getItem(key);
          if (asyncVal !== null && asyncVal !== undefined && asyncVal !== "undefined" && asyncVal !== "null") {
            memoryStore.set(key, asyncVal);
            return asyncVal;
          }
        } catch (asyncErr) {
          // Fall through to memory store
        }
      }

      // 4. Memory store fallback
      const fallback = memoryStore.get(key) || null;
      return fallback && fallback !== "undefined" && fallback !== "null" ? fallback : null;
    } catch (e) {
      const fallback = memoryStore.get(key) || null;
      return fallback && fallback !== "undefined" && fallback !== "null" ? fallback : null;
    }
  },

  setItem: async (key, value) => {
    if (!key || typeof key !== "string") return;

    if (value === undefined || value === null || value === "undefined" || value === "null") {
      return storage.removeItem(key);
    }

    const strVal = typeof value === "string" ? value : String(value);
    memoryStore.set(key, strVal);

    // 1. Web
    if (Platform.OS === "web" && typeof window !== "undefined" && window.localStorage) {
      try {
        window.localStorage.setItem(key, strVal);
      } catch (e) {}
      return;
    }

    // 2. AsyncStorage (Primary cross-platform persistence, handles any size and key format)
    try {
      await AsyncStorage.setItem(key, strVal);
    } catch (e) {
      // Non-fatal if AsyncStorage native module is absent in test environments
    }

    // 3. SecureStore (Hardware encryption for sensitive small values, <= 2048 bytes)
    const secKey = toSecureKey(key);
    if (secKey && strVal.length < SECURE_STORE_MAX_BYTES) {
      try {
        await SecureStore.setItemAsync(secKey, strVal);
      } catch (e) {
        // SecureStore non-fatal fallback
      }
    }
  },

  removeItem: async (key) => {
    if (!key || typeof key !== "string") return;

    memoryStore.delete(key);

    if (Platform.OS === "web" && typeof window !== "undefined" && window.localStorage) {
      try {
        window.localStorage.removeItem(key);
      } catch (e) {}
      return;
    }

    try {
      await AsyncStorage.removeItem(key);
    } catch (e) {}

    const secKey = toSecureKey(key);
    if (secKey) {
      try {
        await SecureStore.deleteItemAsync(secKey);
      } catch (e) {}
    }
  },
};


