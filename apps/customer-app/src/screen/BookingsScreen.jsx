// src/screen/BookingsScreen.jsx
import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  Animated,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C, FF } from "../theme";
import { appointmentService } from "../services/appointmentService";
import { paiseToINR } from "../services/apiClient";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { socketClient } from "../services/socketClient";
import { notificationService } from "../services/notificationService";
import ErrorCardModal from "../components/ErrorCardModal";
import AppointmentDetailModal from "../components/AppointmentDetailModal";
import RescheduleModal from "../components/RescheduleModal";
import CancelBookingModal from "../components/CancelBookingModal";
import AddReviewModal from "../components/AddReviewModal";
import { storage } from "../services/storage";

const TABS = ["Upcoming", "Past"];
const UPCOMING_STATUSES = ["PENDING", "CONFIRMED", "IN_PROGRESS"];
const PROMPTED_REVIEWS_KEY = "@bookings_prompted_review_ids";
const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const STATUS_META = {
  PENDING: { label: "Awaiting confirmation", color: C.warning, bg: "rgba(214, 158, 46, 0.14)", icon: "time-outline" },
  CONFIRMED: { label: "Confirmed", color: C.success, bg: "rgba(16, 185, 129, 0.14)", icon: "checkmark-circle-outline" },
  IN_PROGRESS: { label: "In service", color: C.info, bg: "rgba(99, 102, 241, 0.14)", icon: "cut-outline" },
  COMPLETED: { label: "Completed", color: C.muted, bg: "rgba(107, 114, 128, 0.12)", icon: "checkmark-done-outline" },
  CANCELLED: { label: "Cancelled", color: C.error, bg: "rgba(239, 68, 68, 0.12)", icon: "close-circle-outline" },
  NO_SHOW: { label: "Missed", color: C.error, bg: "rgba(239, 68, 68, 0.12)", icon: "alert-circle-outline" },
};

// ---------- appointment field helpers (API populates salonId/branchId/services) ----------

const getId = (a) => a?._id || a?.id;
const getStatus = (a) => (a?.status || "PENDING").toUpperCase();

function getSalonName(a) {
  return (
    a.salon?.name ||
    (typeof a.salonId === "object" ? a.salonId?.name : null) ||
    (typeof a.branchId === "object" ? a.branchId?.name : null) ||
    "Salon"
  );
}

function getBranchAddress(a) {
  return a.branch?.address || (typeof a.branchId === "object" ? a.branchId?.address : null) || null;
}

// "Plot 12, KIIT Square, Patia" -> "Patia, Bhubaneswar"
function getAreaText(a) {
  const addr = getBranchAddress(a);
  if (!addr) return null;
  if (typeof addr === "string") return addr;
  const parts = (addr.street || "").split(",").map((p) => p.trim()).filter(Boolean);
  const area = parts[parts.length - 1];
  return [area, addr.city].filter(Boolean).join(", ") || null;
}

function getServices(a) {
  if (Array.isArray(a.services) && a.services.length > 0) {
    return a.services.filter((s) => s && typeof s === "object");
  }
  if (a.serviceId && typeof a.serviceId === "object") return [a.serviceId];
  if (a.service && typeof a.service === "object") return [a.service];
  return [];
}

function getRawDate(a) {
  return a.date || (typeof a.slotId === "object" ? a.slotId?.date : null);
}

function getRawTime(a, key = "startTime") {
  return a[key] || (typeof a.slotId === "object" ? a.slotId?.[key] : null);
}

function getStartDate(a) {
  const date = getRawDate(a);
  if (!date) return null;
  const time = getRawTime(a) || "00:00";
  const d = new Date(`${date}T${time.slice(0, 5)}:00`);
  return isNaN(d.getTime()) ? null : d;
}

function formatTime(timeStr) {
  if (!timeStr) return "";
  const [h, m = "00"] = timeStr.split(":");
  let hours = parseInt(h, 10);
  if (isNaN(hours)) return timeStr;
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${hours}:${m.slice(0, 2)} ${ampm}`;
}

function formatTimeRange(a) {
  const start = getRawTime(a, "startTime");
  const end = getRawTime(a, "endTime");
  if (!start) return "";
  return end ? `${formatTime(start)} – ${formatTime(end)}` : formatTime(start);
}

// "Today · in 2h 15m", "Tomorrow", "In 3 days", "Mon, 12 Oct"
function getCountdownText(start, status) {
  if (status === "IN_PROGRESS") return "In service now";
  if (!start) return "";
  const now = new Date();
  // Still "upcoming" only because the salon hasn't marked it completed/cancelled yet
  if (start.getTime() < now.getTime() - 15 * 60000) return "Time passed · awaiting salon";
  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const dayDiff = Math.round((startOfDay(start) - startOfDay(now)) / 86400000);
  if (dayDiff === 0) {
    const mins = Math.round((start.getTime() - now.getTime()) / 60000);
    if (mins <= 0) return "Today · now";
    if (mins < 60) return `Today · in ${mins} min`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `Today · in ${h}h${m ? ` ${m}m` : ""}`;
  }
  if (dayDiff === 1) return "Tomorrow";
  if (dayDiff > 1 && dayDiff < 7) return `In ${dayDiff} days`;
  return `${WEEKDAYS[start.getDay()]}, ${start.getDate()} ${MONTHS_SHORT[start.getMonth()]}`;
}

function getTotalMinutes(a, services) {
  return a.totalDurationMinutes || services.reduce((sum, s) => sum + (s.durationMinutes || 0), 0) || null;
}

function openDirections(a) {
  const addr = getBranchAddress(a);
  const query =
    typeof addr === "string"
      ? addr
      : [getSalonName(a), addr?.street, addr?.city].filter(Boolean).join(", ");
  if (!query) return;
  Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`).catch(() => {});
}

// ---------- screen ----------

export default function BookingsScreen({ navigate, onScroll }) {
  const { isAuthenticated, user } = useAuth();
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => getStyles(theme, isDark), [theme, isDark]);
  const brand = C.main;

  const [activeTab, setActiveTab] = useState("Upcoming");
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [rescheduleAppt, setRescheduleAppt] = useState(null);
  const [cancelApptModal, setCancelApptModal] = useState(null);
  const [reviewModalAppt, setReviewModalAppt] = useState(null);
  const [statusToast, setStatusToast] = useState(null);
  const [segmentWidth, setSegmentWidth] = useState(0);
  const [pastFilter, setPastFilter] = useState("All");
  const [loadFailed, setLoadFailed] = useState(false);
  const [, setNowTick] = useState(0);

  const segmentAnim = useRef(new Animated.Value(0)).current;
  const fetchIdRef = useRef(0);
  const promptedReviewIdsRef = useRef(new Set());
  const selectedApptRef = useRef(selectedAppt);
  selectedApptRef.current = selectedAppt;
  const appointmentsRef = useRef(appointments);
  appointmentsRef.current = appointments;

  const switchTab = (tab) => {
    setActiveTab(tab);
    Animated.spring(segmentAnim, {
      toValue: TABS.indexOf(tab),
      useNativeDriver: true,
      speed: 20,
      bounciness: 4,
    }).start();
  };

  // Toasts dismiss themselves
  useEffect(() => {
    if (!statusToast) return;
    const t = setTimeout(() => setStatusToast(null), 4000);
    return () => clearTimeout(t);
  }, [statusToast]);

  // Countdowns like "in 2h 15m" go stale, so re-render once a minute
  useEffect(() => {
    const t = setInterval(() => setNowTick((n) => n + 1), 60000);
    return () => clearInterval(t);
  }, []);

  // Review prompts already shown survive restarts, so dismissing one doesn't bring it back next launch
  const rememberPrompted = (id) => {
    if (!id || promptedReviewIdsRef.current.has(id)) return;
    promptedReviewIdsRef.current.add(id);
    storage.setItem(PROMPTED_REVIEWS_KEY, JSON.stringify([...promptedReviewIdsRef.current].slice(-200))).catch(() => {});
  };

  const handleAddReviewSubmit = async ({ rating, comment }) => {
    if (!reviewModalAppt) return;
    const apptId = getId(reviewModalAppt);
    try {
      await appointmentService.rateAppointment(apptId, rating, comment);
      setAppointments((prev) =>
        prev.map((a) =>
          getId(a) === apptId
            ? { ...a, rating: { score: rating, review: comment, ratedAt: new Date().toISOString() } }
            : a
        )
      );
      setStatusToast({ type: "success", title: "Review submitted", message: "Thank you for reviewing your visit!" });
    } catch (err) {
      setError(err.message || "Failed to submit review");
      // Rethrow so the review sheet stays open with the text the customer typed
      throw err;
    }
  };

  // silent: no skeleton (socket updates, pull-to-refresh). reportErrors: tell the user if it fails.
  const fetchAppointments = async (silent = false, reportErrors = !silent) => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    const requestId = ++fetchIdRef.current;
    const isStale = () => requestId !== fetchIdRef.current;
    try {
      if (!silent) setLoading(true);
      const res = await appointmentService.getAppointments();
      if (isStale()) return;
      const newApptList = res.data?.appointments || (Array.isArray(res.data) ? res.data : []);
      setLoadFailed(false);

      // Real-time status change detection
      if (silent && appointmentsRef.current.length > 0) {
        newApptList.forEach((newAppt) => {
          const oldAppt = appointmentsRef.current.find((a) => getId(a) === getId(newAppt));
          if (!oldAppt || oldAppt.status === newAppt.status) return;

          const salonName = getSalonName(newAppt);
          const serviceName = getServices(newAppt)[0]?.name || "your service";

          notificationService.notifyStatusChange(newAppt.status, salonName, serviceName);

          if (newAppt.status === "CONFIRMED") {
            setStatusToast({ type: "success", title: "Booking confirmed", message: `${salonName} accepted your appointment for ${serviceName}.` });
          } else if (newAppt.status === "IN_PROGRESS") {
            setStatusToast({ type: "info", title: "Service started", message: `Your appointment for ${serviceName} is now in progress.` });
          } else if (newAppt.status === "COMPLETED") {
            setStatusToast({ type: "success", title: "Service completed", message: `Thank you for visiting ${salonName}.` });
            if (!newAppt.rating?.score && !promptedReviewIdsRef.current.has(getId(newAppt))) {
              rememberPrompted(getId(newAppt));
              setReviewModalAppt(newAppt);
            }
          } else if (newAppt.status === "CANCELLED") {
            setStatusToast({ type: "warning", title: "Appointment cancelled", message: `Your booking for ${serviceName} was cancelled.` });
          }
        });
      }

      setAppointments(newApptList);
      if (selectedApptRef.current) {
        const updatedSelected = newApptList.find((a) => getId(a) === getId(selectedApptRef.current));
        if (updatedSelected) setSelectedAppt(updatedSelected);
      }

      // Auto-popup review modal for the last completed appointment
      const lastUnratedCompleted = newApptList
        .filter((a) => getStatus(a) === "COMPLETED" && !a.rating?.score && !promptedReviewIdsRef.current.has(getId(a)))
        .sort((a, b) => new Date(b.updatedAt || b.date || 0) - new Date(a.updatedAt || a.date || 0))[0];

      if (lastUnratedCompleted) {
        rememberPrompted(getId(lastUnratedCompleted));
        setReviewModalAppt(lastUnratedCompleted);
      }
    } catch (err) {
      if (isStale()) return;
      console.log("Error loading appointments:", err.message);
      if (appointmentsRef.current.length === 0) setLoadFailed(true);
      if (reportErrors) setError("We couldn't load your bookings. Check your connection and try again.");
    } finally {
      if (!isStale()) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  };

  // Initial load & notification permission request. Signing out (or in as someone else)
  // must not leave the previous account's bookings on screen.
  useEffect(() => {
    setAppointments([]);
    setSelectedAppt(null);
    setReviewModalAppt(null);
    setLoadFailed(false);
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const saved = JSON.parse((await storage.getItem(PROMPTED_REVIEWS_KEY)) || "[]");
        if (Array.isArray(saved)) saved.forEach((id) => promptedReviewIdsRef.current.add(id));
      } catch (e) { }
      if (cancelled) return;
      notificationService.requestPermissions();
      fetchAppointments(false);
    })();
    return () => { cancelled = true; };
  }, [isAuthenticated, user?._id || user?.id]);

  // Real-Time Event-Driven WebSockets
  useEffect(() => {
    if (!isAuthenticated) return;
    const userId = user?._id || user?.id;
    if (userId) socketClient.connect(userId);

    const unsubscribeStatus = socketClient.onAppointmentStatusChanged(() => fetchAppointments(true));
    const unsubscribeUpdated = socketClient.onAppointmentUpdated(() => fetchAppointments(true));

    return () => {
      if (typeof unsubscribeStatus === "function") unsubscribeStatus();
      if (typeof unsubscribeUpdated === "function") unsubscribeUpdated();
    };
  }, [isAuthenticated, user]);

  const { upcoming, past, pastStats } = useMemo(() => {
    const up = appointments
      .filter((a) => UPCOMING_STATUSES.includes(getStatus(a)))
      .sort((a, b) => (getStartDate(a)?.getTime() || 0) - (getStartDate(b)?.getTime() || 0));

    const pastList = appointments
      .filter((a) => !UPCOMING_STATUSES.includes(getStatus(a)))
      .sort((a, b) => (getStartDate(b)?.getTime() || 0) - (getStartDate(a)?.getTime() || 0));

    // Stats only count visits that actually happened
    const completed = pastList.filter((a) => getStatus(a) === "COMPLETED");
    const spent = completed.reduce((sum, a) => sum + (typeof a.pricePaid === "number" ? a.pricePaid : 0), 0);
    const salonVisits = {};
    completed.forEach((a) => {
      const name = getSalonName(a);
      salonVisits[name] = (salonVisits[name] || 0) + 1;
    });
    const topSalon = Object.entries(salonVisits).sort((x, y) => y[1] - x[1])[0]?.[0] || null;

    return {
      upcoming: up,
      past: pastList,
      pastStats: {
        visits: completed.length,
        spent,
        topSalon,
        cancelled: pastList.length - completed.length,
      },
    };
  }, [appointments]);

  const pastByMonth = useMemo(() => {
    const filtered = past.filter((a) => {
      const s = getStatus(a);
      if (pastFilter === "Completed") return s === "COMPLETED";
      if (pastFilter === "Cancelled") return s === "CANCELLED" || s === "NO_SHOW";
      return true;
    });
    const groups = [];
    filtered.forEach((a) => {
      const d = getStartDate(a);
      const key = d ? `${MONTHS_LONG[d.getMonth()]} ${d.getFullYear()}` : "Earlier";
      const last = groups[groups.length - 1];
      if (last && last.key === key) last.items.push(a);
      else groups.push({ key, items: [a] });
    });
    return groups;
  }, [past, pastFilter]);
  const pastCount = past.length;

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAppointments(true, true);
  };

  const handleCancelSuccess = () => {
    setCancelApptModal(null);
    setStatusToast({ type: "warning", title: "Appointment cancelled", message: "Your appointment has been cancelled." });
    fetchAppointments(true);
  };

  const handleRescheduleSuccess = () => {
    setRescheduleAppt(null);
    setStatusToast({ type: "success", title: "Rescheduled", message: "Your appointment has been moved to the new time slot." });
    fetchAppointments(true);
  };

  const bookAgain = (a) => {
    const salonId = typeof a.salonId === "object" ? a.salonId?._id : a.salonId;
    if (navigate && salonId) navigate("SalonDetail", { salonId, salon: { _id: salonId, name: getSalonName(a) } });
  };

  if (!isAuthenticated) {
    return <GuestView styles={styles} brand={brand} navigate={navigate} />;
  }

  // ---------- render pieces ----------

  const renderStatusChip = (status, compact = false) => {
    const meta = STATUS_META[status] || STATUS_META.PENDING;
    return (
      <View style={[styles.statusChip, { backgroundColor: meta.bg }, compact && styles.statusChipCompact]}>
        <Ionicons name={meta.icon} size={compact ? 11 : 12} color={meta.color} style={{ marginRight: 4 }} />
        <Text style={[styles.statusChipText, { color: meta.color }, compact && { fontSize: 11 }]}>{meta.label}</Text>
      </View>
    );
  };

  const renderDateTile = (a, large = false) => {
    const d = getStartDate(a);
    return (
      <View style={[styles.dateTile, large && styles.dateTileLarge]}>
        <Text style={[styles.dateTileMonth, large && styles.dateTileMonthLarge]}>
          {d ? MONTHS_SHORT[d.getMonth()].toUpperCase() : "--"}
        </Text>
        <Text style={[styles.dateTileDay, large && styles.dateTileDayLarge]}>{d ? d.getDate() : "--"}</Text>
        <Text style={[styles.dateTileWeekday, large && styles.dateTileWeekdayLarge]}>{d ? WEEKDAYS[d.getDay()] : ""}</Text>
      </View>
    );
  };

  const renderNextVisit = (a) => {
    const status = getStatus(a);
    const services = getServices(a);
    const mins = getTotalMinutes(a, services);
    const area = getAreaText(a);
    const canModify = status === "PENDING" || status === "CONFIRMED";

    return (
      <TouchableOpacity style={styles.heroCard} activeOpacity={0.94} onPress={() => setSelectedAppt(a)}>
        <View style={styles.heroTopRow}>
          <View style={styles.heroCountdownPill}>
            <Ionicons name="hourglass-outline" size={12} color={C.textLight} style={{ marginRight: 5 }} />
            <Text style={styles.heroCountdownText}>{getCountdownText(getStartDate(a), status)}</Text>
          </View>
          {renderStatusChip(status, true)}
        </View>

        <View style={styles.heroBody}>
          {renderDateTile(a, true)}
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={styles.heroSalon} numberOfLines={2}>{getSalonName(a)}</Text>
            {area ? (
              <View style={styles.rowCenter}>
                <Ionicons name="location-outline" size={13} color="rgba(255,255,255,0.7)" />
                <Text style={styles.heroMuted} numberOfLines={1}>{area}</Text>
              </View>
            ) : null}
            <View style={[styles.rowCenter, { marginTop: 6 }]}>
              <Ionicons name="time-outline" size={13} color="rgba(255,255,255,0.7)" />
              <Text style={styles.heroMuted}>{formatTimeRange(a)}</Text>
            </View>
          </View>
        </View>

        {services.length > 0 ? (
          <View style={styles.heroServices}>
            {services.map((s, i) => (
              <View key={getId(s) || i} style={styles.heroServiceRow}>
                <Text style={styles.heroServiceName} numberOfLines={1}>{s.name}</Text>
                {s.durationMinutes ? <Text style={styles.heroServiceMeta}>{s.durationMinutes} min</Text> : null}
              </View>
            ))}
            <View style={styles.heroTotalRow}>
              <Text style={styles.heroTotalLabel}>
                {services.length} {services.length === 1 ? "service" : "services"}{mins ? ` · ${mins} min` : ""}
              </Text>
              {typeof a.pricePaid === "number" ? <Text style={styles.heroTotalValue}>{paiseToINR(a.pricePaid)}</Text> : null}
            </View>
          </View>
        ) : null}

        <View style={styles.heroActions}>
          <TouchableOpacity style={styles.heroPrimaryBtn} activeOpacity={0.85} onPress={() => openDirections(a)}>
            <Ionicons name="navigate" size={15} color={C.ink} style={{ marginRight: 6 }} />
            <Text style={styles.heroPrimaryBtnText}>Directions</Text>
          </TouchableOpacity>
          {canModify ? (
            <>
              <TouchableOpacity style={styles.heroIconBtn} activeOpacity={0.8} onPress={() => setRescheduleAppt(a)}>
                <Ionicons name="calendar-outline" size={17} color={C.textLight} />
                <Text style={styles.heroIconBtnText}>Reschedule</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.heroIconBtn} activeOpacity={0.8} onPress={() => setCancelApptModal(a)}>
                <Ionicons name="close" size={17} color={C.textLight} />
                <Text style={styles.heroIconBtnText}>Cancel</Text>
              </TouchableOpacity>
            </>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  const renderCompactCard = (a) => {
    const status = getStatus(a);
    const serviceText = getServices(a).map((s) => s.name).filter(Boolean).join(", ");

    return (
      <TouchableOpacity key={getId(a)} style={styles.card} activeOpacity={0.92} onPress={() => setSelectedAppt(a)}>
        <View style={styles.cardRow}>
          {renderDateTile(a)}
          <View style={styles.cardInfo}>
            <Text style={styles.cardSalon} numberOfLines={1}>{getSalonName(a)}</Text>
            <Text style={styles.cardMeta} numberOfLines={1}>
              {formatTimeRange(a)}{getAreaText(a) ? ` · ${getAreaText(a)}` : ""}
            </Text>
            {serviceText ? <Text style={styles.cardServices} numberOfLines={1}>{serviceText}</Text> : null}
            <View style={styles.cardFooter}>
              {renderStatusChip(status, true)}
              {typeof a.pricePaid === "number" ? <Text style={styles.cardPrice}>{paiseToINR(a.pricePaid)}</Text> : null}
            </View>
          </View>
          <Ionicons name="chevron-forward" size={16} color={isDark ? C.muted : C.muted} />
        </View>

      </TouchableOpacity>
    );
  };

  const renderEmpty = (tab) => (
    <View style={styles.emptyBox}>
      <View style={styles.emptyIconCircle}>
        <Ionicons name={tab === "Upcoming" ? "calendar-clear-outline" : "receipt-outline"} size={30} color={brand} />
      </View>
      <Text style={styles.emptyTitle}>{tab === "Upcoming" ? "No upcoming visits" : "No past visits yet"}</Text>
      <Text style={styles.emptySub}>
        {tab === "Upcoming"
          ? "Find a salon you love and book your next appointment in a few taps."
          : "Your completed and cancelled appointments will show up here."}
      </Text>
      <TouchableOpacity style={[styles.emptyCta, { backgroundColor: brand }]} activeOpacity={0.88} onPress={() => navigate && navigate("Home")}>
        <Ionicons name="search" size={16} color={C.textLight} style={{ marginRight: 6 }} />
        <Text style={styles.emptyCtaText}>Find a salon</Text>
      </TouchableOpacity>
    </View>
  );

  // A failed load must not look like "you have no bookings"
  const renderLoadError = () => (
    <View style={styles.emptyBox}>
      <View style={styles.emptyIconCircle}>
        <Ionicons name="cloud-offline-outline" size={30} color={brand} />
      </View>
      <Text style={styles.emptyTitle}>Couldn't load your bookings</Text>
      <Text style={styles.emptySub}>Check your internet connection and try again.</Text>
      <TouchableOpacity style={[styles.emptyCta, { backgroundColor: brand }]} activeOpacity={0.88} onPress={() => fetchAppointments(false, false)}>
        <Ionicons name="refresh" size={16} color={C.textLight} style={{ marginRight: 6 }} />
        <Text style={styles.emptyCtaText}>Try again</Text>
      </TouchableOpacity>
    </View>
  );

  const renderSkeleton = () => (
    <View>
      <View style={[styles.skeleton, { height: 260, borderRadius: 24, marginBottom: 20 }]} />
      {[0, 1].map((i) => (
        <View key={i} style={[styles.skeleton, { height: 96, borderRadius: 18, marginBottom: 12 }]} />
      ))}
    </View>
  );

  const renderUpcoming = () => {
    if (upcoming.length === 0) return renderEmpty("Upcoming");
    const [next, ...later] = upcoming;
    return (
      <View>
        <Text style={styles.sectionLabel}>NEXT VISIT</Text>
        {renderNextVisit(next)}
        {later.length > 0 ? (
          <>
            <Text style={[styles.sectionLabel, { marginTop: 24 }]}>LATER</Text>
            {later.map((a) => renderCompactCard(a))}
          </>
        ) : null}
      </View>
    );
  };

  const renderPastRow = (a, isLast) => {
    const status = getStatus(a);
    const meta = STATUS_META[status] || STATUS_META.COMPLETED;
    const d = getStartDate(a);
    const serviceText = getServices(a).map((s) => s.name).filter(Boolean).join(", ");
    const isCompleted = status === "COMPLETED";
    const ratedScore = a.rating?.score;

    return (
      <TouchableOpacity
        key={getId(a)}
        style={[styles.historyRow, !isLast && styles.historyRowDivider]}
        activeOpacity={0.7}
        onPress={() => setSelectedAppt(a)}
      >
        <View style={styles.historyDate}>
          <Text style={styles.historyDay}>{d ? d.getDate() : "--"}</Text>
          <Text style={styles.historyMonth}>{d ? MONTHS_SHORT[d.getMonth()] : ""}</Text>
        </View>

        <View style={styles.historyInfo}>
          <View style={styles.historyTitleRow}>
            <Text style={styles.historySalon} numberOfLines={1}>{getSalonName(a)}</Text>
            {typeof a.pricePaid === "number" ? (
              <Text style={[styles.historyPrice, !isCompleted && styles.historyPriceVoid]}>{paiseToINR(a.pricePaid)}</Text>
            ) : null}
          </View>
          {serviceText ? <Text style={styles.historyServices} numberOfLines={1}>{serviceText}</Text> : null}

          <View style={styles.historyMetaRow}>
            <View style={[styles.statusDot, { backgroundColor: meta.color }]} />
            <Text style={[styles.historyStatus, { color: meta.color }]}>{meta.label}</Text>

            {isCompleted ? (
              ratedScore ? (
                <View style={styles.historyLink}>
                  <Ionicons name="star" size={12} color={C.warning} />
                  <Text style={styles.historyRated}>{ratedScore}/5</Text>
                </View>
              ) : (
                <TouchableOpacity style={styles.historyLink} hitSlop={8} onPress={() => setReviewModalAppt(a)}>
                  <Ionicons name="star-outline" size={12} color={brand} />
                  <Text style={[styles.historyLinkText, { color: brand }]}>Rate</Text>
                </TouchableOpacity>
              )
            ) : null}

            <TouchableOpacity style={styles.historyLink} hitSlop={8} onPress={() => bookAgain(a)}>
              <Ionicons name="refresh" size={12} color={brand} />
              <Text style={[styles.historyLinkText, { color: brand }]}>Book again</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderPast = () => {
    if (pastCount === 0) return renderEmpty("Past");

    const filters = [
      { key: "All", count: pastCount },
      { key: "Completed", count: pastStats.visits },
      { key: "Cancelled", count: pastStats.cancelled },
    ];

    return (
      <View>
        {/* Summary */}
        <View style={styles.statsCard}>
          <View style={styles.statCell}>
            <Text style={styles.statValue}>{pastStats.visits}</Text>
            <Text style={styles.statLabel}>{pastStats.visits === 1 ? "Visit" : "Visits"}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCell}>
            <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>{paiseToINR(pastStats.spent)}</Text>
            <Text style={styles.statLabel}>Spent</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCell}>
            <Text style={[styles.statValue, styles.statValueSmall]} numberOfLines={2}>{pastStats.topSalon || "—"}</Text>
            <Text style={styles.statLabel}>Top salon</Text>
          </View>
        </View>

        {/* Filters */}
        <View style={styles.filterRow}>
          {filters.map((f) => {
            const isActive = pastFilter === f.key;
            return (
              <TouchableOpacity
                key={f.key}
                style={[styles.filterChip, isActive && { backgroundColor: brand, borderColor: brand }]}
                activeOpacity={0.8}
                onPress={() => setPastFilter(f.key)}
              >
                <Text style={[styles.filterChipText, isActive && { color: C.textLight }]}>
                  {f.key} · {f.count}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* List */}
        {pastByMonth.length === 0 ? (
          <Text style={styles.filterEmpty}>No {pastFilter.toLowerCase()} visits.</Text>
        ) : (
          pastByMonth.map((group) => (
            <View key={group.key} style={{ marginBottom: 18 }}>
              <Text style={styles.sectionLabel}>{group.key.toUpperCase()}</Text>
              <View style={styles.historyGroup}>
                {group.items.map((a, i) => renderPastRow(a, i === group.items.length - 1))}
              </View>
            </View>
          ))
        )}
      </View>
    );
  };

  const subtitle =
    upcoming.length === 0
      ? "No upcoming visits"
      : `${upcoming.length} upcoming ${upcoming.length === 1 ? "visit" : "visits"}`;

  const pillWidth = segmentWidth > 0 ? (segmentWidth - 8) / TABS.length : 0;
  const toastColor = { success: C.success, warning: C.warning, info: C.info }[statusToast?.type] || brand;

  return (
    <View style={styles.container}>
      <ErrorCardModal visible={!!error} title="Bookings" message={error} onClose={() => setError(null)} />

      <AppointmentDetailModal
        visible={!!selectedAppt}
        appointment={selectedAppt}
        onClose={() => setSelectedAppt(null)}
        onReschedule={(appt) => {
          setSelectedAppt(null);
          setRescheduleAppt(appt);
        }}
        onCancel={(appt) => {
          setSelectedAppt(null);
          setCancelApptModal(appt);
        }}
      />

      {rescheduleAppt && (
        <RescheduleModal
          visible={!!rescheduleAppt}
          booking={rescheduleAppt}
          onClose={() => setRescheduleAppt(null)}
          onConfirm={async (id, newSlotId) => {
            await appointmentService.rescheduleAppointment(id, newSlotId);
            handleRescheduleSuccess();
          }}
        />
      )}

      {cancelApptModal && (
        <CancelBookingModal
          visible={!!cancelApptModal}
          booking={cancelApptModal}
          onClose={() => setCancelApptModal(null)}
          onConfirm={async (id, reason) => {
            await appointmentService.cancelAppointment(id, reason);
            handleCancelSuccess();
          }}
        />
      )}

      <AddReviewModal
        visible={!!reviewModalAppt}
        onClose={() => setReviewModalAppt(null)}
        onSubmit={handleAddReviewSubmit}
        appointment={reviewModalAppt}
        onSuccess={() => {
          setReviewModalAppt(null);
          setStatusToast({ type: "success", title: "Review submitted", message: "Thank you for rating your salon experience." });
          fetchAppointments(true);
        }}
      />

      {statusToast ? (
        <View style={[styles.toastBanner, { borderLeftColor: toastColor }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.toastTitle, { color: toastColor }]}>{statusToast.title}</Text>
            <Text style={styles.toastMessage}>{statusToast.message}</Text>
          </View>
          <TouchableOpacity style={styles.toastCloseBtn} onPress={() => setStatusToast(null)}>
            <Ionicons name="close" size={16} color={C.textLight} />
          </TouchableOpacity>
        </View>
      ) : null}

      <View style={styles.header}>
        <Text style={styles.title}>Bookings</Text>
        <Text style={styles.subTitle}>{loading ? " " : subtitle}</Text>

        <View style={styles.segment} onLayout={(e) => setSegmentWidth(e.nativeEvent.layout.width)}>
          {pillWidth > 0 ? (
            <Animated.View
              style={[
                styles.segmentPill,
                {
                  width: pillWidth,
                  transform: [{ translateX: segmentAnim.interpolate({ inputRange: [0, 1], outputRange: [0, pillWidth] }) }],
                },
              ]}
            />
          ) : null}
          {TABS.map((tab) => {
            const isSelected = activeTab === tab;
            const count = tab === "Upcoming" ? upcoming.length : pastCount;
            return (
              <TouchableOpacity key={tab} style={styles.segmentBtn} onPress={() => switchTab(tab)} activeOpacity={0.8}>
                <Text style={[styles.segmentText, isSelected && styles.segmentTextActive]}>{tab}</Text>
                {!loading && count > 0 ? (
                  <View style={[styles.segmentCount, isSelected && { backgroundColor: brand }]}>
                    <Text style={[styles.segmentCountText, isSelected && { color: C.textLight }]}>{count}</Text>
                  </View>
                ) : null}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={brand} colors={[brand]} />}
      >
        {loading && !refreshing
          ? renderSkeleton()
          : loadFailed
            ? renderLoadError()
            : activeTab === "Upcoming"
              ? renderUpcoming()
              : renderPast()}
      </ScrollView>
    </View>
  );
}

function GuestView({ styles, brand, navigate }) {
  const features = [
    { icon: "notifications-outline", title: "Live status updates", sub: "Know the moment your booking is confirmed" },
    { icon: "calendar-outline", title: "Reschedule in a tap", sub: "Move or cancel visits without calling" },
    { icon: "star-outline", title: "History & reviews", sub: "Rate visits and rebook your favourites" },
  ];
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Bookings</Text>
      </View>
      <ScrollView contentContainerStyle={styles.guestContent} showsVerticalScrollIndicator={false}>
        <View style={styles.emptyIconCircle}>
          <Ionicons name="calendar" size={30} color={brand} />
        </View>
        <Text style={styles.emptyTitle}>Your visits, all in one place</Text>
        <Text style={styles.emptySub}>Sign in to see upcoming appointments, manage bookings and view your history.</Text>

        <View style={styles.guestFeatures}>
          {features.map((f) => (
            <View key={f.title} style={styles.guestFeatureRow}>
              <View style={styles.guestFeatureIcon}>
                <Ionicons name={f.icon} size={18} color={brand} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.guestFeatureTitle}>{f.title}</Text>
                <Text style={styles.guestFeatureSub}>{f.sub}</Text>
              </View>
            </View>
          ))}
        </View>

        <TouchableOpacity style={[styles.emptyCta, styles.guestCta, { backgroundColor: brand }]} activeOpacity={0.88} onPress={() => navigate && navigate("Login")}>
          <Text style={styles.emptyCtaText}>Sign in</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.guestSignUpRow} activeOpacity={0.7} onPress={() => navigate && navigate("Register")}>
          <Text style={styles.guestSignUpMuted}>New to HairX? </Text>
          <Text style={[styles.guestSignUpLink, { color: brand }]}>Create an account</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function getStyles(theme = {}, isDark = false) {
  const bg = isDark ? C.ink : C.bg;
  const surface = C.surface;
  const border = isDark ? C.border : C.border;
  const text = isDark ? C.lifted : C.ink;
  const muted = C.muted;
  const brand = C.main;

  return StyleSheet.create({
    container: { flex: 1, backgroundColor: bg },
    rowCenter: { flexDirection: "row", alignItems: "center" },

    /* Header */
    header: { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 12, backgroundColor: bg },
    title: { fontFamily: FF.displayBold, fontSize: 30, color: text, letterSpacing: 0.3 },
    subTitle: { fontSize: 14, color: muted, marginTop: 2, marginBottom: 16 },

    /* Segmented control */
    segment: {
      flexDirection: "row",
      backgroundColor: isDark ? C.ink : C.lifted,
      borderRadius: 14,
      padding: 4,
    },
    segmentPill: {
      position: "absolute",
      top: 4,
      bottom: 4,
      left: 4,
      borderRadius: 10,
      backgroundColor: C.surface,
      shadowColor: C.ink,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0 : 0.08,
      shadowRadius: 3,
      elevation: 2,
    },
    segmentBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 10 },
    segmentText: { fontSize: 14, fontFamily: "Oswald_600SemiBold", color: muted },
    segmentTextActive: { color: text, fontFamily: "Oswald_700Bold" },
    segmentCount: {
      marginLeft: 6,
      minWidth: 20,
      height: 20,
      paddingHorizontal: 6,
      borderRadius: 10,
      backgroundColor: isDark ? C.border : C.border,
      alignItems: "center",
      justifyContent: "center",
    },
    segmentCountText: { fontSize: 11, fontFamily: "Oswald_700Bold", color: muted },

    contentContainer: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 120 },
    sectionLabel: { fontSize: 11, fontFamily: "Oswald_700Bold", color: muted, letterSpacing: 1.2, marginBottom: 10 },

    /* Status chip */
    statusChip: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999 },
    statusChipCompact: { paddingHorizontal: 8, paddingVertical: 3 },
    statusChipText: { fontSize: 12, fontFamily: "Oswald_700Bold" },

    /* Date tile */
    dateTile: {
      width: 56,
      paddingVertical: 8,
      borderRadius: 14,
      backgroundColor: isDark ? C.border : C.lifted,
      alignItems: "center",
    },
    dateTileLarge: { width: 72, paddingVertical: 10, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.1)" },
    dateTileMonth: { fontSize: 10, fontFamily: "Oswald_700Bold", color: brand, letterSpacing: 0.8 },
    dateTileMonthLarge: { fontSize: 11, color: C.error },
    dateTileDay: { fontSize: 22, fontFamily: "Oswald_700Bold", color: text, lineHeight: 26},
    dateTileDayLarge: { fontSize: 30, color: C.textLight, lineHeight: 34},
    dateTileWeekday: { fontSize: 11, fontFamily: "Oswald_600SemiBold", color: muted },
    dateTileWeekdayLarge: { fontSize: 12, color: "rgba(255,255,255,0.7)" },

    /* Next-visit hero */
    heroCard: {
      backgroundColor: isDark ? C.ink : C.ink,
      borderRadius: 24,
      padding: 18,
      shadowColor: C.ink,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.18,
      shadowRadius: 20,
      elevation: 6,
    },
    heroTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
    heroCountdownPill: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: brand,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 999,
    },
    heroCountdownText: { color: C.textLight, fontSize: 12, fontFamily: "Oswald_700Bold" },
    heroBody: { flexDirection: "row", alignItems: "center" },
    heroSalon: { fontSize: 19, fontFamily: "Oswald_700Bold", color: C.textLight, letterSpacing: 0.15, marginBottom: 6 },
    heroMuted: { fontSize: 13, color: "rgba(255,255,255,0.7)", marginLeft: 5, flexShrink: 1 },
    heroServices: {
      marginTop: 16,
      paddingTop: 14,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: "rgba(255,255,255,0.18)",
    },
    heroServiceRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
    heroServiceName: { flex: 1, fontSize: 14, fontFamily: "Oswald_600SemiBold", color: C.textLight, marginRight: 12 },
    heroServiceMeta: { fontSize: 12, color: "rgba(255,255,255,0.6)" },
    heroTotalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 6 },
    heroTotalLabel: { fontSize: 12, color: "rgba(255,255,255,0.6)" },
    heroTotalValue: { fontSize: 17, fontFamily: "Oswald_700Bold", color: C.textLight },
    heroActions: { flexDirection: "row", alignItems: "center", marginTop: 18, gap: 10 },
    heroPrimaryBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      height: 46,
      borderRadius: 14,
      backgroundColor: C.textLight,
    },
    heroPrimaryBtnText: { fontSize: 14, fontFamily: "Oswald_700Bold", color: C.ink },
    heroIconBtn: {
      height: 46,
      paddingHorizontal: 12,
      borderRadius: 14,
      backgroundColor: "rgba(255,255,255,0.12)",
      alignItems: "center",
      justifyContent: "center",
    },
    heroIconBtnText: { fontSize: 10, fontFamily: "Oswald_600SemiBold", color: "rgba(255,255,255,0.85)", marginTop: 2 },

    /* Compact card */
    card: {
      backgroundColor: surface,
      borderRadius: 18,
      padding: 14,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: border,
    },
    cardRow: { flexDirection: "row", alignItems: "center" },
    cardInfo: { flex: 1, marginLeft: 14, marginRight: 6 },
    cardSalon: { fontSize: 15, fontFamily: "Oswald_700Bold", color: text },
    cardMeta: { fontSize: 12.5, color: muted, marginTop: 2 },
    cardServices: { fontSize: 12.5, color: C.textSecondary, marginTop: 4 },
    cardFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 },
    cardPrice: { fontSize: 13, fontFamily: "Oswald_700Bold", color: text },

    /* History (Past tab) */
    statsCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: surface,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: border,
      paddingVertical: 16,
      marginBottom: 14,
    },
    statCell: { flex: 1, alignItems: "center", paddingHorizontal: 8 },
    statDivider: { width: StyleSheet.hairlineWidth, alignSelf: "stretch", backgroundColor: border },
    statValue: { fontSize: 20, fontFamily: "Oswald_700Bold", color: text, letterSpacing: 0.15, textAlign: "center" },
    statValueSmall: { fontSize: 14, letterSpacing: 0, lineHeight: 18},
    statLabel: { fontSize: 11.5, fontFamily: "Oswald_600SemiBold", color: muted, marginTop: 4 },
    filterRow: { flexDirection: "row", gap: 8, marginBottom: 18 },
    filterChip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: border,
      backgroundColor: surface,
    },
    filterChipText: { fontSize: 13, fontFamily: "Oswald_600SemiBold", color: text },
    filterEmpty: { fontSize: 14, color: muted, textAlign: "center", paddingVertical: 32 },
    historyGroup: {
      backgroundColor: surface,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: border,
      paddingHorizontal: 14,
    },
    historyRow: { flexDirection: "row", paddingVertical: 14 },
    historyRowDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: border },
    historyDate: { width: 40, alignItems: "center", marginRight: 12, paddingTop: 1 },
    historyDay: { fontSize: 20, fontFamily: "Oswald_700Bold", color: text, lineHeight: 24},
    historyMonth: { fontSize: 11, fontFamily: "Oswald_700Bold", color: muted, textTransform: "uppercase" },
    historyInfo: { flex: 1 },
    historyTitleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    historySalon: { flex: 1, fontSize: 15, fontFamily: "Oswald_700Bold", color: text, marginRight: 10 },
    historyPrice: { fontSize: 14, fontFamily: "Oswald_700Bold", color: text },
    historyPriceVoid: { color: muted, textDecorationLine: "line-through" },
    historyServices: { fontSize: 13, color: muted, marginTop: 2 },
    historyMetaRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", marginTop: 8 },
    statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 5 },
    historyStatus: { fontSize: 12, fontFamily: "Oswald_700Bold" },
    historyLink: { flexDirection: "row", alignItems: "center", marginLeft: 14 },
    historyLinkText: { fontSize: 12, fontFamily: "Oswald_700Bold", marginLeft: 3 },
    historyRated: { fontSize: 12, fontFamily: "Oswald_700Bold", color: muted, marginLeft: 3 },

    /* Empty / loading */
    emptyBox: { alignItems: "center", paddingTop: 48, paddingHorizontal: 12 },
    emptyIconCircle: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: isDark ? "rgba(179, 38, 30, 0.18)" : "rgba(179, 38, 30, 0.08)",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 16,
    },
    emptyTitle: { fontSize: 19, fontFamily: "Oswald_700Bold", color: text, textAlign: "center", letterSpacing: 0.15 },
    emptySub: { fontSize: 14, color: muted, textAlign: "center", lineHeight: 20, marginTop: 6, maxWidth: 300 },
    emptyCta: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      height: 48,
      paddingHorizontal: 24,
      borderRadius: 14,
      marginTop: 22,
    },
    emptyCtaText: { color: C.textLight, fontSize: 15, fontFamily: "Oswald_700Bold" },
    skeleton: { backgroundColor: isDark ? C.ink : C.lifted },

    /* Guest */
    guestContent: { alignItems: "center", paddingHorizontal: 20, paddingTop: 32, paddingBottom: 120 },
    guestFeatures: {
      alignSelf: "stretch",
      backgroundColor: surface,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: border,
      paddingVertical: 6,
      marginTop: 24,
    },
    guestFeatureRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 12 },
    guestFeatureIcon: {
      width: 38,
      height: 38,
      borderRadius: 12,
      backgroundColor: isDark ? "rgba(179, 38, 30, 0.18)" : "rgba(179, 38, 30, 0.08)",
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },
    guestFeatureTitle: { fontSize: 14, fontFamily: "Oswald_700Bold", color: text },
    guestFeatureSub: { fontSize: 12.5, color: muted, marginTop: 1 },
    guestCta: { alignSelf: "stretch" },
    guestSignUpRow: { flexDirection: "row", alignItems: "center", paddingVertical: 14 },
    guestSignUpMuted: { fontSize: 13.5, color: muted },
    guestSignUpLink: { fontSize: 13.5, fontFamily: "Oswald_700Bold" },

    /* Toast */
    toastBanner: {
      position: "absolute",
      top: 50,
      left: 16,
      right: 16,
      zIndex: 9999,
      backgroundColor: C.ink,
      borderRadius: 14,
      borderLeftWidth: 4,
      paddingHorizontal: 14,
      paddingVertical: 12,
      flexDirection: "row",
      alignItems: "center",
      shadowColor: C.ink,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.25,
      shadowRadius: 12,
      elevation: 8,
    },
    toastTitle: { fontSize: 13, fontFamily: "Oswald_700Bold" },
    toastMessage: { color: C.textLight, fontSize: 12.5, marginTop: 2 },
    toastCloseBtn: { padding: 4, marginLeft: 8 },
  });
}
