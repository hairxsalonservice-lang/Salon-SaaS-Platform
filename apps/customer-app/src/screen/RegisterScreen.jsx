// src/screen/RegisterScreen.jsx
import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  Platform,
  StatusBar,
  KeyboardAvoidingView,
  Linking,
  Modal,
  TouchableWithoutFeedback,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
// theme tokens not needed — accent derived from isDark
import { useTheme } from "../context/ThemeContext";
import { C, FF } from "../theme";
import { useAuth } from "../context/AuthContext";
import ErrorCardModal from "../components/ErrorCardModal";
import GoogleSignInModal from "../components/GoogleSignInModal";
import GoogleSignInButton from "../components/GoogleSignInButton";
import AppleSignInButton from "../components/AppleSignInButton";
import SpringTouchable from "../components/SpringTouchable";

// Mirrors the server's register validator (salon-api/src/validators/auth.validator.js)
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_RULES = [
  { id: "len", label: "8+ characters", test: (p) => p.length >= 8 },
  { id: "upper", label: "An uppercase letter", test: (p) => /[A-Z]/.test(p) },
  { id: "number", label: "A number", test: (p) => /[0-9]/.test(p) },
  { id: "special", label: "One of ! @ # $ % ^ & *", test: (p) => /[!@#$%^&*]/.test(p) },
];

export default function RegisterScreen({ navigate, goBack, routeParams }) {
  const { theme, isDark } = useTheme();
  const styles = getStyles(theme, isDark);
  const insets = useSafeAreaInsets();
  const isAndroid = Platform.OS === "android";
  const topInset = Math.max(insets.top, isAndroid ? (StatusBar.currentHeight || 24) : 12) + 8;
  const bottomInset = isAndroid ? Math.max(insets.bottom, 36) + 16 : Math.max(insets.bottom, 20) + 16;

  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [gender, setGender] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [pendingOAuth, setPendingOAuth] = useState(null);

  const emailRef = useRef(null);
  const phoneRef = useRef(null);
  const passwordRef = useRef(null);

  const passwordChecks = PASSWORD_RULES.map((r) => ({ ...r, ok: r.test(password) }));
  const passwordValid = passwordChecks.every((r) => r.ok);

  // After any successful sign-up/sign-in, continue to where the user was headed
  const goAfterSignIn = () => {
    if (!navigate) return;
    if (routeParams?.redirectTo) navigate(routeParams.redirectTo, routeParams.redirectData);
    else navigate("Home");
  };

  const handleRegister = async () => {
    if (loading) return;
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const phoneDigits = phone.replace(/\D/g, "");

    if (!cleanName || !cleanEmail || !phoneDigits || !password || !gender) {
      setError("Please fill in all fields, including your phone number and gender.");
      return;
    }
    if (cleanName.length < 2 || cleanName.length > 50) {
      setError("Name must be 2–50 characters.");
      return;
    }
    if (!EMAIL_PATTERN.test(cleanEmail)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (phoneDigits.length < 10 || phoneDigits.length > 13) {
      setError("Please enter a valid phone number.");
      return;
    }
    if (!passwordValid) {
      setError(
        "Your password needs: " +
        passwordChecks.filter((r) => !r.ok).map((r) => r.label.toLowerCase()).join(", ") +
        "."
      );
      return;
    }
    if (!termsAccepted) {
      setError("Please accept the Terms & Conditions to continue.");
      return;
    }

    setError("");
    setLoading(true);
    const res = await register(cleanName, cleanEmail, password, phone.trim(), gender);
    setLoading(false);

    if (res.success) {
      goAfterSignIn();
    } else {
      let errorMsg = res.error || "Registration failed";
      if (
        errorMsg.includes("E11000") ||
        errorMsg.includes("phone_1") ||
        errorMsg.toLowerCase().includes("phone number is already")
      ) {
        errorMsg = "An account with this phone number already exists. Please sign in instead.";
      } else if (
        errorMsg.includes("email_1") ||
        errorMsg.toLowerCase().includes("email already")
      ) {
        errorMsg = "An account with this email already exists. Please sign in instead.";
      }
      setError(errorMsg);
    }
  };

  const handleGoogleLogin = () => {
    if (!termsAccepted) {
      setPendingOAuth("google");
      setShowTermsModal(true);
      return;
    }
    setError("");
    setShowGoogleModal(true);
  };

  const handleAcceptTermsModal = () => {
    setTermsAccepted(true);
    setShowTermsModal(false);
    const oauth = pendingOAuth;
    setPendingOAuth(null);
    if (oauth === "google") {
      setError("");
      setShowGoogleModal(true);
    }
  };

  return (
    <>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={[styles.content, { paddingTop: topInset, paddingBottom: bottomInset }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Top Back Navigation Arrow */}
          <View style={styles.topNav}>
            {goBack ? (
              <SpringTouchable style={styles.backBtn} onPress={goBack} scaleTo={0.9}>
                <Ionicons name="arrow-back" size={22} color={styles.titleText.color} />
              </SpringTouchable>
            ) : <View style={{ width: 36 }} />}
          </View>

          {/* Header */}
          <View style={styles.headerBlock}>
            <Text style={styles.titleText}>Create Account</Text>
            <Text style={styles.subtitleText}>Join for instant bookings & exclusive partner perks</Text>
          </View>

          {/* Form Container */}
          <View style={styles.formContainer}>
            <ErrorCardModal
              visible={!!error}
              title="Registration Error"
              message={error}
              onClose={() => setError("")}
            />

            {/* Full Name Input */}
            <View style={styles.inputPill}>
              <Ionicons name="person-outline" size={20} color={styles.placeholderColor.color} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                placeholderTextColor={styles.placeholderColor.color}
                autoCapitalize="words"
                autoComplete="name"
                textContentType="name"
                returnKeyType="next"
                blurOnSubmit={false}
                onSubmitEditing={() => emailRef.current?.focus()}
                maxLength={50}
                value={name}
                onChangeText={setName}
              />
            </View>

            {/* Email Input */}
            <View style={styles.inputPill}>
              <Ionicons name="mail-outline" size={20} color={styles.placeholderColor.color} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                ref={emailRef}
                placeholder="Email"
                placeholderTextColor={styles.placeholderColor.color}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                textContentType="emailAddress"
                returnKeyType="next"
                blurOnSubmit={false}
                onSubmitEditing={() => phoneRef.current?.focus()}
                value={email}
                onChangeText={setEmail}
              />
            </View>

            {/* Phone Input (Optional) */}
            <View style={styles.inputPill}>
              <Ionicons name="call-outline" size={20} color={styles.placeholderColor.color} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                ref={phoneRef}
                placeholder="Phone Number"
                placeholderTextColor={styles.placeholderColor.color}
                keyboardType="phone-pad"
                autoComplete="tel"
                textContentType="telephoneNumber"
                maxLength={16}
                value={phone}
                onChangeText={setPhone}
              />
            </View>

            {/* Mandatory Gender Selector */}
            <View style={styles.genderBlock}>
              <Text style={styles.genderLabel}>
                Gender <Text style={styles.requiredStar}>*</Text>
              </Text>
              <View style={styles.genderRow}>
                {[
                  { id: "male", label: "Male", icon: "male-outline" },
                  { id: "female", label: "Female", icon: "female-outline" },
                  { id: "other", label: "Other", icon: "transgender-outline" },
                ].map((item) => {
                  const isSelected = gender === item.id;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.genderChip,
                        isSelected && styles.genderChipSelected,
                      ]}
                      onPress={() => setGender(item.id)}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name={item.icon}
                        size={16}
                        color={isSelected ? C.textLight : styles.placeholderColor.color}
                        style={{ marginRight: 6 }}
                      />
                      <Text
                        style={[
                          styles.genderChipText,
                          isSelected && styles.genderChipTextSelected,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputPill}>
              <Ionicons name="lock-closed-outline" size={20} color={styles.placeholderColor.color} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                ref={passwordRef}
                placeholder="Password"
                placeholderTextColor={styles.placeholderColor.color}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="password-new"
                textContentType="newPassword"
                returnKeyType="go"
                onSubmitEditing={handleRegister}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowPassword(!showPassword)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={styles.placeholderColor.color}
                />
              </TouchableOpacity>
            </View>

            {password.length > 0 && !passwordValid ? (
              <View style={styles.pwRules}>
                {passwordChecks.map((r) => (
                  <View key={r.id} style={styles.pwRuleRow}>
                    <Ionicons
                      name={r.ok ? "checkmark-circle" : "ellipse-outline"}
                      size={14}
                      color={r.ok ? C.success : styles.placeholderColor.color}
                    />
                    <Text style={[styles.pwRuleText, r.ok && styles.pwRuleTextOk]}>{r.label}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            {/* Terms & Conditions */}
            <TouchableOpacity
              style={styles.termsRow}
              onPress={() => setTermsAccepted(!termsAccepted)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, termsAccepted && styles.checkboxChecked]}>
                {termsAccepted && <Ionicons name="checkmark" size={14} color={C.textLight} />}
              </View>
              <Text style={styles.termsText}>
                I agree to the{" "}
                <Text
                  style={styles.termsLink}
                  onPress={() => Linking.openURL("https://hairxsalon.com/terms")}
                >
                  Terms & Conditions
                </Text>
              </Text>
            </TouchableOpacity>

            {/* Primary Action Button: Sign Up */}
            <SpringTouchable
              style={[styles.signUpBtn, !termsAccepted && styles.signUpBtnDisabled]}
              onPress={handleRegister}
              disabled={loading || !termsAccepted}
              scaleTo={0.96}
              hapticType="medium"
            >
              {loading ? (
                <ActivityIndicator color={C.textLight} size="small" />
              ) : (
                <Text style={styles.signUpBtnText}>Create Account</Text>
              )}
            </SpringTouchable>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <Text style={styles.dividerText}>Or Continue with</Text>
            </View>

            {/* Full-width Continue with Google Button */}
            <GoogleSignInButton
              onPress={handleGoogleLogin}
              disabled={loading}
            />

            {/* Full-width Continue with Apple Button */}
            {termsAccepted ? (
              <AppleSignInButton
                onSuccess={goAfterSignIn}
                onError={(err) => setError(typeof err === "string" ? err : err?.message || "Apple sign-in failed")}
              />
            ) : (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => { setPendingOAuth("apple"); setShowTermsModal(true); }}
              >
                <View pointerEvents="none">
                  <AppleSignInButton
                    onSuccess={() => { }}
                    onError={() => { }}
                  />
                </View>
              </TouchableOpacity>
            )}

            {/* Footer Link */}
            <View style={styles.footerBlock}>
              <View style={styles.signInRow}>
                <Text style={styles.hasAccountText}>Already have an account? </Text>
                <TouchableOpacity onPress={() => navigate && navigate("Login", routeParams)}>
                  <Text style={styles.signInText}>Sign In</Text>
                </TouchableOpacity>
              </View>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Terms Acceptance Modal — outside KeyboardAvoidingView for full-screen overlay */}
      <Modal
        visible={showTermsModal}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => { setShowTermsModal(false); setPendingOAuth(null); }}
      >
        <TouchableWithoutFeedback onPress={() => { setShowTermsModal(false); setPendingOAuth(null); }}>
          <View style={styles.termsModalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.termsModalCard}>
                <TouchableOpacity
                  style={styles.termsModalCloseBtn}
                  onPress={() => { setShowTermsModal(false); setPendingOAuth(null); }}
                  activeOpacity={0.7}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close" size={18} color={C.mutedSoft} />
                </TouchableOpacity>

                <View style={styles.termsModalIconWrap}>
                  <View style={styles.termsModalIconCircle}>
                    <Ionicons name="shield-checkmark-outline" size={30} color={C.main} />
                  </View>
                </View>

                <Text style={styles.termsModalTitle}>Terms & Conditions</Text>
                <Text style={styles.termsModalBody}>
                  Please review and accept our Terms & Conditions to create your account.
                </Text>

                <TouchableOpacity
                  onPress={() => Linking.openURL("https://hairxsalon.com/terms")}
                  style={styles.termsModalReadBtn}
                  activeOpacity={0.7}
                >
                  <Ionicons name="open-outline" size={15} color={C.main} style={{ marginRight: 6 }} />
                  <Text style={styles.termsModalReadLink}>Read Terms & Conditions</Text>
                </TouchableOpacity>

                <SpringTouchable
                  style={styles.termsModalAcceptBtn}
                  onPress={handleAcceptTermsModal}
                  scaleTo={0.96}
                  hapticType="medium"
                >
                  <Text style={styles.termsModalAcceptText}>Accept & Continue</Text>
                </SpringTouchable>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <GoogleSignInModal
        visible={showGoogleModal}
        onClose={() => setShowGoogleModal(false)}
        onSuccess={goAfterSignIn}
      />
    </>
  );
}

function getStyles(theme, isDark) {
  const accentColor = C.main;

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: C.bg,
    },
    content: {
      paddingHorizontal: 24,
      flexGrow: 1,
    },
    topNav: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 24,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: isDark ? C.surface : C.border,
    },
    headerBlock: {
      marginBottom: 28,
    },
    titleText: {
      fontFamily: FF.displayBold,
      fontSize: 28,
      color: C.ink,
      letterSpacing: 0.2,
      marginBottom: 6,
    },
    subtitleText: {
      fontSize: 15,
      fontFamily: "DMSans_400Regular",
      color: C.muted,
    },
    placeholderColor: {
      color: isDark ? C.mutedSoft : C.muted,
    },
    formContainer: {
      flex: 1,
    },
    inputPill: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: C.surface,
      borderRadius: 12,
      paddingHorizontal: 18,
      height: 54,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: isDark ? C.border : C.border,
    },
    inputIcon: {
      marginRight: 14,
    },
    pwRules: {
      marginTop: -4,
      marginBottom: 14,
      paddingHorizontal: 6,
      gap: 4,
    },
    pwRuleRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    pwRuleText: {
      marginLeft: 6,
      fontSize: 12.5,
      color: C.muted,
    },
    pwRuleTextOk: {
      color: C.success,
    },
    genderBlock: {
      marginBottom: 16,
      marginTop: 2,
    },
    genderLabel: {
      fontSize: 14,
      fontFamily: "Oswald_600SemiBold",
      color: isDark ? C.border : C.borderDark,
      marginBottom: 8,
      marginLeft: 4,
    },
    requiredStar: {
      color: C.error,
      fontFamily: "Oswald_700Bold",
    },
    genderRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
    },
    genderChip: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      height: 44,
      borderRadius: 14,
      backgroundColor: C.surface,
      borderWidth: 1.5,
      borderColor: isDark ? C.border : C.border,
    },
    genderChipSelected: {
      backgroundColor: accentColor,
      borderColor: accentColor,
    },
    genderChipText: {
      fontSize: 13,
      fontFamily: "Oswald_600SemiBold",
      color: C.muted,
    },
    genderChipTextSelected: {
      color: C.textLight,
      fontFamily: "Oswald_700Bold",
    },
    input: {
      flex: 1,
      height: "100%",
      fontSize: 15,
      color: C.ink,
      fontFamily: "DMSans_500Medium",
    },
    eyeBtn: {
      padding: 6,
    },
    termsRow: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 4,
      marginBottom: 16,
      paddingHorizontal: 2,
    },
    checkbox: {
      width: 22,
      height: 22,
      borderRadius: 6,
      borderWidth: 1.5,
      borderColor: C.border,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 10,
      backgroundColor: C.surface,
    },
    checkboxChecked: {
      backgroundColor: accentColor,
      borderColor: accentColor,
    },
    termsText: {
      fontSize: 13,
      fontFamily: "DMSans_400Regular",
      color: C.muted,
      flex: 1,
    },
    termsLink: {
      color: accentColor,
      fontFamily: "DMSans_500Medium",
      textDecorationLine: "underline",
    },
    signUpBtn: {
      height: 50, borderRadius: 12,
      backgroundColor: accentColor,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 0,
      marginBottom: 28,
    },
    signUpBtnDisabled: {
      opacity: 0.5,
    },
    termsModalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.6)",
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 20,
    },
    termsModalCard: {
      width: "100%",
      backgroundColor: C.surface,
      borderRadius: 22,
      paddingTop: 28,
      paddingBottom: 22,
      paddingHorizontal: 20,
      alignItems: "center",
      borderWidth: 1,
      borderColor: isDark ? C.lifted : C.border,
      shadowColor: C.ink,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 10,
    },
    termsModalCloseBtn: {
      position: "absolute",
      top: 12,
      right: 12,
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: isDark ? C.lifted : C.border,
      justifyContent: "center",
      alignItems: "center",
      zIndex: 10,
    },
    termsModalIconWrap: {
      marginBottom: 12,
    },
    termsModalIconCircle: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: isDark ? "rgba(236, 72, 153, 0.12)" : "rgba(236, 72, 153, 0.08)",
      borderWidth: 1.5,
      borderColor: isDark ? "rgba(236, 72, 153, 0.3)" : "rgba(236, 72, 153, 0.2)",
      justifyContent: "center",
      alignItems: "center",
    },
    termsModalTitle: {
      fontSize: 18,
      fontFamily: "Oswald_700Bold",
      color: C.ink,
      textAlign: "center",
      marginBottom: 6,
    },
    termsModalBody: {
      fontSize: 13.5,
      fontFamily: "DMSans_400Regular",
      color: C.muted,
      textAlign: "center",
      lineHeight: 19,
      marginBottom: 14,
    },
    termsModalReadBtn: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 16,
      paddingVertical: 4,
    },
    termsModalReadLink: {
      fontSize: 13.5,
      fontFamily: "DMSans_500Medium",
      color: accentColor,
    },
    termsModalAcceptBtn: {
      width: "100%",
      height: 50,
      backgroundColor: accentColor,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 20,
    },
    termsModalAcceptText: {
      fontSize: 16,
      fontFamily: "Oswald_600SemiBold",
      color: C.textLight,
      letterSpacing: 0.1,
      textAlignVertical: "center",
      includeFontPadding: false,
    },
    signUpBtnText: {
      color: C.textLight,
      fontSize: 16, fontFamily: "Oswald_600SemiBold",
      letterSpacing: 0.1,
    },
    dividerRow: {
      alignItems: "center",
      marginBottom: 20,
    },
    dividerText: {
      fontSize: 13,
      fontFamily: "DMSans_500Medium",
      color: C.muted,
    },
    socialRow: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: 16,
      marginBottom: 28,
    },
    socialCard: {
      width: 58,
      height: 58,
      borderRadius: 18,
      backgroundColor: C.surface,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: isDark ? C.border : C.border,
      shadowColor: C.ink,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    footerBlock: {
      alignItems: "center",
      marginTop: "auto",
      paddingBottom: 16,
    },
    signInRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    hasAccountText: {
      fontSize: 14,
      color: C.muted,
    },
    signInText: {
      fontSize: 14,
      fontFamily: "Oswald_700Bold",
      color: accentColor,
    },
  });
}
