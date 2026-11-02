import React, { useMemo, useCallback, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Platform,
  Clipboard,
  ActivityIndicator,
  Linking,
  Share,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ViewShot from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { C } from "../theme";
import { triggerHaptic } from "../theme/appleMotion";
import SpringTouchable from "../components/SpringTouchable";

const APP_LINK = "https://hairx.app";

export default function InviteFriendsScreen({ goBack }) {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const styles = useMemo(() => getStyles(theme, isDark), [theme, isDark]);
  const shareCardRef = useRef(null);

  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);

  const userName = user?.name || "Your friend";

  const shareText =
    `Hey! Check out HairX — the best app to discover and book salon appointments near you.\n\n` +
    `Download now: ${APP_LINK}\n\n` +
    `Try it out, you'll love it!`;

  const handleShare = useCallback(async (method) => {
    if (sharing) return;
    setSharing(true);
    triggerHaptic("selection");
    try {
      if (method === "whatsapp") {
        const waUrl = `whatsapp://send?text=${encodeURIComponent(shareText)}`;
        const canOpen = await Linking.canOpenURL(waUrl).catch(() => false);
        if (canOpen) {
          await Linking.openURL(waUrl);
          return;
        }
        const webWaUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
        const canOpenWeb = await Linking.canOpenURL(webWaUrl).catch(() => false);
        if (canOpenWeb) {
          await Linking.openURL(webWaUrl);
          return;
        }
      } else if (method === "sms") {
        const smsUrl = Platform.OS === "ios"
          ? `sms:&body=${encodeURIComponent(shareText)}`
          : `sms:?body=${encodeURIComponent(shareText)}`;
        const canOpen = await Linking.canOpenURL(smsUrl).catch(() => false);
        if (canOpen) {
          await Linking.openURL(smsUrl);
          return;
        }
      }

      // Try image card sharing via expo-sharing if available
      let sharedImage = false;
      try {
        const uri = await shareCardRef.current?.capture?.();
        if (uri && (await Sharing.isAvailableAsync())) {
          await Sharing.shareAsync(uri, {
            dialogTitle: "Share HairX",
            mimeType: "image/png",
            UTI: "public.png",
          });
          sharedImage = true;
        }
      } catch (err) {
        console.warn("Card capture/share failed:", err?.message);
      }

      // Fallback or text share sheet
      if (!sharedImage) {
        await Share.share({
          title: "HairX — Premium Salon Booking",
          message: shareText,
        });
      }
    } catch (e) {
      if (e?.message !== "User did not share") {
        console.warn("Share error:", e?.message);
      }
    } finally {
      setSharing(false);
    }
  }, [shareText, sharing]);

  const handleCopyLink = useCallback(() => {
    Clipboard.setString(APP_LINK);
    triggerHaptic("notification_success");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.canvas }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: Math.max(insets.top || 20, 20) + 8, paddingBottom: insets.bottom + 30 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={goBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="arrow-back" size={24} color={theme.ink} />
          </TouchableOpacity>
        </View>

        {/* Hero */}
        <View style={styles.heroSection}>
          <View style={styles.heroIconWrap}>
            <Ionicons name="people" size={36} color="#FFFFFF" />
          </View>
          <Text style={styles.heroTitle}>Share HairX{"\n"}with Friends</Text>
          <Text style={styles.heroSub}>
            Love using HairX? Spread the word! Share the app with your friends and family.
          </Text>
        </View>

        {/* Share Card — captured as image for sharing */}
        <ViewShot ref={shareCardRef} options={{ format: "png", quality: 1 }}>
          <View style={styles.shareCard}>
            <View style={styles.shareCardTop}>
              <View style={styles.shareCardLogoRow}>
                <View style={styles.shareCardLogoDot}>
                  <Ionicons name="cut" size={16} color="#FFFFFF" />
                </View>
                <Text style={styles.shareCardBrand}>HairX</Text>
              </View>
              <Text style={styles.shareCardHeadline}>
                {userName} recommends HairX!
              </Text>
              <Text style={styles.shareCardSub}>
                Discover the best salons near you. Book appointments instantly with HairX.
              </Text>
            </View>

            <View style={styles.shareCardFeatures}>
              <View style={styles.featureRow}>
                <Ionicons name="search" size={16} color="#FF6082" />
                <Text style={styles.featureText}>Find top-rated salons nearby</Text>
              </View>
              <View style={styles.featureRow}>
                <Ionicons name="calendar" size={16} color="#FF6082" />
                <Text style={styles.featureText}>Book appointments in seconds</Text>
              </View>
              <View style={styles.featureRow}>
                <Ionicons name="pricetag" size={16} color="#FF6082" />
                <Text style={styles.featureText}>Exclusive deals & offers</Text>
              </View>
            </View>

            <View style={styles.shareCardBottom}>
              <Text style={styles.shareCardLink}>Download now  •  hairx.app</Text>
            </View>
          </View>
        </ViewShot>

        {/* Copy link */}
        <TouchableOpacity
          style={[styles.copyRow, copied && styles.copyRowDone]}
          onPress={handleCopyLink}
          activeOpacity={0.7}
        >
          <Ionicons
            name={copied ? "checkmark-circle" : "link-outline"}
            size={18}
            color={copied ? "#FFFFFF" : theme.primary}
          />
          <Text style={[styles.copyRowText, copied && { color: "#FFFFFF" }]}>
            {copied ? "Link copied!" : `Tap to copy: ${APP_LINK}`}
          </Text>
        </TouchableOpacity>

        {/* Share Options */}
        <Text style={styles.sectionTitle}>Share via</Text>
        <View style={styles.shareRow}>
          <TouchableOpacity style={styles.shareOption} onPress={() => handleShare("whatsapp")} activeOpacity={0.7} disabled={sharing}>
            <View style={[styles.shareIconWrap, { backgroundColor: "#25D366" }]}>
              <Ionicons name="logo-whatsapp" size={24} color="#FFFFFF" />
            </View>
            <Text style={styles.shareLabel}>WhatsApp</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.shareOption} onPress={() => handleShare("sms")} activeOpacity={0.7} disabled={sharing}>
            <View style={[styles.shareIconWrap, { backgroundColor: isDark ? "#3A7BD5" : "#007AFF" }]}>
              <Ionicons name="chatbubble" size={22} color="#FFFFFF" />
            </View>
            <Text style={styles.shareLabel}>SMS</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.shareOption} onPress={handleCopyLink} activeOpacity={0.7}>
            <View style={[styles.shareIconWrap, { backgroundColor: isDark ? "#6B6B80" : "#8E8E93" }]}>
              <Ionicons name="link" size={22} color="#FFFFFF" />
            </View>
            <Text style={styles.shareLabel}>Copy Link</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.shareOption} onPress={() => handleShare("more")} activeOpacity={0.7} disabled={sharing}>
            <View style={[styles.shareIconWrap, { backgroundColor: theme.primary }]}>
              <Ionicons name="share-social" size={22} color="#FFFFFF" />
            </View>
            <Text style={styles.shareLabel}>More</Text>
          </TouchableOpacity>
        </View>

        {/* Big Share Button */}
        <SpringTouchable style={styles.bigShareBtn} onPress={() => handleShare("more")} scaleTo={0.96} disabled={sharing}>
          {sharing ? (
            <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
          ) : (
            <Ionicons name="share-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
          )}
          <Text style={styles.bigShareBtnText}>{sharing ? "Preparing..." : "Share HairX"}</Text>
        </SpringTouchable>
      </ScrollView>
    </View>
  );
}

function getStyles(theme, isDark) {
  return StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { paddingHorizontal: 20 },

    headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 20 },

    heroSection: { alignItems: "center", marginBottom: 24 },
    heroIconWrap: {
      width: 72, height: 72, borderRadius: 36,
      backgroundColor: theme.primary,
      alignItems: "center", justifyContent: "center", marginBottom: 16,
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 6,
    },
    heroTitle: {
      fontSize: 26, fontFamily: "Oswald_700Bold", color: theme.ink,
      textAlign: "center", letterSpacing: 0.3, lineHeight: 32,
    },
    heroSub: {
      marginTop: 8, fontSize: 14, fontFamily: "DMSans_400Regular",
      color: theme.muted, textAlign: "center", lineHeight: 21, paddingHorizontal: 10,
    },

    shareCard: {
      borderRadius: 20,
      overflow: "hidden",
      marginBottom: 16,
    },
    shareCardTop: {
      backgroundColor: "#1A1A2E",
      paddingTop: 28, paddingBottom: 20, paddingHorizontal: 24,
    },
    shareCardLogoRow: {
      flexDirection: "row", alignItems: "center", marginBottom: 16,
    },
    shareCardLogoDot: {
      width: 30, height: 30, borderRadius: 10,
      backgroundColor: "#FF6082",
      alignItems: "center", justifyContent: "center", marginRight: 8,
    },
    shareCardBrand: {
      fontSize: 18, fontFamily: "Oswald_700Bold", color: "#FFFFFF", letterSpacing: 1,
    },
    shareCardHeadline: {
      fontSize: 22, fontFamily: "Oswald_700Bold", color: "#FFFFFF",
      lineHeight: 28, marginBottom: 6,
    },
    shareCardSub: {
      fontSize: 13, fontFamily: "DMSans_400Regular", color: "rgba(255,255,255,0.65)",
      lineHeight: 19,
    },
    shareCardFeatures: {
      backgroundColor: "#16213E",
      paddingVertical: 18, paddingHorizontal: 24, gap: 12,
    },
    featureRow: {
      flexDirection: "row", alignItems: "center", gap: 10,
    },
    featureText: {
      fontSize: 13, fontFamily: "DMSans_500Medium", color: "rgba(255,255,255,0.85)",
    },
    shareCardBottom: {
      backgroundColor: "#FF6082",
      paddingVertical: 12, alignItems: "center",
    },
    shareCardLink: {
      fontSize: 12, fontFamily: "Oswald_600SemiBold", color: "#FFFFFF",
      letterSpacing: 0.5,
    },

    copyRow: {
      flexDirection: "row", alignItems: "center", justifyContent: "center",
      gap: 8, backgroundColor: isDark ? "rgba(255,96,130,0.10)" : "rgba(255,96,130,0.06)",
      borderRadius: 12, paddingVertical: 12, marginBottom: 28,
      borderWidth: 1, borderColor: isDark ? "rgba(255,96,130,0.2)" : "rgba(255,96,130,0.15)",
    },
    copyRowDone: {
      backgroundColor: C.success || "#2E7D32", borderColor: C.success || "#2E7D32",
    },
    copyRowText: {
      fontSize: 13, fontFamily: "Oswald_600SemiBold", color: theme.primary,
    },

    sectionTitle: {
      fontSize: 16, fontFamily: "Oswald_700Bold", color: theme.ink,
      marginBottom: 14, letterSpacing: 0.2,
    },
    shareRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 28 },
    shareOption: { alignItems: "center", flex: 1 },
    shareIconWrap: {
      width: 52, height: 52, borderRadius: 16,
      alignItems: "center", justifyContent: "center", marginBottom: 6,
    },
    shareLabel: { fontSize: 11, fontFamily: "DMSans_500Medium", color: theme.muted },

    bigShareBtn: {
      flexDirection: "row", alignItems: "center", justifyContent: "center",
      backgroundColor: theme.primary, borderRadius: 14, paddingVertical: 16,
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 4,
    },
    bigShareBtnText: { fontSize: 16, fontFamily: "Oswald_700Bold", color: "#FFFFFF", letterSpacing: 0.3 },
  });
}
