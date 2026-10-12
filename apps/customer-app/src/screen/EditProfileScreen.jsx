// src/screen/EditProfileScreen.jsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Image,
  Platform,
  StatusBar,
  Alert,
  Modal,
  KeyboardAvoidingView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { authService } from "../services/authService";

const MALE_AVATAR_ASSET = require("../../assets/male-avatar.png");
const FEMALE_AVATAR_ASSET = require("../../assets/female-avatar.png");

const TOP_INSET = Platform.OS === "ios" ? 52 : (StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 36);

// The API stores gender lowercase ("male" | "female" | "other")
const GENDER_OPTIONS = [
  { id: "male", label: "Male" },
  { id: "female", label: "Female" },
  { id: "other", label: "Other" },
];
const ACCENT = "#B3261E";

function normalizeGender(value) {
  const v = typeof value === "string" ? value.trim().toLowerCase() : "";
  return GENDER_OPTIONS.some((g) => g.id === v) ? v : "";
}

export default function EditProfileScreen({ goBack }) {
  const { user, updateUser } = useAuth();
  const { isDark } = useTheme();

  // Start from the real profile — never pre-fill invented details that a Save would write back
  const [name, setName] = useState(user?.name || "");
  const [gender, setGender] = useState(normalizeGender(user?.gender));
  const [phone, setPhone] = useState(user?.phone || "");
  const email = user?.email || "";

  const [avatarUri, setAvatarUri] = useState(user?.avatarUrl || null);
  const [saving, setSaving] = useState(false);
  const [showGenderModal, setShowGenderModal] = useState(false);

  const genderLabel = GENDER_OPTIONS.find((g) => g.id === gender)?.label || "Select";

  const handlePickAvatar = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert("Permission Needed", "Permission to access photo gallery is required.");
        return;
      }
      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!pickerResult.canceled && pickerResult.assets && pickerResult.assets.length > 0) {
        setAvatarUri(pickerResult.assets[0].uri);
      }
    } catch (err) {
      console.log("Error picking image:", err);
      Alert.alert("Couldn't open photos", "Please try again.");
    }
  };

  const handleSave = async () => {
    if (saving) return;
    const cleanName = name.trim();
    const cleanPhone = phone.trim();
    const phoneDigits = cleanPhone.replace(/\D/g, "");

    if (cleanName.length < 2 || cleanName.length > 50) {
      Alert.alert("Check your name", "Name must be 2–50 characters.");
      return;
    }
    if (phoneDigits.length < 10 || phoneDigits.length > 13) {
      Alert.alert("Check your phone number", "Please enter a valid phone number.");
      return;
    }

    setSaving(true);
    try {
      // Save to the server first; previously this only changed the copy stored on the phone
      const updates = { name: cleanName, phone: cleanPhone };
      if (gender) updates.gender = gender;
      const res = await authService.updateProfile(updates);
      const saved = res?.data?.user || {};

      updateUser({
        name: saved.name ?? cleanName,
        phone: saved.phone ?? cleanPhone,
        ...(gender ? { gender: saved.gender ?? gender } : {}),
        // The photo isn't uploaded yet, so it's only kept on this device
        avatarUrl: avatarUri,
      });

      Alert.alert("Saved", "Your profile has been updated.");
      if (goBack) goBack();
    } catch (err) {
      Alert.alert("Couldn't save", err.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const getAvatarSource = () => {
    if (avatarUri) return { uri: avatarUri };
    if (gender === "female") return FEMALE_AVATAR_ASSET;
    return MALE_AVATAR_ASSET;
  };

  const styles = getStyles(isDark);
  const helperColor = isDark ? "#8E8E93" : "#71717A";

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Top Header Row with Close Button */}
        <View style={styles.topHeader}>
          <View style={{ flex: 1 }} />
          <TouchableOpacity onPress={goBack} style={styles.closeBtn} activeOpacity={0.7} disabled={saving}>
            <Ionicons name="close" size={24} color={isDark ? "#FFFFFF" : "#18181B"} />
          </TouchableOpacity>
        </View>

        {/* Avatar Area with "Change Avatar" */}
        <View style={styles.avatarRow}>
          <TouchableOpacity style={styles.avatarContainer} onPress={handlePickAvatar} activeOpacity={0.85}>
            <Image source={getAvatarSource()} style={styles.avatarImg} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handlePickAvatar} activeOpacity={0.7} style={styles.changeAvatarBtn}>
            <Text style={styles.changeAvatarText}>Change Avatar</Text>
          </TouchableOpacity>
        </View>

        {/* 1. Full Name */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Full name</Text>
          <View style={styles.inputBox}>
            <TextInput
              style={styles.textInput}
              value={name}
              onChangeText={setName}
              placeholder="Enter full name"
              placeholderTextColor="#A0A0AB"
              autoCapitalize="words"
              autoComplete="name"
              textContentType="name"
              maxLength={50}
            />
          </View>
        </View>

        {/* 2. Email — it's the sign-in identity, so it can't be edited here */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Email</Text>
          <View style={[styles.inputBox, { opacity: 0.6 }]}>
            <Text style={styles.selectText} numberOfLines={1}>{email || "—"}</Text>
            <Ionicons name="lock-closed-outline" size={15} color="#66666E" />
          </View>
          <Text style={{ fontSize: 12, color: helperColor, marginTop: 6 }}>
            Your email is used to sign in and can't be changed here.
          </Text>
        </View>

        {/* 3. Gender */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Gender</Text>
          <TouchableOpacity style={styles.inputBox} onPress={() => setShowGenderModal(true)} activeOpacity={0.8}>
            <Text style={styles.selectText}>{genderLabel}</Text>
            <Ionicons name="chevron-down" size={16} color="#66666E" />
          </TouchableOpacity>
        </View>

        {/* 4. Phone Number */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Phone number</Text>
          <View style={[styles.inputBox, { flex: 1 }]}>
            <TextInput
              style={styles.textInput}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="Phone number"
              placeholderTextColor="#A0A0AB"
              autoComplete="tel"
              textContentType="telephoneNumber"
              maxLength={16}
            />
          </View>
        </View>

        <View style={{ height: 32 }} />

        {/* Save Button */}
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving} activeOpacity={0.88}>
          {saving ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.saveBtnText}>Save</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Gender Picker Modal */}
      <Modal
        visible={showGenderModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowGenderModal(false)}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowGenderModal(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Gender</Text>
            {GENDER_OPTIONS.map((g) => {
              const isSelected = gender === g.id;
              return (
                <TouchableOpacity
                  key={g.id}
                  style={styles.genderOption}
                  onPress={() => {
                    setGender(g.id);
                    setShowGenderModal(false);
                  }}
                >
                  <Text style={[styles.genderOptionText, isSelected && { color: ACCENT, fontWeight: "700" }]}>{g.label}</Text>
                  {isSelected && <Ionicons name="checkmark" size={18} color={ACCENT} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
}

function getStyles(isDark) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? "#121216" : "#FFFFFF",
    },
    scrollContent: {
      paddingHorizontal: 24,
      paddingTop: TOP_INSET,
      paddingBottom: 60,
    },
    topHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 16,
    },
    closeBtn: {
      padding: 6,
    },
    avatarRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 28,
    },
    avatarContainer: {
      width: 72,
      height: 72,
      borderRadius: 24,
      overflow: "hidden",
      backgroundColor: isDark ? "#2A2A34" : "#F0F0F5",
      marginRight: 16,
    },
    avatarImg: {
      width: "100%",
      height: "100%",
      resizeMode: "cover",
    },
    changeAvatarBtn: {
      paddingVertical: 6,
    },
    changeAvatarText: {
      fontSize: 15,
      fontWeight: "700",
      color: "#6C5CE7",
    },
    fieldGroup: {
      marginBottom: 20,
    },
    label: {
      fontSize: 13,
      fontWeight: "600",
      color: isDark ? "#9999A0" : "#8E8E93",
      marginBottom: 8,
    },
    inputBox: {
      height: 52,
      borderRadius: 14,
      backgroundColor: isDark ? "#1E1E26" : "#F7F7FA",
      paddingHorizontal: 16,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    textInput: {
      flex: 1,
      fontSize: 14.5,
      fontWeight: "500",
      color: isDark ? "#FFFFFF" : "#18181B",
    },
    selectText: {
      fontSize: 14.5,
      fontWeight: "500",
      color: isDark ? "#FFFFFF" : "#18181B",
    },
    saveBtn: {
      height: 54,
      borderRadius: 18,
      backgroundColor: "#6C5CE7",
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#6C5CE7",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 10,
      elevation: 4,
    },
    saveBtnText: {
      fontSize: 16,
      fontWeight: "700",
      color: "#FFFFFF",
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.4)",
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
    },
    modalContent: {
      width: "100%",
      backgroundColor: isDark ? "#1E1E26" : "#FFFFFF",
      borderRadius: 20,
      padding: 20,
    },
    modalTitle: {
      fontSize: 17,
      fontWeight: "700",
      color: isDark ? "#FFFFFF" : "#18181B",
      marginBottom: 16,
    },
    genderOption: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: isDark ? "#2E2E38" : "#EFEFF4",
    },
    genderOptionText: {
      fontSize: 15,
      fontWeight: "500",
      color: isDark ? "#FFFFFF" : "#18181B",
    },
  });
}
