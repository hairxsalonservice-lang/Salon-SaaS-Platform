// src/components/SwipeableNotificationItem.jsx
import React, { memo, useRef } from "react";
import {
  Animated,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useTheme } from "../context/ThemeContext";

import { C } from "../theme";
const DELETE_ACTION_WIDTH = 88;

const TONES = {
  pink: {
    light: C.main,
    dark: C.main,
    tintLight: "rgba(255, 96, 130, 0.10)",
    tintDark: "rgba(255, 122, 154, 0.15)",
  },
  green: {
    light: C.success,
    dark: C.success,
    tintLight: "rgba(35, 148, 90, 0.10)",
    tintDark: "rgba(91, 214, 140, 0.14)",
  },
  amber: {
    light: C.warning,
    dark: C.warning,
    tintLight: "rgba(199, 122, 10, 0.11)",
    tintDark: "rgba(242, 180, 92, 0.14)",
  },
  red: {
    light: C.error,
    dark: C.error,
    tintLight: "rgba(217, 58, 63, 0.10)",
    tintDark: "rgba(255, 123, 127, 0.14)",
  },
  violet: {
    light: C.info,
    dark: C.info,
    tintLight: "rgba(102, 88, 232, 0.10)",
    tintDark: "rgba(167, 158, 255, 0.14)",
  },
};

function getNotificationMeta(item) {
  const type = String(item?.type || "").toLowerCase();
  const text = `${item?.title || ""} ${item?.body || ""} ${item?.actionText || ""}`.toLowerCase();
  const isAppointment =
    /appointment|booking/.test(type) ||
    /appointment|booking/.test(text) ||
    Boolean(item?.data?.appointmentId);

  let actionLabel = typeof item?.actionText === "string" ? item.actionText.trim() : "";
  if (!actionLabel) {
    if (text.includes("complete profile")) actionLabel = "Complete profile";
    else if (isAppointment) actionLabel = "View booking";
  }

  if (type.includes("cancel") || text.includes("cancelled") || text.includes("canceled")) {
    return { icon: "close-circle-outline", tone: "red", actionLabel };
  }
  if (type.includes("confirm") || text.includes("confirmed")) {
    return { icon: "checkmark-circle-outline", tone: "green", actionLabel };
  }
  // Checked before "complet" so profile.incomplete doesn't read as a completed appointment
  if (type.includes("profile") || type.includes("account") || text.includes("profile")) {
    return { icon: "person-outline", tone: "violet", actionLabel };
  }
  if (type.includes("complet")) {
    return { icon: "sparkles-outline", tone: "green", actionLabel };
  }
  if (type.includes("reschedul")) {
    return { icon: "calendar-outline", tone: "amber", actionLabel };
  }
  if (type.includes("progress") || text.includes("in progress")) {
    return { icon: "time-outline", tone: "pink", actionLabel };
  }
  if (type.includes("leave") || type.includes("approval")) {
    return { icon: "mail-unread-outline", tone: "violet", actionLabel };
  }
  if (isAppointment) {
    return { icon: "calendar-outline", tone: "pink", actionLabel };
  }
  if (type.includes("promo") || type.includes("offer") || text.includes("offer")) {
    return { icon: "pricetag-outline", tone: "amber", actionLabel };
  }
  return { icon: "notifications-outline", tone: "pink", actionLabel };
}

function formatTitle(item) {
  const raw = String(item?.title || "").trim();
  if (!raw) {
    const fromType = String(item?.type || "")
      .replace(/[._-]+/g, " ")
      .trim();
    if (!fromType) return "Notification";
    return fromType.replace(/\b\w/g, (char) => char.toUpperCase());
  }

  // "Appointment CONFIRMED" reads better as "Appointment Confirmed"
  return raw
    .split(/\s+/)
    .map((word, index) => {
      if (index === 0) return word.charAt(0).toUpperCase() + word.slice(1);
      if (word.length > 1 && word === word.toUpperCase() && /[A-Z]/.test(word)) {
        return word.charAt(0) + word.slice(1).toLowerCase();
      }
      return word;
    })
    .join(" ");
}

function formatBody(item) {
  let body = String(item?.body || "").trim();
  const actionText = typeof item?.actionText === "string" ? item.actionText.trim() : "";
  if (actionText && body.toLowerCase().endsWith(actionText.toLowerCase())) {
    body = body.slice(0, body.length - actionText.length).trim().replace(/[.:\-–—]+$/, "").trim();
  }
  return body;
}

function formatTimestamp(dateStr) {
  if (!dateStr) return "Just now";
  try {
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return "";

    const diffMins = Math.floor((Date.now() - date.getTime()) / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return diffHours === 1 ? "1 hour ago" : `${diffHours} hours ago`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

function triggerHaptic(style = Haptics.ImpactFeedbackStyle.Light) {
  try {
    Haptics.impactAsync(style);
  } catch {
    // Haptics are a nice-to-have and are unavailable on some platforms.
  }
}

function SwipeableNotificationItem({ item, onPress, onDelete }) {
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  const translateX = useRef(new Animated.Value(0)).current;
  const rowHeight = useRef(new Animated.Value(1)).current;
  const rowOpacity = useRef(new Animated.Value(1)).current;
  const dragStart = useRef(0);
  const isOpenRef = useRef(false);
  const isDeletingRef = useRef(false);
  const onPressRef = useRef(onPress);
  const onDeleteRef = useRef(onDelete);
  const itemRef = useRef(item);

  onPressRef.current = onPress;
  onDeleteRef.current = onDelete;
  itemRef.current = item;

  const snapTo = (open) => {
    isOpenRef.current = open;
    Animated.spring(translateX, {
      toValue: open ? -DELETE_ACTION_WIDTH : 0,
      useNativeDriver: true,
      speed: 20,
      bounciness: 4,
    }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) > 6 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.4,
      onPanResponderGrant: () => {
        translateX.stopAnimation((value) => {
          dragStart.current = value;
        });
      },
      onPanResponderMove: (_, gesture) => {
        const next = dragStart.current + gesture.dx;
        // Only allow revealing the action on the left, with a small overscroll
        // when the row is already open.
        translateX.setValue(Math.min(0, Math.max(-DELETE_ACTION_WIDTH - 8, next)));
      },
      onPanResponderRelease: (_, gesture) => {
        const position = dragStart.current + gesture.dx;
        const shouldOpen = position < -DELETE_ACTION_WIDTH * 0.4 || gesture.vx < -0.45;
        if (shouldOpen && !isOpenRef.current) {
          triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
        }
        snapTo(shouldOpen);
      },
      onPanResponderTerminate: () => snapTo(isOpenRef.current),
      onPanResponderTerminationRequest: () => false,
    })
  ).current;

  const handleCardPress = () => {
    if (isOpenRef.current) {
      snapTo(false);
      return;
    }
    onPressRef.current?.(itemRef.current);
  };

  const handleDelete = () => {
    if (isDeletingRef.current) return;
    isDeletingRef.current = true;
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);

    Animated.parallel([
      Animated.timing(rowOpacity, {
        toValue: 0,
        duration: 140,
        useNativeDriver: true,
      }),
      Animated.timing(rowHeight, {
        toValue: 0,
        duration: 220,
        useNativeDriver: false,
      }),
    ]).start(() => {
      onDeleteRef.current?.(itemRef.current);
    });
  };

  const meta = getNotificationMeta(item);
  const tone = TONES[meta.tone] || TONES.pink;
  const toneColor = isDark ? tone.dark : tone.light;
  const toneTint = isDark ? tone.tintDark : tone.tintLight;
  const isUnread = !item?.isRead;
  const title = formatTitle(item);
  const body = formatBody(item);
  const timestamp = formatTimestamp(item?.createdAt);

  return (
    <Animated.View
      style={[
        styles.row,
        {
          opacity: rowOpacity,
          maxHeight: rowHeight.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 600],
          }),
        },
      ]}
    >
      <View
        style={[
          styles.shadowShell,
          {
            backgroundColor: colors.page,
            shadowOpacity: isDark ? 0 : 0.05,
            elevation: isDark ? 0 : 1,
          },
        ]}
      >
        <View style={[styles.clip, { backgroundColor: colors.page }]}>
          <View style={[styles.deleteLayer, { backgroundColor: colors.danger }]}>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDelete}
              activeOpacity={0.82}
              accessibilityRole="button"
              accessibilityLabel={`Delete ${title}`}
            >
              <Ionicons name="trash-outline" size={21} color={C.textLight} />
              <Text style={styles.deleteLabel}>Delete</Text>
            </TouchableOpacity>
          </View>

          <Animated.View
            {...panResponder.panHandlers}
            style={[
              styles.card,
              {
                backgroundColor: isUnread ? colors.surfaceUnread : colors.surface,
                borderColor: isUnread ? colors.borderUnread : colors.border,
                transform: [{ translateX }],
              },
            ]}
          >
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={handleCardPress}
              style={styles.cardInner}
              accessibilityRole="button"
              accessibilityLabel={`${title}. ${body || ""}${isUnread ? " Unread." : ""}`}
            >
              <View style={[styles.iconTile, { backgroundColor: toneTint }]}>
                <Ionicons name={meta.icon} size={21} color={toneColor} />
              </View>

              <View style={styles.content}>
                <View style={styles.titleRow}>
                  <Text
                    style={[styles.title, { color: colors.ink }]}
                    numberOfLines={2}
                  >
                    {title}
                  </Text>
                  {isUnread ? (
                    <View style={[styles.unreadDot, { backgroundColor: colors.accent }]} />
                  ) : null}
                </View>

                {body ? (
                  <Text
                    style={[styles.body, { color: colors.body }]}
                    numberOfLines={3}
                  >
                    {body}
                  </Text>
                ) : null}

                <View style={styles.footerRow}>
                  <Text style={[styles.timestamp, { color: colors.muted }]}>
                    {timestamp}
                  </Text>

                  {meta.actionLabel ? (
                    <View style={styles.action}>
                      <Text style={[styles.actionText, { color: colors.accent }]}>
                        {meta.actionLabel}
                      </Text>
                      <Ionicons
                        name="arrow-forward"
                        size={12}
                        color={colors.accent}
                        style={styles.actionIcon}
                      />
                    </View>
                  ) : null}
                </View>
              </View>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    </Animated.View>
  );
}

export default memo(SwipeableNotificationItem);

function getColors(isDark) {
  return {
    page: isDark ? C.bg : C.bg,
    surface: C.surface,
    surfaceUnread: isDark ? C.ink : C.lifted,
    border: isDark ? C.border : C.lifted,
    borderUnread: isDark ? "rgba(255, 122, 154, 0.26)" : "rgba(255, 96, 130, 0.20)",
    ink: isDark ? C.lifted : C.ink,
    body: isDark ? C.muted : C.muted,
    muted: isDark ? C.muted : C.muted,
    accent: isDark ? C.main : C.main,
    danger: C.error,
  };
}

const styles = StyleSheet.create({
  row: {
    overflow: "hidden",
    paddingBottom: 10,
  },
  shadowShell: {
    borderRadius: 18,
    shadowColor: C.ink,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 10,
  },
  clip: {
    borderRadius: 18,
    overflow: "hidden",
  },
  deleteLayer: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    width: DELETE_ACTION_WIDTH + 8,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteButton: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  deleteLabel: {
    color: C.textLight,
    fontSize: 12,
    fontFamily: "Oswald_700Bold",
    marginTop: 3,
    letterSpacing: 0.3,
  },
  card: {
    width: "100%",
    borderRadius: 18,
    borderWidth: 1,
  },
  cardInner: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 14,
  },
  iconTile: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  title: {
    flex: 1,
    fontSize: 11,
    lineHeight: 24,
    fontFamily: "Oswald_700Bold",
    letterSpacing: 0.1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
    marginTop: 2,
  },
  body: {
    fontSize: 12,
    lineHeight: 19,
    fontFamily: "DMSans_400Regular",
    marginTop: 4,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 9,
  },
  timestamp: {
    fontSize: 12,
    fontFamily: "DMSans_400Regular",
  },
  action: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionText: {
    fontSize: 12,
    fontFamily: "Oswald_700Bold",
  },
  actionIcon: {
    marginLeft: 3,
  },
});
