// src/screen/NotificationCenterScreen.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  Platform,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C, FONT_FAMILY } from "../theme";
import { customerService } from "../services/customerService";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import SwipeableNotificationItem from "../components/SwipeableNotificationItem";
import { SkeletonBox } from "../components/SkeletonLoader";
import { useAuth } from "../context/AuthContext";

function getDateBucket(dateStr) {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "Earlier";

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfToday.getDate() - 1);

  if (date >= startOfToday) return "Today";
  if (date >= startOfYesterday) return "Yesterday";
  return "Earlier";
}

function groupNotifications(list) {
  const buckets = { Today: [], Yesterday: [], Earlier: [] };
  list.forEach((item) => {
    buckets[getDateBucket(item.createdAt)].push(item);
  });

  return ["Today", "Yesterday", "Earlier"]
    .filter((label) => buckets[label].length > 0)
    .map((label) => ({ label, items: buckets[label] }));
}

export default function NotificationCenterScreen({ navigate, onBack }) {
  const { isDark } = useTheme();
  const { isAuthenticated } = useAuth();
  const insets = useSafeAreaInsets();
  const styles = React.useMemo(() => getStyles(isDark), [isDark]);

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.isRead).length,
    [notifications]
  );

  const sections = useMemo(() => groupNotifications(notifications), [notifications]);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) {
      setNotifications([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      const res = await customerService.getNotifications();
      let list = [];
      if (res?.data?.notifications) list = res.data.notifications;
      else if (Array.isArray(res?.data)) list = res.data;
      setNotifications(list);
      setLoadFailed(false);
    } catch (err) {
      console.warn("Failed to fetch notifications:", err.message);
      setLoadFailed(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return;
    const previous = notifications;
    setNotifications((prev) => prev.map((notification) => ({ ...notification, isRead: true })));
    try {
      await customerService.markAllNotificationsRead();
    } catch (e) {
      // Put the unread state back so the screen doesn't claim something the server didn't save
      console.warn("Failed to mark all read", e);
      setNotifications(previous);
    }
  };

  const handleOpenNotification = (item) => {
    const id = item._id || item.id;

    if (!item.isRead) {
      setNotifications((prev) =>
        prev.map((notification) =>
          (notification._id || notification.id) === id
            ? { ...notification, isRead: true }
            : notification
        )
      );
      customerService
        .markNotificationRead(id)
        .catch((e) => console.warn("Failed to mark read:", e?.message));
    }

    const type = typeof item.type === "string" ? item.type.toLowerCase() : "";
    const title = typeof item.title === "string" ? item.title.toLowerCase() : "";
    const body = typeof item.body === "string" ? item.body.toLowerCase() : "";
    const actionText = typeof item.actionText === "string" ? item.actionText.toLowerCase() : "";
    const text = `${title} ${body} ${actionText}`;

    if (!navigate) return;

    if (actionText.includes("profile") || text.includes("complete profile")) {
      navigate("Profile");
      return;
    }
    if (
      type.includes("appointment") ||
      type.includes("booking") ||
      item?.data?.appointmentId ||
      text.includes("appointment") ||
      text.includes("booking")
    ) {
      navigate("Bookings");
    }
  };

  const handleDeleteNotification = useCallback(async (item) => {
    const id = item._id || item.id;
    let removedIndex = -1;
    setNotifications((prev) => {
      removedIndex = prev.findIndex((notification) => (notification._id || notification.id) === id);
      return prev.filter((notification) => (notification._id || notification.id) !== id);
    });
    try {
      await customerService.deleteNotification(id);
    } catch (e) {
      // Restore it in place; otherwise it silently reappears on the next refresh
      console.warn("Failed to delete notification:", e.message);
      setNotifications((prev) => {
        if (prev.some((notification) => (notification._id || notification.id) === id)) return prev;
        const next = [...prev];
        next.splice(removedIndex >= 0 ? removedIndex : next.length, 0, item);
        return next;
      });
    }
  }, []);

  const handleClose = () => {
    if (onBack) onBack();
    else if (navigate) navigate("Home");
  };

  const topInset = Math.max(
    insets.top,
    Platform.OS === "android" ? StatusBar.currentHeight || 24 : 12
  );
  const bottomInset = Math.max(insets.bottom, 20) + 28;

  const headerSubtitle = !isAuthenticated
    ? "Sign in to keep track of bookings and salon updates."
    : loadFailed
      ? "We couldn't fetch your latest updates. Pull down to retry."
      : unreadCount > 0
        ? "Here's what's new since your last visit."
        : notifications.length > 0
          ? "You're all caught up. New updates will appear here."
          : "Booking updates and reminders will appear here.";

  const emptyIcon = !isAuthenticated
    ? "log-in-outline"
    : loadFailed
      ? "cloud-offline-outline"
      : "checkmark-done-outline";
  const emptyTitle = !isAuthenticated
    ? "Sign in to see notifications"
    : loadFailed
      ? "Couldn't load notifications"
      : "You're all caught up";
  const emptySubtitle = !isAuthenticated
    ? "Booking confirmations, reminders, and salon updates will live here once you're signed in."
    : loadFailed
      ? "Check your connection, then pull down or tap retry."
      : "New booking updates and reminders will appear here as soon as they happen.";

  return (
    <View style={[styles.container, { paddingTop: topInset }]}>
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View style={styles.headerTitleBlock}>
            <Text style={styles.eyebrow}>INBOX</Text>
            <Text style={styles.screenTitle} accessibilityRole="header">Notifications</Text>
          </View>

          <TouchableOpacity
            style={styles.closeBtn}
            onPress={handleClose}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel="Close notifications"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close" size={20} color={isDark ? C.muted : C.textSecondary} />
          </TouchableOpacity>
        </View>

        <Text style={styles.headerSubtitle}>{headerSubtitle}</Text>

        {unreadCount > 0 ? (
          <View style={styles.actionsRow}>
            <View style={styles.unreadPill}>
              <View style={styles.unreadPillDot} />
              <Text style={styles.unreadPillText}>
                {unreadCount} unread
              </Text>
            </View>

            <TouchableOpacity
              style={styles.markAllBtn}
              onPress={handleMarkAllRead}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel="Mark all notifications as read"
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Ionicons
                name="checkmark-done"
                size={15}
                color={isDark ? C.lifted : C.textSecondary}
                style={styles.markAllIcon}
              />
              <Text style={styles.markAllText}>Mark all read</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>

      {loading ? (
        <View style={styles.loadingList}>
          {[0, 1, 2].map((index) => (
            <View key={index} style={styles.skeletonCard}>
              <SkeletonBox width={42} height={42} borderRadius={14} />
              <View style={styles.skeletonContent}>
                <SkeletonBox
                  width={index === 1 ? "46%" : "62%"}
                  height={13}
                  style={{ marginBottom: 10 }}
                />
                <SkeletonBox
                  width={index === 2 ? "64%" : "92%"}
                  height={11}
                  style={{ marginBottom: 7 }}
                />
                <SkeletonBox width="78%" height={11} style={{ marginBottom: 13 }} />
                <SkeletonBox width={64} height={9} />
              </View>
            </View>
          ))}
        </View>
      ) : !isAuthenticated || notifications.length === 0 ? (
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            isAuthenticated ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={isDark ? C.main : C.main}
                colors={[isDark ? C.main : C.main]}
              />
            ) : undefined
          }
        >
          <View style={[styles.emptyContainer, { paddingBottom: bottomInset }]}>
            <View style={styles.emptyIconCircle}>
              <Ionicons
                name={emptyIcon}
                size={34}
                color={isDark ? C.main : C.main}
              />
            </View>
            <Text style={styles.emptyTitle}>{emptyTitle}</Text>
            <Text style={styles.emptySubtitle}>{emptySubtitle}</Text>

            {!isAuthenticated ? (
              <TouchableOpacity
                style={styles.emptyCta}
                activeOpacity={0.85}
                onPress={() => navigate && navigate("Login")}
                accessibilityRole="button"
              >
                <Text style={styles.emptyCtaText}>Sign in</Text>
                <Ionicons name="arrow-forward" size={15} color={C.textLight} style={{ marginLeft: 6 }} />
              </TouchableOpacity>
            ) : loadFailed ? (
              <TouchableOpacity
                style={styles.emptyCta}
                activeOpacity={0.85}
                onPress={handleRefresh}
                accessibilityRole="button"
              >
                <Text style={styles.emptyCtaText}>Try again</Text>
                <Ionicons name="refresh" size={15} color={C.textLight} style={{ marginLeft: 6 }} />
              </TouchableOpacity>
            ) : (
              <View style={styles.emptyHint}>
                <Ionicons
                  name="arrow-down"
                  size={12}
                  color={isDark ? C.muted : C.muted}
                />
                <Text style={styles.emptyHintText}>Pull down to refresh</Text>
              </View>
            )}
          </View>
        </ScrollView>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomInset }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={isDark ? C.main : C.main}
              colors={[isDark ? C.main : C.main]}
            />
          }
        >
          {sections.map((section, sectionIndex) => (
            <View
              key={section.label}
              style={sectionIndex === 0 ? undefined : styles.sectionSpacing}
            >
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionLabel}>{section.label}</Text>
                <View style={styles.sectionRule} />
              </View>

              {section.items.map((item, index) => (
                <SwipeableNotificationItem
                  key={item._id || item.id || `${section.label}-${index}`}
                  item={item}
                  onPress={handleOpenNotification}
                  onDelete={handleDeleteNotification}
                />
              ))}
            </View>
          ))}

          <View style={styles.swipeTip}>
            <Ionicons
              name="trash-outline"
              size={12}
              color={isDark ? C.muted : C.muted}
            />
            <Text style={styles.swipeTipText}>Swipe a notification left to delete</Text>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

function getStyles(isDark) {
  const bg = isDark ? "#0A0A0A" : C.bg;
  const surface = isDark ? "#141414" : C.surface;
  const ink = isDark ? "#F5F3F4" : C.ink;
  const muted = C.muted;
  const hairline = isDark ? "rgba(255,255,255,0.06)" : C.lifted;
  const accent = C.main;
  const accentTint = isDark ? "rgba(255, 122, 154, 0.14)" : "rgba(255, 96, 130, 0.09)";

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: bg,
    },
    header: {
      paddingHorizontal: 20,
      paddingTop: 10,
      paddingBottom: 14,
      backgroundColor: bg,
    },
    headerTopRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
    },
    headerTitleBlock: {
      flex: 1,
      paddingRight: 12,
    },
    eyebrow: {
      fontSize: 14,
      fontFamily: FONT_FAMILY.bodyBold,
      letterSpacing: 1.7,
      color: accent,
    },
    screenTitle: {
      marginTop: 2,
      fontSize: 24,
      lineHeight: 20,
      letterSpacing: 0.2,
      fontFamily: FONT_FAMILY.displayBold,
      color: ink,
    },
    closeBtn: {
      width: 38,
      height: 38,
      borderRadius: 19,
      marginTop: 4,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: surface,
      borderWidth: 1,
      borderColor: hairline,
    },
    headerSubtitle: {
      marginTop: 5,
      fontSize: 13.5,
      lineHeight: 20,
      fontFamily: FONT_FAMILY.body,
      color: muted,
    },
    actionsRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 14,
    },
    unreadPill: {
      flexDirection: "row",
      alignItems: "center",
      borderRadius: 999,
      paddingHorizontal: 11,
      paddingVertical: 6,
      backgroundColor: accentTint,
    },
    unreadPillDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      marginRight: 7,
      backgroundColor: accent,
    },
    unreadPillText: {
      fontSize: 12,
      fontFamily: FONT_FAMILY.bodySemiBold,
      color: accent,
    },
    markAllBtn: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 999,
      backgroundColor: surface,
      borderWidth: 1,
      borderColor: hairline,
    },
    markAllIcon: {
      marginRight: 5,
    },
    markAllText: {
      fontSize: 14,
      fontFamily: FONT_FAMILY.bodySemiBold,
      color: ink,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingTop: 8,
    },
    sectionSpacing: {
      marginTop: 12,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 10,
      marginTop: 6,
    },
    sectionLabel: {
      fontSize: 12,
      fontFamily: FONT_FAMILY.bodyBold,
      letterSpacing: 1.4,
      color: muted,
    },
    sectionRule: {
      flex: 1,
      height: StyleSheet.hairlineWidth,
      marginLeft: 10,
      backgroundColor: hairline,
    },
    swipeTip: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginTop: 10,
      paddingVertical: 8,
    },
    swipeTipText: {
      marginLeft: 6,
      fontSize: 18,
      fontFamily: FONT_FAMILY.body,
      color: muted,
    },
    loadingList: {
      paddingHorizontal: 20,
      paddingTop: 8,
    },
    skeletonCard: {
      flexDirection: "row",
      alignItems: "flex-start",
      padding: 14,
      marginBottom: 10,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: hairline,
      backgroundColor: surface,
    },
    skeletonContent: {
      flex: 1,
      marginLeft: 12,
    },
    emptyContainer: {
      flexGrow: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 36,
      paddingVertical: 60,
    },
    emptyIconCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: accentTint,
      borderWidth: 1,
      borderColor: isDark ? "rgba(255, 122, 154, 0.18)" : "rgba(255, 96, 130, 0.14)",
    },
    emptyTitle: {
      marginTop: 20,
      fontSize: 13.5,
      fontFamily: FONT_FAMILY.displayBold,
      letterSpacing: 0.1,
      color: ink,
      textAlign: "center",
    },
    emptySubtitle: {
      marginTop: 8,
      fontSize: 14,
      lineHeight: 20,
      fontFamily: FONT_FAMILY.body,
      color: muted,
      textAlign: "center",
    },
    emptyCta: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginTop: 22,
      height: 46,
      paddingHorizontal: 24,
      borderRadius: 23,
      backgroundColor: accent,
    },
    emptyCtaText: {
      color: C.textLight,
      fontSize: 14,
      fontFamily: FONT_FAMILY.bodyBold,
    },
    emptyHint: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 24,
    },
    emptyHintText: {
      marginLeft: 6,
      fontSize: 14,
      fontFamily: FONT_FAMILY.body,
      color: muted,
    },
  });
}
