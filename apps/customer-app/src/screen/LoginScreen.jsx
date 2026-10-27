// src/screen/LoginScreen.jsx
import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { C, S, FS, FW, R, TYPO, PLATFORM_RADIUS, PLATFORM_SPACING, PLATFORM_TYPO, getPlatformInputStyle, getPlatformButtonStyle } from "../theme";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import ErrorCardModal from "../components/ErrorCardModal";
import GoogleSignInModal from "../components/GoogleSignInModal";
import ForgotPasswordModal from "../components/ForgotPasswordModal";
import AppleSignInButton from "../components/AppleSignInButton";
import GoogleSignInButton from "../components/GoogleSignInButton";
import SpringTouchable from "../components/SpringTouchable";

// Deliberately loose: catches typos like a missing "@" or domain; the server does the real check
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginScreen({ navigate, goBack, routeParams }) {
  const { theme, isDark } = useTheme();
  const styles = getStyles(theme, isDark);
  const insets = useSafeAreaInsets();
  const isAndroid = Platform.OS === "android";
  const topInset = Math.max(insets.top, isAndroid ? (StatusBar.currentHeight || 24) : 12) + 8;
  const bottomInset = isAndroid ? Math.max(insets.bottom, 36) + 16 : Math.max(insets.bottom, 20) + 16;

  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  const passwordRef = useRef(null);

  // After any successful sign-in, continue to where the user was headed
  const goAfterSignIn = () => {
    if (!navigate) return;
    if (routeParams?.redirectTo) navigate(routeParams.redirectTo, routeParams.redirectData);
    else navigate("Home");
  };

  const handleLogin = async () => {
    if (loading) return;
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      setError("Please enter both email and password.");
      return;
    }
    if (!EMAIL_PATTERN.test(cleanEmail)) {
      setError("Please enter a valid email address.");
      return;
    }
    setError("");
    setLoading(true);
    const res = await login(cleanEmail, password, { remember: rememberMe });
    setLoading(false);

    if (res.success) {
      goAfterSignIn();
    } else {
      setError(res.error || "Login failed");
    }
  };

  const handleGoogleLogin = () => {
    setError("");
    setShowGoogleModal(true);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: topInset, paddingBottom: bottomInset }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Top Header Bar (Back button or Skip button for first-time users) */}
        <View
          style={[
            styles.topNav,
            { justifyContent: routeParams?.hideBack ? "flex-end" : "space-between" },
          ]}
        >
          {!routeParams?.hideBack && goBack ? (
            <SpringTouchable style={styles.backBtn} onPress={goBack} scaleTo={0.9}>
              <Ionicons name="arrow-back" size={22} color={styles.titleText.color} />
            </SpringTouchable>
          ) : (
            !routeParams?.hideBack && <View style={{ width: 36 }} />
          )}

          {routeParams?.hideBack && (
            <TouchableOpacity
              style={styles.skipBtn}
              onPress={() => navigate && navigate("Home")}
              activeOpacity={0.7}
            >
              <Text style={styles.skipText}>Skip</Text>
              <Ionicons name="chevron-forward" size={16} color={styles.skipText.color} />
            </TouchableOpacity>
          )}
        </View>

        {/* Welcome Header */}
        <View style={styles.headerBlock}>
          <Text style={styles.titleText}>Welcome!</Text>
          <Text style={styles.subtitleText}>Sign in to continue</Text>
        </View>

        {/* Form Container */}
        <View style={styles.formContainer}>
          <ErrorCardModal
            visible={!!error}
            title="Sign In Error"
            message={error}
            onClose={() => setError("")}
          />

          {/* Email Input */}
          <View style={styles.inputPill}>
            <Ionicons name="mail-outline" size={20} color={styles.placeholderColor.color} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={styles.placeholderColor.color}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="next"
              blurOnSubmit={false}
              onSubmitEditing={() => passwordRef.current?.focus()}
              value={email}
              onChangeText={setEmail}
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputPill}>
            <Ionicons name="lock-closed-outline" size={20} color={styles.placeholderColor.color} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Password"
              placeholderTextColor={styles.placeholderColor.color}
              ref={passwordRef}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="password"
              textContentType="password"
              returnKeyType="go"
              onSubmitEditing={handleLogin}
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

          {/* Remember Me Checkbox */}
          <TouchableOpacity
            style={styles.rememberRow}
            onPress={() => setRememberMe(!rememberMe)}
            activeOpacity={0.8}
          >
            <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
              {rememberMe && <Ionicons name="checkmark" size={14} color={C.textLight} />}
            </View>
            <Text style={styles.rememberText}>Remember me</Text>
          </TouchableOpacity>

          {/* Primary Action Button: Sign in */}
          <SpringTouchable
            style={styles.signInBtn}
            onPress={handleLogin}
            disabled={loading}
            scaleTo={0.96}
            hapticType="medium"
          >
            {loading ? (
              <ActivityIndicator color={C.textLight} size="small" />
            ) : (
              <Text style={styles.signInBtnText}>Sign in</Text>
            )}
          </SpringTouchable>

          {/* Or Continue with Divider */}
          <View style={styles.dividerRow}>
            <Text style={styles.dividerText}>Or Continue with</Text>
          </View>

          {/* Circle Social Login Buttons Row */}
          <View style={styles.socialRow}>
            <GoogleSignInButton
              onPress={handleGoogleLogin}
              disabled={loading}
              variant="circle"
            />
            <AppleSignInButton
              onSuccess={goAfterSignIn}
              onError={(err) => setError(typeof err === "string" ? err : err?.message || "Apple sign-in failed")}
              variant="circle"
            />
          </View>

          {/* Footer Links: Forgot Password & Sign Up */}
          <View style={styles.footerBlock}>
            <TouchableOpacity
              style={styles.forgotBtn}
              onPress={() => setShowForgotModal(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.forgotText}>Forgot your password?</Text>
            </TouchableOpacity>

            <View style={styles.signUpRow}>
              <Text style={styles.noAccountText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigate && navigate("Register", routeParams)}>
                <Text style={styles.signUpText}>Sign up</Text>
              </TouchableOpacity>
            </View>
          </View>

          <GoogleSignInModal
            visible={showGoogleModal}
            onClose={() => setShowGoogleModal(false)}
            onSuccess={goAfterSignIn}
          />

          <ForgotPasswordModal
            visible={showForgotModal}
            onClose={() => setShowForgotModal(false)}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function getStyles(theme, isDark) {
  const accentColor = C.main;

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: C.bg,
    },
    scrollContent: {
      paddingHorizontal: 24,
      flexGrow: 1,
      justifyContent: "center",
    },
    topNav: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 20,
      minHeight: 40,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: isDark ? C.surface : C.border,
    },
    skipBtn: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 16,
      backgroundColor: isDark ? C.surface : C.border,
    },
    skipText: {
      fontSize: 14,
      fontFamily: "Oswald_600SemiBold",
      color: accentColor,
      marginRight: 2,
    },
    headerBlock: {
      marginBottom: 32,
      alignItems: "center",
    },
    titleText: {
      fontFamily: PLATFORM_TYPO.titleFont,
      fontSize: PLATFORM_TYPO.titleSize,
      color: C.ink,
      letterSpacing: PLATFORM_TYPO.letterSpacing,
      marginBottom: 6,
      textAlign: "center",
    },
    subtitleText: {
      fontSize: 15,
      fontFamily: "Oswald_400Regular",
      color: C.muted,
      textAlign: "center",
    },
    placeholderColor: {
      color: isDark ? C.mutedSoft : C.muted,
    },
    formContainer: {
      width: "100%",
    },
    inputPill: {
      flexDirection: "row",
      alignItems: "center",
      ...getPlatformInputStyle(isDark),
      marginBottom: 14,
    },
    inputIcon: {
      marginRight: 14,
    },
    input: {
      flex: 1,
      height: "100%",
      fontSize: 15,
      color: C.ink,
      fontFamily: "Oswald_500Medium",
    },
    eyeBtn: {
      padding: 6,
    },
    rememberRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 24,
      marginTop: 2,
    },
    checkbox: {
      width: 22,
      height: 22,
      borderRadius: 6,
      backgroundColor: isDark ? C.lifted : C.border,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 10,
    },
    checkboxChecked: {
      backgroundColor: accentColor,
    },
    rememberText: {
      fontSize: 14,
      fontFamily: "Oswald_600SemiBold",
      color: accentColor,
    },
    signInBtn: {
      ...getPlatformButtonStyle(isDark, "filled"),
      backgroundColor: accentColor,
      marginBottom: 28,
    },
    signInBtnText: {
      color: C.textLight,
      fontSize: 16,
      fontFamily: "Oswald_600SemiBold",
      letterSpacing: 0.1,
    },
    dividerRow: {
      alignItems: "center",
      marginBottom: 24,
    },
    dividerText: {
      fontSize: 13,
      fontFamily: "Oswald_500Medium",
      color: C.muted,
    },
    socialRow: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: 16,
      marginBottom: 36,
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
      marginTop: 12,
      paddingBottom: 0,
    },
    forgotBtn: {
      paddingVertical: 8,
      marginBottom: 0,
    },
    forgotText: {
      fontSize: 14,
      fontFamily: "Oswald_500Medium",
      color: C.muted,
    },
    signUpRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    noAccountText: {
      fontSize: 14,
      color: C.muted,
    },
    signUpText: {
      fontSize: 14,
      fontFamily: "Oswald_600SemiBold",
      color: accentColor,
    },
  });
}
