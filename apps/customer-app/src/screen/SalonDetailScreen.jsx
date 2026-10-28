import React, { useState, useEffect, useCallback, useMemo, memo, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
  Platform,
  Modal,
  Animated,
  Easing,
  Linking,
} from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from "@expo/vector-icons";
import { C, FF } from "../theme";
import { useTheme } from "../context/ThemeContext";
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import SpringTouchable from "../components/SpringTouchable";
import ServiceCard from "../components/ServiceCard";
import ErrorCardModal from "../components/ErrorCardModal";
import ReviewsSection from "../components/ReviewsSection";
import { SkeletonBox } from "../components/SkeletonLoader";
import { browseService } from "../services/browseService";
import { appointmentService } from "../services/appointmentService";
import { shareSalon } from "../services/shareService";
import { paiseToINR } from "../services/apiClient";
import { useFavorites } from "../context/FavoritesContext";
import { useAuth } from "../context/AuthContext";
import VerifyEmailModal from "../components/VerifyEmailModal";
import ComboServiceModal from "../components/ComboServiceModal";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const COMPACT_HEADER_HEIGHT = 58;
const TABS_HEIGHT = 46;
const HERO_HEIGHT = 268;

const GOLD = C.warning;

const HERO_IMAGES = [
  "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=1000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=1000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1562322140-8baeececf3df?q=80&w=1000&auto=format&fit=crop",
];

// "21:00" -> "9:00 PM"
function formatClock(time) {
  if (!time || typeof time !== "string") return "";
  const [h, m = "00"] = time.split(":");
  const hours = parseInt(h, 10);
  if (Number.isNaN(hours)) return time;
  return `${hours % 12 || 12}:${m.slice(0, 2)} ${hours >= 12 ? "PM" : "AM"}`;
}

// 75 -> "1 hr 15 mins"
function formatDuration(totalMins) {
  if (!totalMins) return "";
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  return [h ? `${h} hr` : null, m ? `${m} mins` : null].filter(Boolean).join(" ");
}

function formatReviewCount(count) {
  const value = Number(count) || 0;
  if (value >= 1000) return `${(value / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(value);
}

function titleCase(value) {
  return String(value || "")
    .replace(/[-_]/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getBranchLabel(branch, salonName) {
  const raw = String(branch?.branchName || branch?.name || "").trim();
  if (!raw) {
    return branch?.address?.locality || branch?.address?.city || "Main location";
  }

  let label = raw;
  const salon = String(salonName || "").trim();
  if (salon && label.toLowerCase().startsWith(salon.toLowerCase())) {
    label = label.slice(salon.length).replace(/^[\s\-–—|,]+/, "").trim();
  }

  if (label === raw && /\s[-–—]\s/.test(raw)) {
    const parts = raw.split(/\s+[-–—]\s+/).filter(Boolean);
    if (parts.length > 1) label = parts.slice(1).join(" - ").trim();
  }

  if (!label || label.toLowerCase() === salon.toLowerCase()) {
    return branch?.address?.locality || branch?.address?.city || "Main location";
  }

  return label;
}

function formatPhoneDisplay(phone) {
  const raw = String(phone || "").trim();
  const digits = raw.replace(/[^\d+]/g, "");
  if (/^\+91\d{10}$/.test(digits)) {
    return `+91 ${digits.slice(3, 8)} ${digits.slice(8)}`;
  }
  return raw;
}

function getAddressParts(address) {
  if (!address) return { street: "", cityLine: "" };
  if (typeof address === "string") return { street: address, cityLine: "" };

  return {
    street:
      address.street ||
      address.line1 ||
      address.addressLine1 ||
      address.address ||
      "",
    cityLine: [address.city, address.state, address.pincode || address.zip]
      .filter(Boolean)
      .join(", "),
  };
}

function SalonDetailScreen({ salon, initialSalonId, initialBranchId, goBack, navigate, onScroll }) {
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => getStyles(theme, isDark), [theme, isDark]);
  const insets = useSafeAreaInsets();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [requestedBranchId, setRequestedBranchId] = useState(initialBranchId || null);
  const [services, setServices] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [salonData, setSalonData] = useState(
    salon || (initialSalonId ? { _id: initialSalonId } : null)
  );
  const MAIN_TABS = useMemo(() => ["Services", "About", "Reviews"], []);
  const [activeMainTab, setActiveMainTab] = useState("Services");
  const [error, setError] = useState(null);
  const [reviewsList, setReviewsList] = useState([]);
  const { user, isAuthenticated } = useAuth();
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [activeComboService, setActiveComboService] = useState(null);
  const [showBranchPicker, setShowBranchPicker] = useState(false);
  const [showAllHours, setShowAllHours] = useState(false);
  const [galleryVisible, setGalleryVisible] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [stickyTabsY, setStickyTabsY] = useState(null);
  const [showCompactHeader, setShowCompactHeader] = useState(false);

  const scrollRef = useRef(null);
  const galleryScrollRef = useRef(null);
  const compactHeaderAnim = useRef(new Animated.Value(0)).current;
  const barAnim = useRef(new Animated.Value(selectedServices.length > 0 ? 1 : 0)).current;

  const totalPrice = useMemo(() => {
    return selectedServices.reduce((sum, s) => sum + (s.price || 0), 0);
  }, [selectedServices]);

  const totalDuration = useMemo(() => {
    return selectedServices.reduce((sum, s) => sum + (s.durationMinutes || s.duration || 30), 0);
  }, [selectedServices]);

  const handleGetDirections = useCallback(() => {
    const coords = selectedBranch?.address?.coordinates;
    const hasCoords = Number.isFinite(coords?.lat) && Number.isFinite(coords?.lng);
    const addr = selectedBranch?.address;
    const addressQuery = [
      salonData?.name,
      typeof addr === "string" ? addr : addr?.street,
      typeof addr === "string" ? null : addr?.locality,
      typeof addr === "string" ? null : addr?.city,
      typeof addr === "string" ? null : addr?.state,
      typeof addr === "string" ? null : addr?.pincode,
    ].filter(Boolean).join(", ");

    if (!hasCoords && !addressQuery) {
      setError("This salon hasn't added its address yet.");
      return;
    }
    const destination = hasCoords ? `${coords.lat},${coords.lng}` : encodeURIComponent(addressQuery);
    Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${destination}`).catch(() => {
      setError("Couldn't open maps on this device.");
    });
  }, [selectedBranch, salonData]);

  const phoneNumber =
    selectedBranch?.contactPhone ||
    selectedBranch?.phone ||
    salonData?.contactPhone ||
    salonData?.phone ||
    "";

  const handleCallSalon = useCallback(() => {
    if (!phoneNumber) {
      setError("This salon hasn't added a phone number yet.");
      return;
    }
    Linking.openURL(`tel:${String(phoneNumber).replace(/\s+/g, "")}`).catch(() => {
      setError("Couldn't start a call on this device.");
    });
  }, [phoneNumber]);

  useEffect(() => {
    Animated.spring(barAnim, {
      toValue: selectedServices.length > 0 ? 1 : 0,
      tension: 65,
      friction: 9,
      useNativeDriver: true,
    }).start();
  }, [selectedServices.length, barAnim]);

  useEffect(() => {
    Animated.timing(compactHeaderAnim, {
      toValue: showCompactHeader ? 1 : 0,
      duration: 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [showCompactHeader, compactHeaderAnim]);

  const barTranslateY = barAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [150, 0],
  });

  const salonId = salonData?._id || salonData?.id;
  const favorited = isFavorite(salonId);

  const coverImage = salonData?.coverImage || salonData?.image || HERO_IMAGES[0];
  const rawImages = Array.isArray(salonData?.images) ? salonData.images.filter(Boolean) : [];
  const carouselImages = rawImages.length ? rawImages : [coverImage];
  const galleryImages = carouselImages;

  const displayRating = useMemo(() => {
    const rawAvg =
      salonData?.rating?.avgScore ||
      salonData?.rating?.score ||
      (typeof salonData?.rating === "number" ? salonData.rating : null) ||
      salonData?.avgScore;
    const numeric = Number(rawAvg);
    if (Number.isFinite(numeric) && numeric > 0) return numeric.toFixed(1);

    if (reviewsList.length > 0) {
      const scored = reviewsList.filter((r) => Number.isFinite(Number(r.score ?? r.rating)));
      if (scored.length > 0) {
        const total = scored.reduce((sum, r) => sum + Number(r.score ?? r.rating), 0);
        return (total / scored.length).toFixed(1);
      }
    }
    return null;
  }, [salonData, reviewsList]);

  const displayReviewCount = useMemo(() => {
    const rawCount =
      salonData?.totalReviews ??
      salonData?.reviewsCount ??
      salonData?.reviewCount ??
      salonData?.rating?.totalReviews ??
      salonData?.rating?.reviewsCount;
    if (typeof rawCount === "number" && rawCount > 0) return rawCount;
    if (reviewsList.length > 0) return reviewsList.length;
    return typeof rawCount === "number" ? rawCount : 0;
  }, [salonData, reviewsList]);

  const weeklySchedule = useMemo(() => {
    const workingHours = selectedBranch?.workingHours || salonData?.workingHours;
    if (!Array.isArray(workingHours) || workingHours.length === 0) return null;

    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const todayIdx = new Date().getDay();
    return [1, 2, 3, 4, 5, 6, 0].map((dayNum) => {
      const found = workingHours.find((w) => w.day === dayNum);
      return {
        dayName: dayNames[dayNum],
        // A day missing from the schedule is closed, matching the open/closed status logic
        isOpen: Boolean(found) && found.isOpen !== false,
        openTime: formatClock(found?.openTime),
        closeTime: formatClock(found?.closeTime),
        isToday: dayNum === todayIdx,
      };
    });
  }, [selectedBranch, salonData]);

  const handleBack = useCallback(() => {
    if (goBack) goBack();
  }, [goBack]);

  const handleToggleFavorite = useCallback(() => {
    toggleFavorite(salonData);
  }, [toggleFavorite, salonData]);

  const routeSalonId = salon?._id || salon?.id || initialSalonId;

  useEffect(() => {
    if (!routeSalonId) return;
    let cancelled = false;

    // Opening a different salon on the same screen must not keep the previous one's state
    setSalonData(salon || (routeSalonId ? { _id: routeSalonId } : null));
    setSelectedBranch(null);
    setRequestedBranchId(initialBranchId || null);
    setSelectedServices([]);
    setServices([]);
    setReviewsList([]);
    setSelectedCategory("all");
    setActiveMainTab("Services");
    setLoading(true);
    setShowBranchPicker(false);
    setShowAllHours(false);
    setShowCompactHeader(false);
    setStickyTabsY(null);
    compactHeaderAnim.setValue(0);
    scrollRef.current?.scrollTo({ y: 0, animated: false });

    const cachedSalonRes = browseService.getCachedSalonById(routeSalonId);
    if (cachedSalonRes) {
      const fullSalon = cachedSalonRes.data?.salon || cachedSalonRes.data;
      if (fullSalon) setSalonData(fullSalon);
    }

    // Always fetch the full salon: list screens pass branches without hours or phone numbers
    const fetchSalon = async () => {
      try {
        const res = await browseService.getSalonById(routeSalonId);
        const fullSalon = res.data?.salon || res.data;
        if (fullSalon && !cancelled) setSalonData(fullSalon);
      } catch (err) {
        console.log("Error fetching salon details:", err.message);
      }
    };
    fetchSalon();
    return () => { cancelled = true; };
  }, [routeSalonId, initialBranchId]);

  const branches = salonData?.branches || [];

  // Prefer the branch from a deep link, then the first branch; swap in a full branch object once it arrives
  useEffect(() => {
    if (branches.length === 0) {
      // A salon with no branch cannot have a service menu; don't leave the list in a skeleton state.
      setLoading(false);
      return;
    }
    setSelectedBranch((prev) => {
      const prevId = prev?._id || prev?.id;
      if (prevId) {
        const kept = branches.find((b) => String(b._id || b.id) === String(prevId));
        if (kept) return kept;
      }
      if (requestedBranchId) {
        const requested = branches.find(
          (b) => String(b._id || b.id) === String(requestedBranchId)
        );
        if (requested) return requested;
      }
      return branches[0];
    });
  }, [branches, requestedBranchId]);

  const selectedBranchId = selectedBranch?._id || selectedBranch?.id || null;

  useEffect(() => {
    if (!selectedBranchId) return;
    let cancelled = false;
    const branchId = selectedBranchId;

    // Check client-side memory cache first for instant render (no loading state on re-open!)
    const cachedRes = browseService.getCachedBranchServices(branchId);
    if (cachedRes) {
      const cachedList = cachedRes.data?.services || (Array.isArray(cachedRes.data) ? cachedRes.data : []);
      setServices(cachedList);
      setLoading(false);
    } else {
      setLoading(true);
    }

    const fetchBranchServices = async () => {
      try {
        const res = await browseService.getBranchServices(branchId);
        if (cancelled) return;
        const serviceList = res.data?.services || (Array.isArray(res.data) ? res.data : []);
        setServices(serviceList);
      } catch (err) {
        console.log("Error loading services:", err.message);
        if (!cancelled && !cachedRes) {
          setServices([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchBranchServices();
    return () => {
      cancelled = true;
    };
  }, [selectedBranchId]);

  useEffect(() => {
    if (!salonId) return;
    let cancelled = false;
    const fetchReviews = async () => {
      try {
        const branchId = selectedBranchId;
        const res = branchId
          ? await browseService.getBranchReviews(branchId)
          : await browseService.getSalonReviews(salonId);
        if (cancelled) return;
        setReviewsList(res.data?.reviews || []);
      } catch (err) {
        console.log("Error loading reviews:", err.message);
        if (!cancelled) setReviewsList([]);
      }
    };
    fetchReviews();
    return () => {
      cancelled = true;
    };
  }, [salonId, selectedBranchId]);

  const categories = useMemo(() => {
    const set = new Set();
    services.forEach((s) => {
      if (s.category) set.add(s.category.toLowerCase());
    });
    return ["all", ...Array.from(set)];
  }, [services]);

  const filteredServices = useMemo(() => {
    if (selectedCategory === "all") return services;
    return services.filter(
      (s) => s.category?.toLowerCase() === selectedCategory.toLowerCase()
    );
  }, [services, selectedCategory]);

  const specialities = useMemo(() => {
    const source =
      (Array.isArray(salonData?.specialities) && salonData.specialities) ||
      (Array.isArray(salonData?.specialties) && salonData.specialties) ||
      (Array.isArray(salonData?.categories) && salonData.categories.length > 0 && salonData.categories) ||
      categories.filter((cat) => cat !== "all");

    const seen = new Set();
    return source
      .map((item) => titleCase(item))
      .filter((item) => {
        if (!item) return false;
        const key = item.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 6);
  }, [salonData?.specialities, salonData?.specialties, salonData?.categories, categories]);

  const eyebrow = specialities.length > 0
    ? specialities.slice(0, 2).join(" · ")
    : "Hair & beauty";

  const minServicePrice = useMemo(() => {
    const prices = filteredServices
      .map((service) => Number(service.price))
      .filter((price) => Number.isFinite(price) && price > 0);
    return prices.length > 0 ? Math.min(...prices) : null;
  }, [filteredServices]);

  const isOpenStatus = useMemo(() => {
    const target = selectedBranch || salonData;
    if (!target) return { isOpen: true };

    if (
      target.isActive === false ||
      target.deactivatedByAdmin === true ||
      target.isOpen === false ||
      target.status === "CLOSED" ||
      salonData?.isOpen === false
    ) {
      return { isOpen: false, nextOpenText: "Closed right now by management." };
    }

    const workingHours = target.workingHours || salonData?.workingHours;
    if (!Array.isArray(workingHours) || workingHours.length === 0) {
      return { isOpen: true };
    }

    const now = new Date();
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dayOfWeek = now.getDay();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    // Next day (after today) the salon opens, e.g. "Opens tomorrow at 9:00 AM"
    const nextOpening = () => {
      for (let i = 1; i <= 7; i++) {
        const nextDayIdx = (dayOfWeek + i) % 7;
        const nextWorking = workingHours.find((w) => w.day === nextDayIdx && w.isOpen !== false);
        if (nextWorking) {
          const dayName = i === 1 ? "tomorrow" : `on ${dayNames[nextDayIdx]}`;
          return `Opens ${dayName} at ${formatClock(nextWorking.openTime)}.`;
        }
      }
      return "Advance booking available.";
    };

    const todayWorking = workingHours.find((w) => w.day === dayOfWeek);
    if (!todayWorking || todayWorking.isOpen === false) {
      return { isOpen: false, nextOpenText: nextOpening() };
    }

    if (todayWorking.openTime && todayWorking.closeTime) {
      const [openH, openM] = todayWorking.openTime.split(":").map(Number);
      const [closeH, closeM] = todayWorking.closeTime.split(":").map(Number);
      const openMinutes = openH * 60 + (openM || 0);
      const closeMinutes = closeH * 60 + (closeM || 0);

      if (currentMinutes < openMinutes) {
        return { isOpen: false, nextOpenText: `Opens today at ${formatClock(todayWorking.openTime)}.` };
      }
      if (currentMinutes >= closeMinutes) {
        return { isOpen: false, nextOpenText: nextOpening() };
      }
    }

    return { isOpen: true, closeTime: formatClock(todayWorking?.closeTime) };
  }, [selectedBranch, salonData]);

  const hasWorkingHours = Boolean(weeklySchedule);
  const todaySchedule = weeklySchedule?.find((day) => day.isToday) || weeklySchedule?.[0] || null;
  const branchLabel = getBranchLabel(selectedBranch, salonData?.name);
  const addressParts = getAddressParts(selectedBranch?.address);
  const hasAddress = Boolean(addressParts.street || addressParts.cityLine);
  const shareAddress = [addressParts.street, addressParts.cityLine].filter(Boolean).join(", ");
  const shareImageUrl = salonData?.coverImage || salonData?.image || rawImages[0] || null;

  const handleShare = useCallback(async () => {
    const salonName = salonData?.name || "this salon";
    const ratingLine = [
      displayRating ? `${displayRating}★` : null,
      displayReviewCount > 0
        ? `${formatReviewCount(displayReviewCount)} ${displayReviewCount === 1 ? "review" : "reviews"}`
        : null,
    ].filter(Boolean).join(" · ");
    const link = routeSalonId
      ? `stcut://salon/${encodeURIComponent(routeSalonId)}${
          selectedBranchId ? `?branchId=${encodeURIComponent(selectedBranchId)}` : ""
        }`
      : null;
    const message = [
      salonName,
      [selectedBranch ? branchLabel : null, ratingLine].filter(Boolean).join(" · "),
      shareAddress,
      link ? `Book on HairX: ${link}` : null,
    ].filter(Boolean).join("\n");

    try {
      await shareSalon({
        title: salonName,
        message,
        imageUrl: shareImageUrl,
      });
    } catch (shareError) {
      console.log(shareError.message);
    }
  }, [
    branchLabel,
    displayRating,
    displayReviewCount,
    routeSalonId,
    salonData?.name,
    selectedBranch,
    selectedBranchId,
    shareAddress,
    shareImageUrl,
  ]);

  const distanceValue = selectedBranch?.distance ?? salonData?.distance;
  const distanceLabel = distanceValue !== undefined && distanceValue !== null
    ? `${distanceValue} km`
    : "";

  const statusLabel = hasWorkingHours ? (isOpenStatus.isOpen ? "Open" : "Closed") : "Hours not available";
  const rawStatusDetail = !isOpenStatus.isOpen ? (isOpenStatus.nextOpenText || "") : "";
  const statusDetail = rawStatusDetail && !/^closed/i.test(rawStatusDetail)
    ? rawStatusDetail.replace(/\.$/, "")
    : (isOpenStatus.isOpen && isOpenStatus.closeTime ? `Closes at ${isOpenStatus.closeTime}` : "");
  const statusOpenColor = isDark ? C.success : C.success;
  const statusClosedColor = isDark ? C.error : C.error;

  const handleSelectService = useCallback((svc) => {
    setSelectedServices((prev) => {
      const currentId = svc?._id || svc?.id;
      const exists = prev.some((item) => (item._id || item.id) === currentId);
      if (exists) {
        return prev.filter((item) => (item._id || item.id) !== currentId);
      }
      return [...prev, svc];
    });
  }, []);

  const handleBranchChange = useCallback((branch) => {
    setShowBranchPicker(false);
    setShowAllHours(false);
    setSelectedBranch(branch);
    setSelectedServices([]);
    setServices([]);
    setReviewsList([]);
    setSelectedCategory("all");
  }, []);

  const handleToggleBranchPicker = useCallback(() => {
    if (branches.length < 2) return;
    setShowBranchPicker((prev) => !prev);
  }, [branches.length]);

  const handleSelectBranch = useCallback((branch) => {
    const nextId = branch?._id || branch?.id;
    if (nextId === selectedBranchId) {
      setShowBranchPicker(false);
      return;
    }
    handleBranchChange(branch);
  }, [selectedBranchId, handleBranchChange]);

  const stickyThreshold = stickyTabsY !== null
    ? Math.max(stickyTabsY - insets.top - COMPACT_HEADER_HEIGHT, 0)
    : null;

  const handleTabChange = useCallback((tab) => {
    if (tab === activeMainTab) return;
    if (showCompactHeader && stickyThreshold !== null && scrollRef.current) {
      scrollRef.current.scrollTo({ y: stickyThreshold, animated: false });
    }
    setActiveMainTab(tab);
  }, [activeMainTab, showCompactHeader, stickyThreshold]);

  const handleScroll = useCallback((event) => {
    if (onScroll) onScroll(event);
    const y = event.nativeEvent.contentOffset.y;

    if (stickyThreshold === null) return;
    if (!showCompactHeader && y >= stickyThreshold) {
      setShowCompactHeader(true);
    } else if (showCompactHeader && y < stickyThreshold - 2) {
      setShowCompactHeader(false);
    }
  }, [onScroll, stickyThreshold, showCompactHeader]);

  const handleTabsLayout = useCallback((event) => {
    const y = event.nativeEvent.layout.y;
    setStickyTabsY((prev) => (prev === null || Math.abs(prev - y) > 0.5 ? y : prev));
  }, []);

  const handleBookNow = useCallback(() => {
    if (!selectedBranch) return;
    const isVerified = Boolean(user?.isEmailVerified || user?.email_verified);
    if (user && !isVerified) {
      setShowVerifyModal(true);
      return;
    }
    // Only book what the customer actually picked
    const targetServices = selectedServices;
    if (targetServices.length === 0) return;
    if (navigate) {
      const currentRating = displayRating && displayRating !== "0.0"
        ? parseFloat(displayRating)
        : (salonData?.rating?.avgScore || salonData?.rating || 5.0);
      const currentReviewCount = displayReviewCount || reviewsList?.length || salonData?.reviewCount || salonData?.totalReviews || 0;

      navigate("Booking", {
        salon: {
          ...salonData,
          rating: currentRating,
          reviewCount: currentReviewCount,
        },
        branch: selectedBranch,
        service: targetServices[0],
        selectedServices: targetServices,
      });
    }
  }, [selectedServices, selectedBranch, navigate, salonData, user, displayRating, displayReviewCount, reviewsList]);

  // Reviews are ratings on the customer's own completed visit, so find one at this salon to attach it to.
  // Throwing keeps the typed review in the box when it can't be saved.
  const handleSubmitReview = useCallback(async ({ rating, comment }) => {
    if (!isAuthenticated) {
      if (navigate) navigate("Login");
      throw new Error("Not signed in");
    }
    try {
      const res = await appointmentService.getAppointments();
      const list = res.data?.appointments || (Array.isArray(res.data) ? res.data : []);
      const visit = list.find((a) => {
        const apptSalonId = typeof a.salonId === "object" ? a.salonId?._id : a.salonId;
        return (
          String(apptSalonId) === String(salonId) &&
          (a.status || "").toUpperCase() === "COMPLETED" &&
          !a.rating?.score
        );
      });
      if (!visit) {
        setError("You can review this salon after a completed visit. Visits you've already rated can't be rated again.");
        throw new Error("No eligible visit");
      }

      await appointmentService.rateAppointment(visit._id || visit.id, rating, comment);

      const reviewsRes = selectedBranchId
        ? await browseService.getBranchReviews(selectedBranchId)
        : await browseService.getSalonReviews(salonId);
      setReviewsList(reviewsRes.data?.reviews || []);
    } catch (err) {
      if (err.message !== "No eligible visit") setError(err.message || "Couldn't submit your review. Please try again.");
      throw err;
    }
  }, [isAuthenticated, navigate, salonId, selectedBranchId]);

  const renderTabsRow = (onLayout) => (
    <View style={styles.tabsRow} onLayout={onLayout}>
      {MAIN_TABS.map((tab) => {
        const isSelected = activeMainTab === tab;
        return (
          <TouchableOpacity
            key={tab}
            style={styles.tabBtn}
            onPress={() => handleTabChange(tab)}
            activeOpacity={0.75}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected }}
          >
            <Text style={[styles.tabLabel, isSelected && styles.tabLabelActive]}>
              {tab}
            </Text>
            <View style={[styles.tabUnderline, isSelected && styles.tabUnderlineActive]} />
          </TouchableOpacity>
        );
      })}
    </View>
  );

  return (
    <View style={styles.container}>
      <ErrorCardModal
        visible={!!error}
        title="Salon Error"
        message={error}
        onClose={() => setError(null)}
      />

      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentInsetAdjustmentBehavior="never"
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: selectedServices.length > 0
              ? Math.max(insets.bottom, 12) + 108
              : Math.max(insets.bottom, 16) + 28,
          },
        ]}
      >
        <View style={styles.hero}>
          <Image
            source={{ uri: carouselImages[0] }}
            style={styles.heroImage}
            resizeMode="cover"
          />

          <LinearGradient
            colors={["rgba(20,17,22,0.36)", "rgba(20,17,22,0)"]}
            style={styles.heroShadeTop}
            pointerEvents="none"
          />
          <LinearGradient
            colors={["rgba(20,17,22,0)", "rgba(20,17,22,0.28)"]}
            style={styles.heroShadeBottom}
            pointerEvents="none"
          />

          <View style={[styles.heroActions, { top: insets.top + 12 }]}>
            <TouchableOpacity
              style={styles.glassBtn}
              onPress={handleBack}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Ionicons name="arrow-back" size={19} color={theme.ink} />
            </TouchableOpacity>

            <View style={styles.heroActionsRight}>
              <TouchableOpacity
                style={styles.glassBtn}
                onPress={handleToggleFavorite}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={favorited ? "Remove from saved salons" : "Save salon"}
              >
                <Ionicons
                  name={favorited ? "heart" : "heart-outline"}
                  size={19}
                  color={favorited ? theme.primary : theme.ink}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.glassBtn}
                onPress={handleShare}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Share salon"
              >
                <Ionicons name="share-outline" size={19} color={theme.ink} />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={styles.photoChip}
            onPress={() => {
              setGalleryIndex(0);
              setGalleryVisible(true);
            }}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={`View ${galleryImages.length} photos`}
          >
            <Ionicons name="camera-outline" size={13} color={theme.ink} />
            <Text style={styles.photoChipText}>
              {galleryImages.length} {galleryImages.length === 1 ? "photo" : "photos"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.identityCard}>
          <View style={styles.eyebrowRow}>
            <Text style={styles.eyebrow} numberOfLines={1}>{eyebrow}</Text>
            {salonData?.isVerified ? (
              <View style={styles.verifiedPill}>
                <View style={styles.verifiedDot}>
                  <Ionicons name="checkmark" size={8} color={theme.onPrimary} />
                </View>
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            ) : null}
          </View>

          <Text style={styles.salonName} numberOfLines={2}>
            {salonData?.name || "Salon"}
          </Text>

          <View style={styles.metaRow}>
            {displayRating ? (
              <>
                <View style={styles.ratingInline}>
                  <Ionicons name="star" size={13} color={GOLD} />
                  <Text style={styles.ratingValue}>{displayRating}</Text>
                </View>
                <View style={styles.metaDot} />
                <Text style={styles.metaText}>
                  {displayReviewCount > 0
                    ? `${formatReviewCount(displayReviewCount)} ${displayReviewCount === 1 ? "review" : "reviews"}`
                    : "No reviews yet"}
                </Text>
              </>
            ) : (
              <Text style={styles.metaText}>New on HairX</Text>
            )}

            <View style={styles.metaDot} />

            <TouchableOpacity
              style={styles.locationInline}
              onPress={handleToggleBranchPicker}
              disabled={branches.length < 2}
              activeOpacity={0.7}
              accessibilityRole={branches.length > 1 ? "button" : undefined}
              accessibilityLabel={branches.length > 1 ? "Change salon location" : undefined}
            >
              <Ionicons name="location-outline" size={12} color={theme.muted} />
              <Text style={styles.locationText} numberOfLines={1}>
                {branchLabel}{distanceLabel ? ` · ${distanceLabel}` : ""}
              </Text>
              {branches.length > 1 ? (
                <Ionicons
                  name={showBranchPicker ? "chevron-up" : "chevron-down"}
                  size={11}
                  color={theme.muted}
                />
              ) : null}
            </TouchableOpacity>
          </View>

          <View style={styles.statusLine}>
            {hasWorkingHours ? (
              <>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: isOpenStatus.isOpen ? statusOpenColor : statusClosedColor },
                  ]}
                />
                <Text style={styles.statusText} numberOfLines={2}>
                  <Text style={{ color: isOpenStatus.isOpen ? statusOpenColor : statusClosedColor }}>
                    {statusLabel}
                  </Text>
                  {statusDetail ? ` · ${statusDetail}` : ""}
                </Text>
              </>
            ) : (
              <>
                <Ionicons name="time-outline" size={12} color={theme.muted} />
                <Text style={styles.statusText}>Hours not available</Text>
              </>
            )}
          </View>

          {showBranchPicker && branches.length > 1 ? (
            <View style={styles.branchPicker}>
              <Text style={styles.branchPickerLabel}>Choose location</Text>
              {branches.map((branch) => {
                const branchId = branch._id || branch.id;
                const isSelected = branchId === selectedBranchId;
                const shortName = getBranchLabel(branch, salonData?.name);
                const city = branch?.address?.city || branch?.address?.street || "";
                return (
                  <TouchableOpacity
                    key={branchId}
                    style={[styles.branchOption, isSelected && styles.branchOptionSelected]}
                    onPress={() => handleSelectBranch(branch)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.softIconSmall}>
                      <Ionicons
                        name="location-outline"
                        size={14}
                        color={theme.primaryActive}
                      />
                    </View>
                    <View style={styles.branchOptionCopy}>
                      <Text style={styles.branchOptionTitle} numberOfLines={1}>{shortName}</Text>
                      {city ? (
                        <Text style={styles.branchOptionSub} numberOfLines={1}>{city}</Text>
                      ) : null}
                    </View>
                    {isSelected ? (
                      <Ionicons name="checkmark-circle" size={17} color={theme.primary} />
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : null}

          <View style={styles.cardActions}>
            <TouchableOpacity
              style={styles.secondaryAction}
              onPress={handleCallSalon}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={`Call ${salonData?.name || "salon"}`}
            >
              <Ionicons name="call-outline" size={14} color={theme.primaryActive} />
              <Text style={styles.secondaryActionText}>Call</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryAction}
              onPress={handleGetDirections}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={`Get directions to ${salonData?.name || "salon"}`}
            >
              <Ionicons name="navigate-outline" size={14} color={theme.primaryActive} />
              <Text style={styles.secondaryActionText}>Directions</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View onLayout={handleTabsLayout}>
          {renderTabsRow()}
        </View>

        {activeMainTab === "Services" ? (
          <View style={styles.tabPage}>
            {categories.length > 1 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.categoryScroll}
                contentContainerStyle={styles.categoryContent}
              >
                {categories.map((cat) => {
                  const isCatSelected = selectedCategory === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.categoryPill, isCatSelected && styles.categoryPillActive]}
                      onPress={() => setSelectedCategory(cat)}
                      activeOpacity={0.82}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isCatSelected }}
                    >
                      <Text style={[
                        styles.categoryPillText,
                        isCatSelected && styles.categoryPillTextActive,
                      ]}>
                        {titleCase(cat)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            ) : null}

            {loading ? (
              <View style={styles.serviceList}>
                {[0, 1, 2].map((item) => (
                  <View key={item} style={styles.serviceSkeletonCard}>
                    <SkeletonBox width="62%" height={15} style={{ marginBottom: 9 }} />
                    <SkeletonBox width="34%" height={12} style={{ marginBottom: 11 }} />
                    <SkeletonBox width="88%" height={11} />
                  </View>
                ))}
              </View>
            ) : filteredServices.length === 0 ? (
              <View style={styles.emptyCard}>
                <View style={styles.emptyIcon}>
                  <Ionicons name="cut-outline" size={22} color={theme.primary} />
                </View>
                <Text style={styles.emptyTitle}>
                  {services.length === 0 ? "No services listed yet" : "Nothing in this category"}
                </Text>
                <Text style={styles.emptyCopy}>
                  {services.length === 0
                    ? "This location hasn't published its service menu yet."
                    : "Try another category to see what this salon offers."}
                </Text>
              </View>
            ) : (
              <>
                <View style={styles.listMeta}>
                  <Text style={styles.listMetaText}>
                    {filteredServices.length} {filteredServices.length === 1 ? "service" : "services"}
                  </Text>
                  {minServicePrice !== null ? (
                    <Text style={styles.listMetaText}>
                      From {paiseToINR(minServicePrice)}
                    </Text>
                  ) : null}
                </View>

                <View style={styles.serviceList}>
                  {filteredServices.map((service) => (
                    <ServiceCard
                      key={service._id || service.id}
                      service={service}
                      selected={selectedServices.some(
                        (selected) => (selected._id || selected.id) === (service._id || service.id)
                      )}
                      onSelect={handleSelectService}
                      onViewCombo={setActiveComboService}
                    />
                  ))}
                </View>
              </>
            )}
          </View>
        ) : null}

        {activeMainTab === "About" ? (
          <View style={styles.aboutPage}>
            <Text style={styles.sectionKicker}>THE STUDIO</Text>
            <Text style={styles.aboutLead}>
              {selectedBranch?.description || salonData?.description ||
                "This salon hasn't added a description yet."}
            </Text>

            {specialities.length > 0 ? (
              <View style={styles.aboutBlock}>
                <Text style={styles.smallLabel}>SPECIALITIES</Text>
                <View style={styles.specialityWrap}>
                  {specialities.map((speciality) => (
                    <View key={speciality} style={styles.specialityChip}>
                      <Text style={styles.specialityText}>{speciality}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            {galleryImages.length > 1 ? (
              <View style={styles.aboutBlock}>
                <View style={styles.galleryHead}>
                  <Text style={styles.smallLabel}>INSIDE THE STUDIO</Text>
                  <TouchableOpacity
                    onPress={() => {
                      setGalleryIndex(0);
                      setGalleryVisible(true);
                    }}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel="View all salon photos"
                  >
                    <Text style={styles.galleryLink}>View gallery</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.galleryScroll}
                  contentContainerStyle={styles.galleryContent}
                >
                  {galleryImages.map((image, index) => (
                    <TouchableOpacity
                      key={`${image}-${index}`}
                      onPress={() => {
                        setGalleryIndex(index);
                        setGalleryVisible(true);
                      }}
                      activeOpacity={0.85}
                      accessibilityRole="button"
                      accessibilityLabel={`View photo ${index + 1}`}
                    >
                      <Image source={{ uri: image }} style={styles.galleryPhoto} resizeMode="cover" />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            ) : null}

            {hasAddress ? (
              <TouchableOpacity
                style={[styles.infoCard, styles.locationCard]}
                onPress={handleGetDirections}
                activeOpacity={0.82}
                accessibilityRole="button"
                accessibilityLabel={`Get directions to ${branchLabel || salonData?.name || "the salon"}`}
              >
                <View style={styles.softIcon}>
                  <Ionicons name="location-outline" size={16} color={theme.primaryActive} />
                </View>
                <View style={styles.infoCopy}>
                  <Text style={styles.infoTitle}>{branchLabel}</Text>
                  {addressParts.street ? (
                    <Text style={styles.infoDetail}>{addressParts.street}</Text>
                  ) : null}
                  {addressParts.cityLine ? (
                    <Text style={styles.infoDetail}>{addressParts.cityLine}</Text>
                  ) : null}
                </View>
                <Ionicons name="chevron-forward" size={16} color={theme.mutedSoft} style={styles.infoChevron} />
              </TouchableOpacity>
            ) : null}

            <View style={styles.hoursCard}>
              <View style={styles.hoursHead}>
                <Text style={styles.hoursTitle}>Opening hours</Text>
                {hasWorkingHours ? (
                  <View style={[
                    styles.statusChip,
                    isOpenStatus.isOpen ? styles.statusChipOpen : styles.statusChipClosed,
                  ]}>
                    <View style={[
                      styles.statusChipDot,
                      { backgroundColor: isOpenStatus.isOpen ? statusOpenColor : statusClosedColor },
                    ]} />
                    <Text style={[
                      styles.statusChipText,
                      { color: isOpenStatus.isOpen ? statusOpenColor : statusClosedColor },
                    ]}>
                      {isOpenStatus.isOpen ? "Open now" : "Closed now"}
                    </Text>
                  </View>
                ) : null}
              </View>

              {!hasWorkingHours ? (
                <Text style={styles.hoursEmpty}>Hours not available</Text>
              ) : showAllHours ? (
                weeklySchedule.map((day) => (
                  <View
                    key={day.dayName}
                    style={[styles.hoursRow, day.isToday && styles.hoursRowToday]}
                  >
                    <View style={styles.dayLeft}>
                      <Text style={styles.dayName}>{day.dayName}</Text>
                      {day.isToday ? (
                        <View style={styles.todayPill}>
                          <Text style={styles.todayPillText}>TODAY</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={[
                      styles.hoursTime,
                      day.isToday && styles.hoursTimeToday,
                      !day.isOpen && styles.hoursTimeClosed,
                    ]}>
                      {day.isOpen ? `${day.openTime} – ${day.closeTime}` : "Closed"}
                    </Text>
                  </View>
                ))
              ) : todaySchedule ? (
                <View style={[styles.hoursRow, styles.hoursRowToday]}>
                  <View style={styles.dayLeft}>
                    <Text style={styles.dayName}>{todaySchedule.dayName}</Text>
                    <View style={styles.todayPill}>
                      <Text style={styles.todayPillText}>TODAY</Text>
                    </View>
                  </View>
                  <Text style={[styles.hoursTime, styles.hoursTimeToday, !todaySchedule.isOpen && styles.hoursTimeClosed]}>
                    {todaySchedule.isOpen
                      ? `${todaySchedule.openTime} – ${todaySchedule.closeTime}`
                      : "Closed"}
                  </Text>
                </View>
              ) : null}

              {hasWorkingHours ? (
                <TouchableOpacity
                  style={styles.hoursMore}
                  onPress={() => setShowAllHours((prev) => !prev)}
                  activeOpacity={0.75}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: showAllHours }}
                >
                  <Text style={styles.hoursMoreText}>
                    {showAllHours ? "Show less" : "Show all 7 days"}
                  </Text>
                  <Ionicons
                    name={showAllHours ? "chevron-up" : "chevron-down"}
                    size={12}
                    color={theme.primaryActive}
                  />
                </TouchableOpacity>
              ) : null}
            </View>

            {phoneNumber ? (
              <TouchableOpacity
                style={styles.infoCard}
                onPress={handleCallSalon}
                activeOpacity={0.82}
                accessibilityRole="button"
                accessibilityLabel={`Call ${salonData?.name || "the salon"}`}
              >
                <View style={styles.softIcon}>
                  <Ionicons name="call-outline" size={16} color={theme.primaryActive} />
                </View>
                <View style={styles.infoCopy}>
                  <Text style={styles.infoTitle}>Call the salon</Text>
                  <Text style={styles.infoDetail}>{formatPhoneDisplay(phoneNumber)}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={theme.mutedSoft} style={styles.infoChevron} />
              </TouchableOpacity>
            ) : null}

            <View style={styles.aboutFooterSpace} />
          </View>
        ) : null}

        {activeMainTab === "Reviews" ? (
          <View style={styles.reviewsPage}>
            <ReviewsSection
              reviews={reviewsList}
              overallRating={displayRating}
              totalReviews={displayReviewCount}
              onSubmitReview={handleSubmitReview}
            />
          </View>
        ) : null}
      </ScrollView>

      {/* Compact header — appears as the identity card scrolls away */}
      <Animated.View
        pointerEvents={showCompactHeader ? "auto" : "none"}
        style={[
          styles.stickyHeader,
          {
            paddingTop: insets.top,
            opacity: compactHeaderAnim,
            transform: [{
              translateY: compactHeaderAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [-10, 0],
              }),
            }],
          },
        ]}
      >
        <View style={styles.compactHeaderRow}>
          <TouchableOpacity
            style={styles.compactBackBtn}
            onPress={handleBack}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={19} color={theme.ink} />
          </TouchableOpacity>

          <Image source={{ uri: carouselImages[0] }} style={styles.compactThumb} resizeMode="cover" />

          <View style={styles.compactCopy}>
            <Text style={styles.compactTitle} numberOfLines={1}>
              {salonData?.name || "Salon"}
            </Text>
            <View style={styles.compactSubRow}>
              {displayRating ? <Ionicons name="star" size={10} color={GOLD} /> : null}
              <Text style={styles.compactSubText} numberOfLines={1}>
                {displayRating ? `${displayRating} · ` : ""}
                {displayReviewCount > 0
                  ? `${formatReviewCount(displayReviewCount)} ${displayReviewCount === 1 ? "review" : "reviews"}`
                  : "New"}
                {branchLabel ? ` · ${branchLabel}` : ""}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.compactHeart}
            onPress={handleToggleFavorite}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel={favorited ? "Remove from saved salons" : "Save salon"}
          >
            <Ionicons
              name={favorited ? "heart" : "heart-outline"}
              size={19}
              color={favorited ? theme.primary : theme.ink}
            />
          </TouchableOpacity>
        </View>

        {renderTabsRow()}
      </Animated.View>

      {/* Floating booking bar — hidden until a service is selected */}
      <Animated.View
        style={[styles.floatingBottomBarWrapper, { transform: [{ translateY: barTranslateY }] }]}
        pointerEvents={selectedServices.length > 0 ? "auto" : "none"}
      >
        {Platform.OS === "ios" ? (
          <BlurView
            intensity={40}
            tint={isDark ? "dark" : "light"}
            style={StyleSheet.absoluteFill}
          />
        ) : null}
        <View
          style={[
            styles.floatingBottomBar,
            { paddingBottom: Math.max(insets.bottom, 12) + 8 },
            Platform.OS === "android" && { backgroundColor: isDark ? C.surface : C.bg },
          ]}
        >
          {Platform.OS === "ios" ? (
            <View
              style={[
                styles.floatingBottomBarTint,
                { backgroundColor: isDark ? "rgba(18,18,24,0.72)" : "rgba(255,255,255,0.9)" },
              ]}
              pointerEvents="none"
            />
          ) : null}

          <View style={styles.bookRow}>
            <View style={styles.totalBlock}>
              <Text style={styles.bookingLabel} numberOfLines={1}>
                {selectedServices.length} {selectedServices.length === 1 ? "service" : "services"}
                {totalDuration ? ` · ${formatDuration(totalDuration)}` : ""}
              </Text>
              <View style={styles.priceRow}>
                <Text style={styles.totalAmount}>{paiseToINR(totalPrice)}</Text>
                <Text style={styles.totalSuffix}>total</Text>
              </View>
            </View>

            <SpringTouchable
              onPress={handleBookNow}
              style={styles.bookBtn}
              hapticType="medium"
              accessibilityRole="button"
              accessibilityLabel="Book now"
            >
              <Text style={styles.bookBtnText}>Book now</Text>
              <Ionicons name="arrow-forward" size={18} color={theme.onPrimary} />
            </SpringTouchable>
          </View>
        </View>
      </Animated.View>

      <VerifyEmailModal
        visible={showVerifyModal}
        email={user?.email}
        onClose={() => setShowVerifyModal(false)}
        onVerified={() => setShowVerifyModal(false)}
      />

      <ComboServiceModal
        visible={Boolean(activeComboService)}
        service={activeComboService}
        isSelected={
          activeComboService
            ? selectedServices.some(
              (selected) =>
                (selected._id || selected.id) === (activeComboService._id || activeComboService.id)
            )
            : false
        }
        onClose={() => setActiveComboService(null)}
        onSelectService={handleSelectService}
      />

      <Modal
        visible={galleryVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setGalleryVisible(false)}
        onShow={() => {
          galleryScrollRef.current?.scrollTo({
            x: galleryIndex * SCREEN_WIDTH,
            animated: false,
          });
        }}
        statusBarTranslucent
      >
        <View style={styles.galleryModal}>
          <View style={[styles.galleryTop, { paddingTop: insets.top + 10 }]}>
            <TouchableOpacity
              style={styles.galleryCloseBtn}
              onPress={() => setGalleryVisible(false)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Close gallery"
            >
              <Ionicons name="close" size={22} color={C.textLight} />
            </TouchableOpacity>
            <Text style={styles.galleryCount}>
              {Math.min(galleryIndex + 1, galleryImages.length)} / {galleryImages.length}
            </Text>
          </View>

          <ScrollView
            ref={galleryScrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            style={styles.galleryScroller}
            contentOffset={{ x: galleryIndex * SCREEN_WIDTH, y: 0 }}
            onScroll={(event) => {
              const rawIndex = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
              const nextIndex = Math.max(0, Math.min(galleryImages.length - 1, rawIndex));
              if (nextIndex !== galleryIndex) setGalleryIndex(nextIndex);
            }}
            scrollEventThrottle={32}
          >
            {galleryImages.map((image, index) => (
              <View key={`${image}-${index}`} style={styles.gallerySlide}>
                <Image source={{ uri: image }} style={styles.galleryImage} resizeMode="contain" />
              </View>
            ))}
          </ScrollView>

          <View style={[styles.galleryBottom, { paddingBottom: insets.bottom + 18 }]}>
            <Text style={styles.galleryHint}>Swipe to explore the studio</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

export default memo(SalonDetailScreen);

function getStyles(theme, isDark) {
  const pinkTint = isDark ? "rgba(255,122,154,0.12)" : C.crimsonTint;
  const pinkTintStrong = isDark ? "rgba(255,122,154,0.2)" : C.crimsonTint;
  const pinkLine = isDark ? "rgba(255,122,154,0.28)" : C.crimsonTint;
  const softCard = isDark ? theme.surfaceStrong : C.bg;

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.canvas,
    },
    scrollContent: {
      flexGrow: 1,
    },

    // Hero
    hero: {
      height: HERO_HEIGHT,
      width: "100%",
      position: "relative",
      overflow: "hidden",
      borderBottomLeftRadius: 28,
      borderBottomRightRadius: 28,
      backgroundColor: theme.surfaceStrong,
    },
    heroImage: {
      width: "100%",
      height: "100%",
    },
    heroShadeTop: {
      position: "absolute",
      left: 0,
      right: 0,
      top: 0,
      height: 120,
    },
    heroShadeBottom: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      height: 120,
    },
    heroActions: {
      position: "absolute",
      left: 16,
      right: 16,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      zIndex: 10,
    },
    heroActionsRight: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    glassBtn: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: isDark ? "rgba(28,28,38,0.88)" : "rgba(255,255,255,0.94)",
      borderWidth: 1,
      borderColor: isDark ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.85)",
      shadowColor: C.bg,
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: 0.16,
      shadowRadius: 10,
      elevation: 5,
    },
    photoChip: {
      position: "absolute",
      right: 16,
      bottom: 38,
      height: 28,
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      paddingHorizontal: 10,
      borderRadius: 14,
      backgroundColor: isDark ? "rgba(28,28,38,0.88)" : "rgba(255,255,255,0.94)",
      borderWidth: 1,
      borderColor: isDark ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.85)",
      shadowColor: C.bg,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 9,
      elevation: 4,
    },
    photoChipText: {
      fontSize: 10.5,
      fontFamily: FF.bodyMedium,
      color: theme.ink,
      letterSpacing: 0.1,
    },

    // Identity
    identityCard: {
      position: "relative",
      zIndex: 3,
      marginTop: -26,
      marginHorizontal: 16,
      paddingTop: 15,
      paddingHorizontal: 17,
      paddingBottom: 14,
      borderRadius: 22,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.hairline,
      shadowColor: C.ink,
      shadowOffset: { width: 0, height: 18 },
      shadowOpacity: isDark ? 0.32 : 0.14,
      shadowRadius: 26,
      elevation: 8,
    },
    eyebrowRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
    },
    eyebrow: {
      flex: 1,
      fontSize: 12,
      fontFamily: FF.bodySemiBold,
      letterSpacing: 1.55,
      textTransform: "uppercase",
      color: theme.muted,
    },
    verifiedPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    verifiedDot: {
      width: 13,
      height: 13,
      borderRadius: 7,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.primary,
    },
    verifiedText: {
      fontSize: 22,
      fontFamily: FF.bodyMedium,
      color: theme.primaryActive,
      letterSpacing: 0.1,
    },
    salonName: {
      marginTop: 5,
      fontSize: 16,
      lineHeight: 21,
      fontFamily: FF.display,
      color: theme.ink,
      letterSpacing: 0.1,
    },
    metaRow: {
      marginTop: 8,
      flexDirection: "row",
      alignItems: "center",
      flexWrap: "wrap",
    },
    ratingInline: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    ratingValue: {
      fontSize: 13,
      fontFamily: FF.display,
      color: theme.ink,
      letterSpacing: 0.1,
    },
    metaText: {
      fontSize: 12,
      fontFamily: FF.body,
      color: theme.muted,
    },
    metaDot: {
      width: 3,
      height: 3,
      borderRadius: 2,
      backgroundColor: isDark ? C.muted : C.muted,
      marginHorizontal: 7,
    },
    locationInline: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
      maxWidth: "100%",
    },
    locationText: {
      fontSize: 13,
      fontFamily: FF.body,
      color: theme.muted,
      flexShrink: 1,
    },
    statusLine: {
      marginTop: 7,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    statusDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    statusText: {
      flexShrink: 1,
      fontSize: 12,
      lineHeight: 20,
      fontFamily: FF.body,
      color: theme.muted,
    },
    cardActions: {
      flexDirection: "row",
      gap: 8,
      marginTop: 12,
    },
    secondaryAction: {
      flex: 1,
      height: 39,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.hairline,
      backgroundColor: softCard,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 7,
    },
    secondaryActionText: {
      fontSize: 14,
      fontFamily: FF.bodyMedium,
      color: theme.ink,
    },

    // Branch picker
    branchPicker: {
      marginTop: 12,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: theme.hairlineSoft,
    },
    branchPickerLabel: {
      fontSize: 13,
      fontFamily: FF.bodySemiBold,
      letterSpacing: 1.2,
      textTransform: "uppercase",
      color: theme.muted,
      marginBottom: 4,
    },
    branchOption: {
      flexDirection: "row",
      alignItems: "center",
      gap: 9,
      paddingVertical: 8,
      paddingHorizontal: 8,
      borderRadius: 12,
    },
    branchOptionSelected: {
      backgroundColor: pinkTint,
    },
    softIconSmall: {
      width: 28,
      height: 28,
      borderRadius: 9,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: pinkTint,
    },
    branchOptionCopy: {
      flex: 1,
      minWidth: 0,
    },
    branchOptionTitle: {
      fontSize: 13,
      fontFamily: FF.display,
      color: theme.ink,
    },
    branchOptionSub: {
      marginTop: 1,
      fontSize: 10,
      fontFamily: FF.body,
      color: theme.muted,
    },

    // Tabs
    tabsRow: {
      height: TABS_HEIGHT,
      flexDirection: "row",
      position: "relative",
      backgroundColor: theme.canvas,
      borderBottomWidth: 1,
      borderBottomColor: theme.hairlineSoft,
    },
    tabBtn: {
      flex: 1,
      height: TABS_HEIGHT,
      alignItems: "center",
      justifyContent: "center",
    },
    tabLabel: {
      fontSize: 13.5,
      fontFamily: FF.bodyMedium,
      color: theme.muted,
      letterSpacing: 0.1,
    },
    tabLabelActive: {
      fontFamily: FF.display,
      color: theme.primaryActive,
    },
    tabUnderline: {
      position: "absolute",
      bottom: -1,
      width: 22,
      height: 2.5,
      borderRadius: 2,
      backgroundColor: theme.primary,
      opacity: 0,
    },
    tabUnderlineActive: {
      opacity: 1,
    },

    // Services
    tabPage: {
      paddingTop: 0,
    },
    categoryScroll: {
      marginTop: 13,
      flexGrow: 0,
    },
    categoryContent: {
      paddingHorizontal: 16,
      paddingBottom: 2,
      alignItems: "center",
    },
    categoryPill: {
      height: 33,
      paddingHorizontal: 15,
      borderRadius: 17,
      marginRight: 7,
      borderWidth: 1,
      borderColor: theme.hairline,
      backgroundColor: theme.surface,
      alignItems: "center",
      justifyContent: "center",
    },
    categoryPillActive: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.22,
      shadowRadius: 12,
      elevation: 4,
    },
    categoryPillText: {
      fontSize: 12,
      fontFamily: FF.bodyMedium,
      color: theme.body,
    },
    categoryPillTextActive: {
      fontFamily: FF.display,
      color: theme.onPrimary,
    },
    listMeta: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 17,
      paddingTop: 14,
      paddingBottom: 8,
    },
    listMetaText: {
      fontSize: 11,
      fontFamily: FF.bodyMedium,
      letterSpacing: 1.2,
      textTransform: "uppercase",
      color: theme.muted,
    },
    serviceList: {
      paddingHorizontal: 16,
      paddingBottom: 16,
      gap: 9,
    },
    serviceSkeletonCard: {
      padding: 14,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.hairline,
      backgroundColor: theme.surface,
    },
    emptyCard: {
      marginHorizontal: 16,
      marginTop: 16,
      paddingVertical: 28,
      paddingHorizontal: 24,
      alignItems: "center",
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.hairline,
      backgroundColor: theme.surface,
    },
    emptyIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: pinkTint,
      marginBottom: 12,
    },
    emptyTitle: {
      fontSize: 18,
      fontFamily: FF.display,
      color: theme.ink,
      textAlign: "center",
    },
    emptyCopy: {
      marginTop: 6,
      fontSize: 18,
      lineHeight: 22,
      fontFamily: FF.body,
      color: theme.muted,
      textAlign: "center",
    },

    // About
    aboutPage: {
      paddingHorizontal: 16,
      paddingTop: 17,
    },
    sectionKicker: {
      fontSize: 13.5,
      fontFamily: FF.bodySemiBold,
      letterSpacing: 1.5,
      textTransform: "uppercase",
      color: theme.primaryActive,
    },
    aboutLead: {
      marginTop: 7,
      fontSize: 11.5,
      lineHeight: 21,
      fontFamily: FF.body,
      color: theme.body,
    },
    aboutBlock: {
      marginTop: 20,
    },
    smallLabel: {
      fontSize: 11,
      fontFamily: FF.bodySemiBold,
      letterSpacing: 1.4,
      textTransform: "uppercase",
      color: theme.muted,
    },
    specialityWrap: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
      marginTop: 9,
    },
    specialityChip: {
      height: 29,
      paddingHorizontal: 12,
      borderRadius: 15,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: isDark ? theme.surface : C.lifted,
      borderWidth: 1,
      borderColor: theme.hairlineSoft,
    },
    specialityText: {
      fontSize: 13.5,
      fontFamily: FF.bodyMedium,
      color: theme.body,
    },
    galleryHead: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    galleryLink: {
      fontSize: 10,
      fontFamily: FF.bodyMedium,
      color: theme.primaryActive,
    },
    galleryScroll: {
      marginTop: 8,
      marginHorizontal: -16,
    },
    galleryContent: {
      paddingHorizontal: 16,
      gap: 8,
    },
    galleryPhoto: {
      width: 175,
      height: 94,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.hairlineSoft,
      backgroundColor: theme.surfaceStrong,
    },
    infoCard: {
      marginTop: 12,
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
      paddingVertical: 12,
      paddingHorizontal: 13,
      borderRadius: 15,
      borderWidth: 1,
      borderColor: theme.hairline,
      backgroundColor: theme.surface,
    },
    locationCard: {
      marginTop: 16,
    },
    softIcon: {
      width: 33,
      height: 33,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: pinkTint,
    },
    infoCopy: {
      flex: 1,
      minWidth: 0,
      paddingTop: 1,
    },
    infoTitle: {
      fontSize: 13,
      lineHeight: 21,
      fontFamily: FF.display,
      color: theme.ink,
    },
    infoDetail: {
      marginTop: 3,
      fontSize: 15,
      lineHeight: 21,
      fontFamily: FF.body,
      color: theme.muted,
    },
    infoChevron: {
      alignSelf: "center",
    },
    hoursCard: {
      marginTop: 12,
      borderRadius: 15,
      borderWidth: 1,
      borderColor: theme.hairline,
      backgroundColor: theme.surface,
      overflow: "hidden",
    },
    hoursHead: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingTop: 12,
      paddingHorizontal: 13,
      paddingBottom: 9,
    },
    hoursTitle: {
      fontSize: 12,
      fontFamily: FF.display,
      color: theme.ink,
    },
    statusChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 7,
      paddingVertical: 3,
      borderRadius: 5,
    },
    statusChipOpen: {
      backgroundColor: isDark ? "rgba(74,222,128,0.14)" : C.successBg,
    },
    statusChipClosed: {
      backgroundColor: isDark ? "rgba(248,113,113,0.14)" : C.crimsonTint,
    },
    statusChipDot: {
      width: 4,
      height: 4,
      borderRadius: 2,
    },
    statusChipText: {
      fontSize: 13,
      fontFamily: FF.bodyMedium,
      letterSpacing: 0.2,
    },
    hoursRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 13,
      paddingVertical: 10,
      borderTopWidth: 1,
      borderTopColor: theme.hairlineSoft,
    },
    hoursRowToday: {
      backgroundColor: pinkTint,
      borderTopColor: pinkLine,
      borderBottomWidth: 1,
      borderBottomColor: pinkLine,
    },
    dayLeft: {
      flexDirection: "row",
      alignItems: "center",
    },
    dayName: {
      fontSize: 12,
      fontFamily: FF.bodySemiBold,
      color: theme.ink,
    },
    todayPill: {
      marginLeft: 6,
      paddingHorizontal: 5,
      paddingVertical: 2,
      borderRadius: 4,
      backgroundColor: pinkTintStrong,
    },
    todayPillText: {
      fontSize: 24,
      fontFamily: FF.display,
      letterSpacing: 0.35,
      color: theme.primaryActive,
    },
    hoursTime: {
      fontSize: 12,
      fontFamily: FF.bodyMedium,
      color: theme.ink,
    },
    hoursTimeToday: {
      fontFamily: FF.display,
    },
    hoursTimeClosed: {
      color: theme.muted,
    },
    hoursMore: {
      height: 36,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
      borderTopWidth: 1,
      borderTopColor: theme.hairlineSoft,
    },
    hoursMoreText: {
      fontSize: 16,
      fontFamily: FF.bodyMedium,
      color: theme.primaryActive,
    },
    hoursEmpty: {
      paddingHorizontal: 14,
      paddingVertical: 14,
      fontSize: 20,
      fontFamily: FF.body,
      color: theme.muted,
      textAlign: "center",
    },
    aboutFooterSpace: {
      height: 20,
    },

    // Reviews
    reviewsPage: {
      paddingHorizontal: 16,
      paddingTop: 16,
    },

    // Sticky compact header
    stickyHeader: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      zIndex: 60,
      backgroundColor: theme.canvas,
      borderBottomWidth: 1,
      borderBottomColor: theme.hairlineSoft,
      shadowColor: C.ink,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: isDark ? 0.28 : 0.08,
      shadowRadius: 14,
      elevation: 12,
    },
    compactHeaderRow: {
      height: COMPACT_HEADER_HEIGHT,
      flexDirection: "row",
      alignItems: "center",
      gap: 9,
      paddingHorizontal: 16,
    },
    compactBackBtn: {
      width: 30,
      height: 30,
      alignItems: "center",
      justifyContent: "center",
      marginLeft: -6,
    },
    compactThumb: {
      width: 30,
      height: 30,
      borderRadius: 9,
      borderWidth: 1,
      borderColor: theme.hairlineSoft,
      backgroundColor: theme.surfaceStrong,
    },
    compactCopy: {
      flex: 1,
      minWidth: 0,
    },
    compactTitle: {
      fontSize: 12.5,
      lineHeight: 21,
      fontFamily: FF.display,
      color: theme.ink,
      letterSpacing: 0.05,
    },
    compactSubRow: {
      marginTop: 2,
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
    },
    compactSubText: {
      flexShrink: 1,
      fontSize: 15,
      fontFamily: FF.body,
      color: theme.muted,
    },
    compactHeart: {
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: "center",
      justifyContent: "center",
      marginLeft: 2,
    },

    // Booking bar
    floatingBottomBarWrapper: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 40,
      overflow: "hidden",
    },
    floatingBottomBar: {
      borderTopWidth: 1,
      borderTopColor: theme.hairlineSoft,
      elevation: 6,
    },
    floatingBottomBarTint: {
      ...StyleSheet.absoluteFillObject,
    },
    bookRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 14,
      paddingHorizontal: 18,
      paddingTop: 14,
    },
    totalBlock: {
      flex: 1,
      minWidth: 0,
    },
    bookingLabel: {
      fontSize: 13,
      fontFamily: FF.body,
      color: theme.muted,
      letterSpacing: 0.2,
    },
    priceRow: {
      marginTop: 2,
      flexDirection: "row",
      alignItems: "baseline",
      gap: 6,
    },
    totalAmount: {
      fontSize: 22,
      fontFamily: FF.displayBold,
      color: theme.ink,
      letterSpacing: 0.2,
    },
    totalSuffix: {
      fontSize: 14,
      fontFamily: FF.body,
      color: theme.muted,
      letterSpacing: 0.2,
    },
    bookBtn: {
      height: 48,
      paddingHorizontal: 24,
      borderRadius: 24,
      backgroundColor: theme.primary,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      elevation: 3,
    },
    bookBtnText: {
      fontSize: 16,
      fontFamily: FF.displayBold,
      color: theme.onPrimary,
      letterSpacing: 0.3,
    },

    // Gallery
    galleryModal: {
      flex: 1,
      backgroundColor: C.ink,
    },
    galleryTop: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      zIndex: 10,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingBottom: 10,
      backgroundColor: "rgba(11,10,13,0.55)",
    },
    galleryCloseBtn: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(255,255,255,0.14)",
    },
    galleryCount: {
      fontSize: 10.5,
      fontFamily: FF.bodyMedium,
      color: C.textLight,
      letterSpacing: 0.6,
    },
    galleryScroller: {
      flex: 1,
    },
    gallerySlide: {
      width: SCREEN_WIDTH,
      height: SCREEN_HEIGHT,
      alignItems: "center",
      justifyContent: "center",
    },
    galleryImage: {
      width: SCREEN_WIDTH - 24,
      height: SCREEN_HEIGHT * 0.68,
      borderRadius: 10,
    },
    galleryBottom: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      alignItems: "center",
      paddingTop: 14,
      backgroundColor: "rgba(11,10,13,0.55)",
    },
    galleryHint: {
      fontSize: 10.5,
      fontFamily: FF.body,
      letterSpacing: 0.9,
      textTransform: "uppercase",
      color: "rgba(255,255,255,0.6)",
    },
  });
}
