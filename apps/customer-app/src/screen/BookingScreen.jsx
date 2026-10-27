import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet, Platform, StatusBar, Image, TextInput } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, FF } from '../theme';
import SlotPicker from '../components/SlotPicker';
import ErrorCardModal from '../components/ErrorCardModal';
import ConflictModal from '../components/ConflictModal';
import { browseService } from '../services/browseService';
import { appointmentService } from '../services/appointmentService';
import { paiseToINR, toLocalDateStr } from '../services/apiClient';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import VerifyEmailModal from '../components/VerifyEmailModal';

export default function BookingScreen({ salon, branch, service, selectedServices, goBack, navigate }) {
  const { isAuthenticated, user } = useAuth();
  const { isDark } = useTheme();
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const insets = useSafeAreaInsets();
  const isAndroid = Platform.OS === 'android';
  const topInset = Math.max(insets.top, isAndroid ? (StatusBar.currentHeight || 24) : 12) + 8;
  const bottomInset = isAndroid ? Math.max(insets.bottom, 36) + 12 : Math.max(insets.bottom, 16) + 8;
  const todayObj = new Date();
  const todayStr = toLocalDateStr(todayObj);

  const allServices = selectedServices && selectedServices.length > 0 ? selectedServices : (service ? [service] : []);
  const rawTotalPrice = allServices.reduce((sum, s) => sum + (s.price || 0), 0);
  const totalDurationMinutes = allServices.reduce((sum, s) => sum + (s.durationMinutes || s.duration || 30), 0);

  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [conflictModalVisible, setConflictModalVisible] = useState(false);
  const [conflictData, setConflictData] = useState(null);
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(null);
  const [promoError, setPromoError] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);

  const discountAmount = promoApplied ? promoApplied.discount : 0;
  const finalTotal = Math.max(0, rawTotalPrice - discountAmount);

  const handleApplyPromo = () => {
    const code = promoCode.trim().toUpperCase();
    if (!code) return;
    setPromoError('');
    setPromoLoading(true);
    setTimeout(() => {
      if (code === 'HAIRX10') {
        const disc = Math.round(rawTotalPrice * 0.10);
        setPromoApplied({ code, discount: disc, label: '10% off' });
        setPromoError('');
      } else if (code === 'FIRST50') {
        const disc = Math.min(5000, Math.round(rawTotalPrice * 0.50));
        setPromoApplied({ code, discount: disc, label: '50% off (max ₹50)' });
        setPromoError('');
      } else if (code === 'FLAT20') {
        setPromoApplied({ code, discount: 2000, label: '₹20 off' });
        setPromoError('');
      } else {
        setPromoApplied(null);
        setPromoError('Invalid promo code');
      }
      setPromoLoading(false);
    }, 600);
  };

  const handleRemovePromo = () => {
    setPromoApplied(null);
    setPromoCode('');
    setPromoError('');
  };

  useEffect(() => {
    if (!branch) return;
    let cancelled = false;
    const fetchSlots = async () => {
      setLoadingSlots(true);
      setSelectedSlot(null);
      setErrorMessage(null);
      try {
        const branchId = branch._id || branch.id || branch;
        const sId = service ? (service._id || service.id) : undefined;
        const res = await browseService.getBranchSlots(branchId, selectedDate, undefined, sId);
        if (cancelled) return;
        const raw = res.data?.availability || res.data?.slots || (Array.isArray(res.data) ? res.data : []);
        const slotMap = new Map();
        if (Array.isArray(raw)) {
          raw.forEach((item) => {
            if (item.slots && Array.isArray(item.slots)) {
              item.slots.forEach((s) => {
                const timeKey = s.startTime;
                if (!timeKey) return;
                const newSlot = { _id: s.slotId, startTime: s.startTime, endTime: s.endTime, staffName: item.staffName, status: s.status || 'AVAILABLE' };
                if (!slotMap.has(timeKey)) { slotMap.set(timeKey, newSlot); } else {
                  const existing = slotMap.get(timeKey);
                  const existingAvailable = (existing.status || '').toUpperCase() === 'AVAILABLE';
                  const newAvailable = (newSlot.status || '').toUpperCase() === 'AVAILABLE';
                  if (!existingAvailable && newAvailable) { slotMap.set(timeKey, newSlot); }
                }
              });
            } else {
              const timeKey = item.startTime || item.time;
              if (timeKey && !slotMap.has(timeKey)) { slotMap.set(timeKey, item); }
            }
          });
        }
        const now = new Date();
        const todayStr = toLocalDateStr(now);
        const isToday = selectedDate === todayStr;
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        const filteredSlots = Array.from(slotMap.values()).filter((slot) => {
          if (!isToday) return true;
          const [h, m] = (slot.startTime || '').split(':').map(Number);
          if (isNaN(h)) return true;
          return (h * 60 + (m || 0)) > currentMinutes;
        });
        setSlots(filteredSlots);
      } catch (err) {
        if (!cancelled) setSlots([]);
      } finally {
        if (!cancelled) setLoadingSlots(false);
      }
    };
    fetchSlots();
    return () => { cancelled = true; };
  }, [branch, selectedDate]);

  const handleConfirmBooking = async () => {
    setErrorMessage(null);
    if (!isAuthenticated) {
      if (navigate) {
        navigate('Login', { redirectTo: 'Booking', redirectData: { salon, branch, service, selectedServices: allServices } });
      }
      return;
    }
    const isVerified = Boolean(user?.isEmailVerified || user?.email_verified);
    if (user && !isVerified) {
      setShowVerifyModal(true);
      return;
    }
    setSubmitting(true);
    try {
      const slotId = selectedSlot._id || selectedSlot.id;
      const serviceId = service ? (service._id || service.id) : (allServices[0]?._id || allServices[0]?.id);
      const serviceIds = allServices.map((s) => s._id || s.id).filter(Boolean);

      await appointmentService.bookAppointment({
        slotId, serviceId, serviceIds, customerNotes: '', guests: 1,
      });
      setBookingSuccess(true);
    } catch (err) {
      if (err.conflictAppointment || (err.message && err.message.toLowerCase().includes('already have an appointment'))) {
        setConflictData(err.conflictAppointment || { salonName: salon?.name, serviceName: service?.name, date: selectedDate, startTime: selectedSlot?.startTime });
        setConflictModalVisible(true);
      } else {
        setErrorMessage(err.message || err.toString() || 'Failed to book appointment');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const styles = getStyles();



  const primarySvc = allServices[0] || {};
  const branchName = branch?.name || salon?.name || "Royal Cut Luxury Salon & Spa";
  const branchAddress = branch?.address?.city || branch?.address?.street || "Brahmapur Main Road";
  const rawRating =
    typeof salon?.rating === "number" || typeof salon?.rating === "string"
      ? salon.rating
      : salon?.rating?.avgScore ||
        salon?.avgRating ||
        salon?.ratingAverage ||
        salon?.reviewAvg ||
        branch?.rating ||
        branch?.avgRating ||
        5.0;

  const numericRating =
    typeof rawRating === "number"
      ? rawRating
      : parseFloat(rawRating) || 5.0;

  const ratingStr = numericRating.toFixed(1);

  const reviewCount =
    typeof salon?.reviewCount === "number" && salon.reviewCount > 0
      ? salon.reviewCount
      : typeof salon?.totalReviews === "number" && salon.totalReviews > 0
      ? salon.totalReviews
      : typeof salon?.reviewsCount === "number" && salon.reviewsCount > 0
      ? salon.reviewsCount
      : typeof salon?.rating?.totalReviews === "number" && salon.rating.totalReviews > 0
      ? salon.rating.totalReviews
      : Array.isArray(salon?.reviews) && salon.reviews.length > 0
      ? salon.reviews.length
      : typeof branch?.reviewCount === "number" && branch.reviewCount > 0
      ? branch.reviewCount
      : 0;

  const formattedReviews =
    reviewCount >= 1000
      ? (reviewCount / 1000).toFixed(1).replace(/\.0$/, "") + "k"
      : reviewCount;

  const rating = ratingStr;
  const distance = branch?.distance ? ` • ${branch.distance} km` : salon?.distance ? ` • ${salon.distance} km` : " • 1.2 km";

  const formattedDate = new Date(selectedDate).toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short", year: "numeric" });

  const handleShareBooking = async () => {
    try {
      const htmlContent = `
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
            <style>
              body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #111827; }
              .header { text-align: center; margin-bottom: 30px; }
              .header h1 { color: #6F2A3B; margin: 0; font-size: 28px; }
              .header p { color: #6B7280; font-size: 16px; margin-top: 8px; }
              .card { border: 1px solid #E5E7EB; border-radius: 12px; padding: 24px; background: #F9FAFB; }
              .row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #E5E7EB; }
              .row:last-child { border-bottom: none; }
              .label { color: #6B7280; font-weight: 600; font-size: 14px; }
              .value { font-weight: 700; font-size: 14px; text-align: right; }
              .value-sub { color: #6B7280; font-size: 12px; font-weight: normal; margin-top: 4px; }
              .footer { text-align: center; margin-top: 40px; color: #6B7280; font-size: 14px; font-style: italic; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Booking Confirmed!</h1>
              <p>Your appointment is secured.</p>
            </div>
            <div class="card">
              <div class="row">
                <div class="label">Service</div>
                <div class="value">
                  ${primarySvc.name || "Haircut & Styling"}
                  <div class="value-sub">${totalDurationMinutes} mins • ${paiseToINR(rawTotalPrice)}</div>
                </div>
              </div>
              <div class="row">
                <div class="label">Date & Time</div>
                <div class="value">${formattedDate} • ${selectedSlot?.startTime || '10:30 AM'}</div>
              </div>
              <div class="row">
                <div class="label">Location</div>
                <div class="value">
                  ${branchName}
                  <div class="value-sub">${branchAddress}</div>
                </div>
              </div>
              <div class="row">
                <div class="label">Stylist</div>
                <div class="value">Any Available</div>
              </div>
            </div>
            <div class="footer">
              Thank you for choosing us! Self care is a step towards a happier you.
            </div>
          </body>
        </html>
      `;

      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        setErrorMessage("Sharing is not available on this device.");
        return;
      }
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await Sharing.shareAsync(uri, { UTI: 'com.adobe.pdf', mimeType: 'application/pdf', dialogTitle: 'Share Booking Receipt' });
    } catch (error) {
      console.error("Share error:", error);
      setErrorMessage(error.message || "Could not generate or share PDF");
    }
  };

  if (bookingSuccess) {
    return (
      <ScrollView contentContainerStyle={[styles.successScreenWrapper, { paddingTop: topInset + 40 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.successHeader}>
          <View style={styles.successCheckRing}>
            <Ionicons name="checkmark" size={44} color={C.textLight} />
          </View>
          <Text style={styles.successTitle}>Booking Successful!</Text>
          <Text style={styles.successSub}>
            Your appointment has been confirmed.{"\n"}We look forward to seeing you!
          </Text>
        </View>

        <View style={styles.successDetailsCard}>
          <View style={styles.successServiceRow}>
            <Image source={{ uri: primarySvc.image || salon?.coverImage || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=500' }} style={styles.successServiceImg} />
            <View style={styles.successServiceInfo}>
              <Text style={styles.successServiceName}>{primarySvc.name || "Haircut & Styling"}</Text>
              <Text style={styles.successServiceDesc}>Professional haircut with styling</Text>
              <View style={styles.successServiceMeta}>
                <Ionicons name="time-outline" size={14} color={C.muted} />
                <Text style={styles.successServiceMetaText}>{totalDurationMinutes} mins</Text>
                <Ionicons name="pricetag-outline" size={14} color={C.muted} style={{ marginLeft: 12 }} />
                <Text style={styles.successServiceMetaText}>{paiseToINR(rawTotalPrice)}</Text>
              </View>
            </View>
          </View>

          <View style={styles.successDivider} />

          <View style={styles.successDetailRow}>
            <View style={[styles.successIconBox, { backgroundColor: C.lifted }]}>
              <Ionicons name="person-outline" size={18} color={C.main} />
            </View>
            <View style={styles.successDetailTextWrap}>
              <Text style={styles.successDetailLabel}>Stylist</Text>
              <Text style={styles.successDetailValue}>Any Available</Text>
            </View>
          </View>

          <View style={styles.successDivider} />

          <View style={styles.successDetailRow}>
            <View style={[styles.successIconBox, { backgroundColor: C.lifted }]}>
              <Ionicons name="calendar-outline" size={18} color={C.main} />
            </View>
            <View style={styles.successDetailTextWrap}>
              <Text style={styles.successDetailLabel}>Date & Time</Text>
              <Text style={styles.successDetailValue}>{formattedDate} • {selectedSlot?.startTime || '10:30 AM'}</Text>
            </View>
          </View>

          <View style={styles.successDivider} />

          <View style={styles.successDetailRow}>
            <View style={[styles.successIconBox, { backgroundColor: C.lifted }]}>
              <Ionicons name="location-outline" size={18} color={C.main} />
            </View>
            <View style={styles.successDetailTextWrap}>
              <Text style={styles.successDetailLabel}>Location</Text>
              <Text style={styles.successDetailValue}>{branchName}</Text>
              <Text style={styles.successDetailSubValue}>{branchAddress}</Text>
            </View>
          </View>

          <View style={styles.successDivider} />

          <View style={styles.successDetailRow}>
            <View style={[styles.successIconBox, { backgroundColor: C.lifted }]}>
              <Ionicons name="document-text-outline" size={18} color={C.main} />
            </View>
            <View style={styles.successDetailTextWrap}>
              <Text style={styles.successDetailLabel}>Booking ID</Text>
              <Text style={styles.successDetailValue}>#BG{Math.floor(100000 + Math.random() * 900000)}</Text>
            </View>
            <TouchableOpacity style={styles.copyBtn}>
              <Text style={styles.copyBtnText}>Copy</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.viewBookingsBtn} onPress={() => navigate && navigate('Bookings')} activeOpacity={0.88}>
          <Text style={styles.viewBookingsText}>View My Bookings</Text>
          <Ionicons name="arrow-forward" size={18} color={C.textLight} style={{ marginLeft: 8 }} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.shareBtn} onPress={handleShareBooking} activeOpacity={0.75}>
          <Ionicons name="share-outline" size={18} color={C.main} style={{ marginRight: 8 }} />
          <Text style={styles.shareBtnText}>Share Booking</Text>
        </TouchableOpacity>

        <View style={styles.successFooter}>
          <View style={styles.leafCircle}>
            <Ionicons name="leaf" size={16} color={C.main} />
          </View>
          <Text style={styles.footerQuote}>Self care is a step{"\n"}towards a happier you!</Text>
          <View style={styles.heartRow}>
            <View style={styles.heartLine} />
            <Ionicons name="heart-outline" size={16} color={C.main} style={{ marginHorizontal: 8 }} />
            <View style={styles.heartLine} />
          </View>
        </View>
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <ErrorCardModal visible={!!errorMessage} title="Booking Notice" message={errorMessage} onClose={() => setErrorMessage(null)} />
      <ConflictModal visible={conflictModalVisible} conflictData={conflictData} onClose={() => setConflictModalVisible(false)} onViewAppointments={() => { setConflictModalVisible(false); if (navigate) navigate('Bookings'); }} />
      <VerifyEmailModal visible={showVerifyModal} email={user?.email} onClose={() => setShowVerifyModal(false)} onVerified={() => setShowVerifyModal(false)} />

      <View style={[styles.header, { paddingTop: topInset }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => step === 2 ? setStep(1) : goBack()}>
          <Ionicons name="arrow-back" size={24} color={C.ink} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>{step === 1 ? "Select Date & Time" : "Booking Summary"}</Text>
        <Text style={styles.pageSubTitle}>
          {step === 1 ? "Choose your preferred date and time for the appointment" : "Review your booking details before confirming"}
        </Text>

        <View style={styles.salonCard}>
          <Image source={{ uri: salon?.coverImage || salon?.images?.[0] || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=500' }} style={styles.salonImg} />
          <View style={styles.salonInfo}>
            <Text style={styles.salonName} numberOfLines={1}>{branchName}</Text>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={12} color={C.warning} />
              <Text style={styles.ratingTxt}>{rating} ({formattedReviews} reviews)</Text>
            </View>
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={12} color={C.muted} />
              <Text style={styles.locationTxt} numberOfLines={1}>{branchAddress}{distance}</Text>
            </View>
          </View>
        </View>

        {step === 1 ? (
          <>
            <View style={styles.serviceCard}>
              <View style={styles.svcIconWrap}><Ionicons name="cut-outline" size={20} color={C.main} /></View>
              <View style={styles.svcInfo}>
                <Text style={styles.svcName} numberOfLines={1}>{primarySvc.name || "Haircut - Classic"}</Text>
                <Text style={styles.svcSub}>{totalDurationMinutes} mins · Stylist: Any</Text>
              </View>
              <Text style={styles.svcPrice}>{paiseToINR(rawTotalPrice)}</Text>
            </View>

            {loadingSlots ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="small" color={C.main} />
                <Text style={styles.loadingText}>Fetching available time slots…</Text>
              </View>
            ) : (
              <SlotPicker slots={slots} selectedSlot={selectedSlot} serviceDurationMinutes={totalDurationMinutes} onSelectSlot={setSelectedSlot} selectedDate={selectedDate} onSelectDate={setSelectedDate} />
            )}
          </>
        ) : (
          <>
            <View style={styles.summarySection}>
              <Text style={styles.sectionTitle}>Booking Details</Text>
              <View style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <Ionicons name="albums-outline" size={16} color={C.main} style={styles.summaryIcon} />
                  <Text style={styles.summaryLabel}>Service</Text>
                  <View style={styles.summaryValWrap}>
                    <Text style={styles.summaryVal}>{primarySvc.name || "Haircut - Classic"}</Text>
                    <Text style={styles.summaryValSub}>{totalDurationMinutes} mins</Text>
                  </View>
                </View>
                <View style={styles.summaryRow}>
                  <Ionicons name="calendar-outline" size={16} color={C.main} style={styles.summaryIcon} />
                  <Text style={styles.summaryLabel}>Date</Text>
                  <Text style={styles.summaryVal}>{formattedDate}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Ionicons name="time-outline" size={16} color={C.main} style={styles.summaryIcon} />
                  <Text style={styles.summaryLabel}>Time</Text>
                  <Text style={styles.summaryVal}>{selectedSlot?.startTime || '10:00 AM'} - {selectedSlot?.endTime || '10:30 AM'}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Ionicons name="person-outline" size={16} color={C.main} style={styles.summaryIcon} />
                  <Text style={styles.summaryLabel}>Stylist</Text>
                  <Text style={styles.summaryVal}>Any Available</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Ionicons name="location-outline" size={16} color={C.main} style={styles.summaryIcon} />
                  <Text style={styles.summaryLabel}>Salon Address</Text>
                  <View style={styles.summaryValWrap}>
                    <Text style={styles.summaryVal}>{branchName}</Text>
                    <Text style={styles.summaryValSub}>{branchAddress}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Promo Code */}
            <View style={styles.summarySection}>
              <Text style={styles.sectionTitle}>Promo Code</Text>
              {promoApplied ? (
                <View style={styles.promoAppliedCard}>
                  <View style={styles.promoAppliedLeft}>
                    <Ionicons name="pricetag" size={18} color={C.success} />
                    <View style={styles.promoAppliedInfo}>
                      <Text style={styles.promoAppliedCode}>{promoApplied.code}</Text>
                      <Text style={styles.promoAppliedLabel}>{promoApplied.label} — You save {paiseToINR(promoApplied.discount)}</Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={handleRemovePromo} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons name="close-circle" size={20} color={C.muted} />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.promoInputRow}>
                  <TextInput
                    style={styles.promoInput}
                    placeholder="Enter promo code"
                    placeholderTextColor={C.muted}
                    value={promoCode}
                    onChangeText={(t) => { setPromoCode(t); setPromoError(''); }}
                    autoCapitalize="characters"
                    returnKeyType="done"
                    onSubmitEditing={handleApplyPromo}
                  />
                  <TouchableOpacity
                    style={[styles.promoApplyBtn, (!promoCode.trim() || promoLoading) && { opacity: 0.5 }]}
                    onPress={handleApplyPromo}
                    disabled={!promoCode.trim() || promoLoading}
                    activeOpacity={0.8}
                  >
                    {promoLoading ? (
                      <ActivityIndicator size="small" color={C.textLight} />
                    ) : (
                      <Text style={styles.promoApplyText}>Apply</Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}
              {promoError ? <Text style={styles.promoErrorText}>{promoError}</Text> : null}
            </View>

            {/* Price Details */}
            <View style={styles.summarySection}>
              <Text style={styles.sectionTitle}>Price Details</Text>
              <View style={styles.summaryCard}>
                <View style={[styles.summaryRow, { borderBottomWidth: 0, paddingBottom: 4 }]}>
                  <Text style={styles.priceLabel}>Service Price</Text>
                  <Text style={styles.priceVal}>{paiseToINR(rawTotalPrice)}</Text>
                </View>
                {discountAmount > 0 && (
                  <View style={[styles.summaryRow, { borderBottomWidth: 0, paddingBottom: 4, paddingTop: 4 }]}>
                    <Text style={[styles.priceLabel, { color: C.success }]}>Promo Discount</Text>
                    <Text style={[styles.priceVal, { color: C.success }]}>−{paiseToINR(discountAmount)}</Text>
                  </View>
                )}
                <View style={[styles.summaryRow, { borderBottomWidth: 1, borderBottomColor: C.border, paddingBottom: 12, paddingTop: 4 }]}>
                  <Text style={styles.priceLabel}>Platform Fee <Ionicons name="information-circle-outline" size={12} color={C.muted} /></Text>
                  <Text style={styles.priceVal}>₹0</Text>
                </View>
                <View style={[styles.summaryRow, { borderBottomWidth: 0, paddingTop: 12 }]}>
                  <Text style={styles.totalLabel}>Total Amount</Text>
                  <Text style={styles.totalVal}>{paiseToINR(finalTotal)}</Text>
                </View>
              </View>
            </View>

            <View style={styles.cancellationBanner}>
              <Ionicons name="checkmark-circle" size={20} color={C.success} />
              <View style={styles.cancelTextWrap}>
                <Text style={styles.cancelTitle}>Free Cancellation</Text>
                <Text style={styles.cancelSub}>Cancel up to 2 hours before your appointment</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={C.success} />
            </View>
          </>
        )}
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: bottomInset }]}>
        {step === 1 ? (
          <TouchableOpacity 
            style={[styles.mainBtn, (!selectedSlot || loadingSlots) && styles.btnDisabled]} 
            disabled={!selectedSlot || loadingSlots} 
            onPress={() => setStep(2)}
          >
            <Text style={styles.mainBtnText}>Continue →</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[styles.mainBtn, submitting && styles.btnDisabled]} 
            disabled={submitting} 
            onPress={handleConfirmBooking}
          >
            {submitting ? <ActivityIndicator color={C.textLight} size="small" /> : <Text style={styles.mainBtnText}>Book →</Text>}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function getStyles() {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingBottom: 10, backgroundColor: C.bg },
    backBtn: { width: 36, height: 36, justifyContent: "center" },
    contentContainer: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 140 },
    pageTitle: { fontFamily: FF.displayBold, fontSize: 26, color: C.ink, letterSpacing: 0.2, marginBottom: 4 },
    pageSubTitle: { fontSize: 13, color: C.muted, marginBottom: 24, lineHeight: 18},
    salonCard: { flexDirection: "row", backgroundColor: C.textLight, borderRadius: 16, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: C.border },
    salonImg: { width: 60, height: 60, borderRadius: 12, marginRight: 12 },
    salonInfo: { flex: 1, justifyContent: "center" },
    salonName: { fontSize: 15, fontFamily: "Oswald_700Bold", color: C.ink, marginBottom: 4 },
    ratingRow: { flexDirection: "row", alignItems: "center", marginBottom: 2 },
    ratingTxt: { fontSize: 12, color: "#666", marginLeft: 4, fontFamily: "Oswald_500Medium" },
    locationRow: { flexDirection: "row", alignItems: "center" },
    locationTxt: { fontSize: 12, color: C.muted, marginLeft: 4 },
    serviceCard: { flexDirection: "row", alignItems: "center", backgroundColor: C.lifted, borderRadius: 16, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: C.borderLight },
    svcIconWrap: { width: 44, height: 44, borderRadius: 12, backgroundColor: C.crimsonTint, alignItems: "center", justifyContent: "center", marginRight: 12 },
    svcInfo: { flex: 1, flexShrink: 1, paddingRight: 8 },
    svcName: { fontSize: 15, fontFamily: "Oswald_600SemiBold", color: C.ink, marginBottom: 2 },
    svcSub: { fontSize: 12, color: C.muted },
    svcPrice: { fontSize: 15, fontFamily: "Oswald_700Bold", color: C.ink, flexShrink: 0 },
    summarySection: { marginBottom: 24 },
    sectionTitle: { fontFamily: FF.display, fontSize: 16, color: C.ink, letterSpacing: 0.1, marginBottom: 12 },
    summaryCard: { backgroundColor: C.textLight, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.border },
    summaryRow: { flexDirection: "row", alignItems: "flex-start", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.lifted },
    summaryIcon: { width: 24, marginTop: 2 },
    summaryLabel: { flex: 1, fontSize: 14, color: C.muted, marginTop: 1 },
    summaryValWrap: { flex: 2, alignItems: "flex-end" },
    summaryVal: { fontSize: 14, fontFamily: "Oswald_600SemiBold", color: C.ink, textAlign: "right" },
    summaryValSub: { fontSize: 12, color: C.muted, marginTop: 2, textAlign: "right" },
    priceLabel: { flex: 1, fontSize: 14, color: C.muted },
    priceVal: { fontSize: 15, fontFamily: "Oswald_600SemiBold", color: C.ink },
    totalLabel: { flex: 1, fontSize: 16, fontFamily: "Oswald_700Bold", color: C.ink },
    totalVal: { fontSize: 18, fontFamily: "Oswald_700Bold", color: C.ink },
    promoInputRow: { flexDirection: "row", alignItems: "center", gap: 10 },
    promoInput: { flex: 1, height: 48, backgroundColor: C.surface, borderRadius: 12, paddingHorizontal: 16, fontSize: 15, fontFamily: "Oswald_500Medium", color: C.ink, borderWidth: 1, borderColor: C.border, letterSpacing: 0.5 },
    promoApplyBtn: { height: 48, paddingHorizontal: 22, borderRadius: 12, backgroundColor: C.main, alignItems: "center", justifyContent: "center" },
    promoApplyText: { fontSize: 15, fontFamily: "Oswald_600SemiBold", color: C.textLight, letterSpacing: 0.3 },
    promoErrorText: { fontSize: 12, fontFamily: "Oswald_400Regular", color: C.error, marginTop: 8 },
    promoAppliedCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: C.successBg, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: "rgba(46,125,50,0.15)" },
    promoAppliedLeft: { flexDirection: "row", alignItems: "center", flex: 1, gap: 10 },
    promoAppliedInfo: { flex: 1 },
    promoAppliedCode: { fontSize: 15, fontFamily: "Oswald_700Bold", color: C.ink, letterSpacing: 0.5 },
    promoAppliedLabel: { fontSize: 12, fontFamily: "Oswald_400Regular", color: C.success, marginTop: 2 },
    cancellationBanner: { flexDirection: "row", alignItems: "center", backgroundColor: C.successBg, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: C.successBg, marginBottom: 20 },
    cancelTextWrap: { flex: 1, marginLeft: 10 },
    cancelTitle: { fontSize: 13, fontFamily: "Oswald_700Bold", color: C.success, marginBottom: 2 },
    cancelSub: { fontSize: 11, color: C.success },
    bottomBar: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: C.bg, paddingHorizontal: 20, paddingTop: 16 },
    mainBtn: { backgroundColor: C.main, height: 56, borderRadius: 16, alignItems: "center", justifyContent: "center" },
    btnDisabled: { opacity: 0.5 },
    mainBtnText: { color: C.textLight, fontSize: 16, fontFamily: "Oswald_600SemiBold" },
    loadingBox: { padding: 40, alignItems: "center" },
    loadingText: { marginTop: 12, color: C.muted, fontSize: 14 },
    successScreenWrapper: { flexGrow: 1, backgroundColor: C.textLight, paddingHorizontal: 20, paddingTop: 30, paddingBottom: 30, alignItems: "center" },
    successHeader: { alignItems: "center", marginBottom: 24, marginTop: 10 },
    successCheckRing: { width: 72, height: 72, borderRadius: 36, backgroundColor: C.main, alignItems: "center", justifyContent: "center", marginBottom: 16, borderWidth: 6, borderColor: C.crimsonTint },
    successTitle: { fontFamily: FF.displayBold, fontSize: 22, color: C.ink, textAlign: "center", letterSpacing: 0.2, marginBottom: 6 },
    successSub: { fontSize: 13, color: C.muted, textAlign: "center", lineHeight: 20},
    successDetailsCard: { width: "100%", backgroundColor: C.textLight, borderRadius: 16, padding: 16, marginBottom: 20, shadowColor: C.ink, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2, borderWidth: 1, borderColor: C.border },
    successServiceRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
    successServiceImg: { width: 50, height: 50, borderRadius: 10, marginRight: 12 },
    successServiceInfo: { flex: 1 },
    successServiceName: { fontSize: 15, fontFamily: "Oswald_700Bold", color: C.ink, marginBottom: 2 },
    successServiceDesc: { fontSize: 12, color: C.muted, marginBottom: 6 },
    successServiceMeta: { flexDirection: "row", alignItems: "center" },
    successServiceMetaText: { fontSize: 12, color: C.textSecondary, marginLeft: 4, fontFamily: "Oswald_500Medium" },
    successDivider: { height: 1, backgroundColor: C.border, marginVertical: 12 },
    successDetailRow: { flexDirection: "row", alignItems: "center" },
    successIconBox: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center", marginRight: 12 },
    successDetailTextWrap: { flex: 1 },
    successDetailLabel: { fontSize: 12, fontFamily: "Oswald_600SemiBold", color: C.ink, marginBottom: 2 },
    successDetailValue: { fontSize: 13, color: C.textSecondary },
    successDetailSubValue: { fontSize: 12, color: C.muted, marginTop: 2 },
    copyBtn: { backgroundColor: C.lifted, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
    copyBtnText: { color: C.main, fontSize: 11, fontFamily: "Oswald_600SemiBold" },
    viewBookingsBtn: { width: "100%", height: 52, borderRadius: 26, backgroundColor: C.main, flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 12 },
    viewBookingsText: { fontSize: 15, fontFamily: "Oswald_700Bold", color: C.textLight },
    shareBtn: { width: "100%", height: 52, borderRadius: 26, backgroundColor: C.lifted, flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 30 },
    shareBtnText: { fontSize: 15, fontFamily: "Oswald_700Bold", color: C.main },
    successFooter: { alignItems: "center", marginTop: "auto" },
    leafCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.lifted, alignItems: "center", justifyContent: "center", marginBottom: 8 },
    footerQuote: { fontSize: 12, color: C.main, textAlign: "center", fontFamily: "Oswald_500Medium", lineHeight: 16, marginBottom: 10 },
    heartRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", opacity: 0.5 },
    heartLine: { width: 24, height: 1, backgroundColor: C.main }
  });
}

