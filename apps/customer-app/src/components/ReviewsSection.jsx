// src/components/ReviewsSection.jsx
import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { C, FF } from "../theme";
import { useTheme } from "../context/ThemeContext";
import SpringTouchable from "./SpringTouchable";

const RATING_LABELS = {
  1: "Poor 😞",
  2: "Fair 😐",
  3: "Good 🙂",
  4: "Very Good 😊",
  5: "Excellent! 🌟",
};

const GOLD = C.warning;
const GREEN = C.success;

function formatReviewCount(count) {
  const value = Number(count) || 0;
  if (value >= 1000) return `${(value / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(value);
}

function formatRelativeDate(value) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return typeof value === "string" ? value : "";
  }

  const diff = Math.max(0, Date.now() - date.getTime());
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;

  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;

  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks} ${weeks === 1 ? "week" : "weeks"} ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months} ${months === 1 ? "month" : "months"} ago`;

  const years = Math.floor(days / 365);
  return `${years} ${years === 1 ? "year" : "years"} ago`;
}

function getInitials(name) {
  const parts = String(name || "Customer").trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.charAt(0) || "C";
  const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : "";
  return `${first}${last}`.toUpperCase();
}

function reviewTimestamp(review) {
  const value = review?.createdAt || review?.date || review?.time;
  if (!value) return 0;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

export default function ReviewsSection({
  reviews = [],
  overallRating = null,
  totalReviews = 0,
  onSubmitReview,
}) {
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => getStyles(theme, isDark), [theme, isDark]);
  const verifiedGreen = isDark ? C.success : GREEN;

  const [userRating, setUserRating] = useState(0);
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const totalCount = Number(totalReviews) || 0;
  const displayCount = totalCount > 0 ? totalCount : reviews.length;
  const hasReviews = displayCount > 0;
  const numericRating = Number.parseFloat(overallRating) || 0;
  const canSubmit = Boolean(userRating) && Boolean(commentText.trim()) && !isSubmitting;

  const sortedReviews = useMemo(() => {
    return [...reviews].sort((a, b) => reviewTimestamp(b) - reviewTimestamp(a));
  }, [reviews]);

  const visibleReviews = showAll ? sortedReviews : sortedReviews.slice(0, 3);

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    try {
      if (onSubmitReview) {
        await onSubmitReview({
          rating: userRating,
          comment: commentText.trim(),
        });
      }
      setCommentText("");
      setUserRating(0);
      setComposerOpen(false);
    } catch (submitError) {
      // Keep the typed review in place; the screen surfaces the reason.
      console.warn("Submit review failed:", submitError?.message || submitError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const footnoteText = (() => {
    if (!hasReviews || reviews.length === 0) return "";
    if (showAll) return `Showing all ${reviews.length} available ${reviews.length === 1 ? "review" : "reviews"}`;
    if (reviews.length > 3) return "Showing the 3 most recent reviews";
    if (displayCount > reviews.length) {
      return `Showing the ${reviews.length} most recent ${reviews.length === 1 ? "review" : "reviews"}`;
    }
    return `Showing all ${reviews.length} ${reviews.length === 1 ? "review" : "reviews"}`;
  })();

  return (
    <View style={styles.container}>
      {/* Rating summary */}
      <View style={styles.summaryCard}>
        <View style={styles.scoreBlock}>
          <Text style={styles.scoreNumber}>
            {hasReviews && numericRating > 0 ? numericRating.toFixed(1) : hasReviews ? "—" : "New"}
          </Text>
          {hasReviews && numericRating > 0 ? (
            <View style={styles.summaryStars}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons
                  key={star}
                  name={star <= Math.round(numericRating) ? "star" : "star-outline"}
                  size={10}
                  color={GOLD}
                />
              ))}
            </View>
          ) : null}
          <Text style={styles.summaryCount}>
            {hasReviews
              ? `${formatReviewCount(displayCount)} ${displayCount === 1 ? "review" : "reviews"}`
              : "No reviews yet"}
          </Text>
        </View>

        <View style={styles.summaryRule} />

        <View style={styles.summaryCopy}>
          <Text style={styles.summaryTitle}>Verified guest reviews</Text>
          <Text style={styles.summarySub}>
            Average rating from customers who completed a booking.
          </Text>
          <View style={styles.verifiedMini}>
            <Ionicons name="checkmark-circle" size={11} color={verifiedGreen} />
            <Text style={styles.verifiedMiniText}>Every review is tied to a visit</Text>
          </View>
        </View>
      </View>

      {/* Recent reviews heading + write link */}
      <View style={styles.reviewSectionHead}>
        <Text style={styles.sectionTitle}>Recent reviews</Text>
        <TouchableOpacity
          style={styles.writeLink}
          onPress={() => setComposerOpen((prev) => !prev)}
          activeOpacity={0.72}
          accessibilityRole="button"
        >
          <Ionicons
            name={composerOpen ? "close" : "create-outline"}
            size={12}
            color={theme.primaryActive}
          />
          <Text style={styles.writeLinkText}>
            {composerOpen ? "Cancel" : "Write a review"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Composer — expands on demand */}
      {composerOpen ? (
        <View style={styles.writeReviewCard}>
          <View style={styles.writeHeaderRow}>
            <Text style={styles.writeTitle}>Your rating</Text>
            {userRating > 0 ? (
              <View style={styles.ratingBadge}>
                <Text style={styles.ratingBadgeText}>{RATING_LABELS[userRating]}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.starRatingBar}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setUserRating(star)}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
                accessibilityRole="button"
                accessibilityLabel={`${star} star${star === 1 ? "" : "s"}`}
              >
                <Ionicons
                  name={userRating > 0 && star <= userRating ? "star" : "star-outline"}
                  size={28}
                  color={userRating > 0 && star <= userRating ? GOLD : (isDark ? C.borderDark : C.border)}
                  style={{ marginHorizontal: 4 }}
                />
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={styles.textInputBox}
            placeholder="Leave your experience..."
            placeholderTextColor={theme.muted}
            value={commentText}
            onChangeText={setCommentText}
            maxLength={500}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          <View style={styles.submitBtnRow}>
            <Text style={styles.charCount}>{commentText.length}/500</Text>
            <SpringTouchable
              style={[styles.postReviewBtn, !canSubmit && styles.postReviewBtnDisabled]}
              onPress={handleSubmit}
              disabled={!canSubmit}
              scaleTo={0.96}
            >
              <Ionicons name="send" size={14} color={theme.onPrimary} style={{ marginRight: 6 }} />
              <Text style={styles.postReviewBtnText}>
                {isSubmitting ? "Submitting..." : "Submit review"}
              </Text>
            </SpringTouchable>
          </View>
        </View>
      ) : null}

      {/* Review cards */}
      <View style={styles.reviewList}>
        {visibleReviews.map((review, index) => {
          const reviewId = review._id || review.id || index;
          const reviewerName =
            review.name ||
            review.userName ||
            review.customerName ||
            review.user?.name ||
            "Customer";
          const avatar =
            review.avatar ||
            review.userAvatar ||
            review.customerAvatar ||
            review.user?.avatar ||
            review.user?.profilePicture;
          const ratingNum = Number(review.rating ?? review.score ?? 5) || 5;
          const dateValue = review.createdAt || review.date || review.time;
          const isVerified =
            review.isVerified === true ||
            review.verified === true ||
            (review.isVerified === undefined && review.verified === undefined);

          return (
            <View key={reviewId} style={styles.reviewCard}>
              <View style={styles.reviewHead}>
                {avatar ? (
                  <Image source={avatar} style={styles.avatarImage} placeholder={{ blurhash: "LKO2?U%2Tw=w]~RBVZRi};RPxuwH" }} transition={300} />
                ) : (
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{getInitials(reviewerName)}</Text>
                  </View>
                )}

                <View style={styles.reviewUser}>
                  <View style={styles.reviewNameRow}>
                    <Text style={styles.reviewName} numberOfLines={1}>{reviewerName}</Text>
                    {isVerified ? (
                      <View style={styles.verifiedBadge}>
                        <Ionicons name="checkmark" size={7} color={verifiedGreen} />
                        <Text style={styles.verifiedBadgeText}>Verified</Text>
                      </View>
                    ) : null}
                  </View>

                  <View style={styles.reviewStars}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Ionicons
                        key={star}
                        name={star <= Math.round(ratingNum) ? "star" : "star-outline"}
                        size={9}
                        color={star <= Math.round(ratingNum) ? GOLD : (isDark ? C.borderDark : C.border)}
                      />
                    ))}
                  </View>
                </View>

                <Text style={styles.reviewDate}>{formatRelativeDate(dateValue)}</Text>
              </View>

              {review.comment ? (
                <Text style={styles.reviewText}>{review.comment}</Text>
              ) : null}
            </View>
          );
        })}

        {!hasReviews ? (
          <View style={styles.emptyReviews}>
            <View style={styles.emptyReviewsIcon}>
              <Ionicons name="chatbubble-ellipses-outline" size={20} color={theme.primary} />
            </View>
            <Text style={styles.emptyReviewsTitle}>No reviews yet</Text>
            <Text style={styles.emptyReviewsCopy}>Be the first to review this salon.</Text>
          </View>
        ) : null}
      </View>

      {reviews.length > 3 ? (
        <TouchableOpacity
          style={styles.showAllBtn}
          onPress={() => setShowAll((prev) => !prev)}
          activeOpacity={0.78}
        >
          <Text style={styles.showAllText}>
            {showAll ? "Show fewer reviews" : `Show all ${reviews.length} reviews`}
          </Text>
          <Ionicons
            name={showAll ? "chevron-up" : "chevron-down"}
            size={12}
            color={theme.primaryActive}
          />
        </TouchableOpacity>
      ) : null}

      {footnoteText ? (
        <View style={styles.reviewsFootnote}>
          <Ionicons name="checkmark-circle" size={10} color={verifiedGreen} />
          <Text style={styles.reviewsFootnoteText}>{footnoteText}</Text>
        </View>
      ) : null}
    </View>
  );
}

function getStyles(theme, isDark) {
  const pinkLine = isDark ? "rgba(255,122,154,0.28)" : C.crimsonTint;
  const pinkTint = isDark ? "rgba(255,122,154,0.12)" : C.crimsonTint;
  const greenTint = isDark ? "rgba(74,222,128,0.14)" : C.successBg;
  const verifiedGreen = isDark ? C.success : GREEN;

  return StyleSheet.create({
    container: {
      paddingBottom: 20,
    },

    // Summary
    summaryCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: pinkLine,
      backgroundColor: isDark ? theme.surfaceStrong : C.bg,
    },
    scoreBlock: {
      flexShrink: 0,
      minWidth: 74,
    },
    scoreNumber: {
      fontSize: 28,
      lineHeight: 20,
      fontFamily: FF.display,
      color: theme.ink,
      letterSpacing: 0.2,
    },
    summaryStars: {
      marginTop: 6,
      flexDirection: "row",
      alignItems: "center",
      gap: 1.5,
    },
    summaryCount: {
      marginTop: 3,
      fontSize: 12,
      fontFamily: FF.body,
      color: theme.muted,
    },
    summaryRule: {
      width: 1,
      alignSelf: "stretch",
      backgroundColor: pinkLine,
      marginVertical: 2,
    },
    summaryCopy: {
      flex: 1,
      minWidth: 0,
      paddingVertical: 2,
    },
    summaryTitle: {
      fontSize: 17,
      lineHeight: 22,
      fontFamily: FF.display,
      color: theme.ink,
    },
    summarySub: {
      marginTop: 4,
      fontSize: 12,
      lineHeight: 20,
      fontFamily: FF.body,
      color: theme.muted,
    },
    verifiedMini: {
      marginTop: 6,
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
    },
    verifiedMiniText: {
      fontSize: 14,
      fontFamily: FF.bodyMedium,
      color: verifiedGreen,
    },

    // Heading
    reviewSectionHead: {
      marginTop: 18,
      marginBottom: 10,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },
    sectionTitle: {
      fontSize: 14,
      fontFamily: FF.display,
      color: theme.ink,
      letterSpacing: 0.1,
    },
    writeLink: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    writeLinkText: {
      fontSize: 18,
      fontFamily: FF.bodyMedium,
      color: theme.primaryActive,
    },

    // Composer
    writeReviewCard: {
      padding: 14,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.hairline,
      backgroundColor: theme.surface,
      marginBottom: 12,
      shadowColor: C.ink,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.25 : 0.04,
      shadowRadius: 10,
      elevation: 2,
    },
    writeHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
    },
    writeTitle: {
      fontSize: 15,
      fontFamily: FF.display,
      color: theme.ink,
    },
    ratingBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 10,
      backgroundColor: pinkTint,
    },
    ratingBadgeText: {
      fontSize: 10,
      fontFamily: FF.display,
      color: theme.primaryActive,
    },
    starRatingBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 10,
    },
    textInputBox: {
      minHeight: 78,
      padding: 12,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.hairline,
      backgroundColor: isDark ? theme.surfaceStrong : C.lifted,
      fontSize: 11,
      lineHeight: 20,
      fontFamily: FF.body,
      color: theme.ink,
    },
    submitBtnRow: {
      marginTop: 10,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
    },
    charCount: {
      fontSize: 14,
      fontFamily: FF.body,
      color: theme.muted,
    },
    postReviewBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 21,
      backgroundColor: theme.primary,
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: 0.28,
      shadowRadius: 10,
      elevation: 3,
    },
    postReviewBtnDisabled: {
      opacity: 0.4,
      shadowOpacity: 0,
      elevation: 0,
    },
    postReviewBtnText: {
      fontSize: 28,
      fontFamily: FF.display,
      color: theme.onPrimary,
    },

    // Review cards
    reviewList: {
      gap: 9,
    },
    reviewCard: {
      paddingVertical: 12,
      paddingHorizontal: 13,
      borderRadius: 15,
      borderWidth: 1,
      borderColor: theme.hairline,
      backgroundColor: theme.surface,
    },
    reviewHead: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 9,
    },
    avatar: {
      width: 33,
      height: 33,
      borderRadius: 17,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: isDark ? "rgba(255,122,154,0.18)" : C.crimsonTint,
      flexShrink: 0,
    },
    avatarImage: {
      width: 33,
      height: 33,
      borderRadius: 17,
      flexShrink: 0,
      backgroundColor: theme.surfaceStrong,
    },
    avatarText: {
      fontSize: 28,
      fontFamily: FF.display,
      color: theme.primaryActive,
      letterSpacing: 0.2,
    },
    reviewUser: {
      flex: 1,
      minWidth: 0,
      paddingTop: 1,
    },
    reviewNameRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
    },
    reviewName: {
      flexShrink: 1,
      fontSize: 28,
      fontFamily: FF.display,
      color: theme.ink,
    },
    verifiedBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 2,
      paddingHorizontal: 4,
      paddingVertical: 2,
      borderRadius: 4,
      backgroundColor: greenTint,
      flexShrink: 0,
    },
    verifiedBadgeText: {
      fontSize: 28,
      fontFamily: FF.display,
      color: verifiedGreen,
      letterSpacing: 0.2,
    },
    reviewStars: {
      marginTop: 4,
      flexDirection: "row",
      alignItems: "center",
      gap: 1,
    },
    reviewDate: {
      flexShrink: 0,
      paddingTop: 3,
      fontSize: 28,
      fontFamily: FF.body,
      color: theme.muted,
    },
    reviewText: {
      marginTop: 8,
      fontSize: 28,
      lineHeight: 20,
      fontFamily: FF.body,
      color: theme.body,
    },

    // Empty + footer
    emptyReviews: {
      alignItems: "center",
      paddingVertical: 26,
      paddingHorizontal: 20,
      borderRadius: 15,
      borderWidth: 1,
      borderColor: theme.hairline,
      backgroundColor: theme.surface,
    },
    emptyReviewsIcon: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: pinkTint,
      marginBottom: 10,
    },
    emptyReviewsTitle: {
      fontSize: 28,
      fontFamily: FF.display,
      color: theme.ink,
    },
    emptyReviewsCopy: {
      marginTop: 4,
      fontSize: 28,
      fontFamily: FF.body,
      color: theme.muted,
      textAlign: "center",
    },
    showAllBtn: {
      marginTop: 12,
      alignSelf: "center",
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: 18,
      backgroundColor: theme.surfaceStrong,
    },
    showAllText: {
      fontSize: 28,
      fontFamily: FF.bodyMedium,
      color: theme.primaryActive,
    },
    reviewsFootnote: {
      marginTop: 14,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 5,
    },
    reviewsFootnoteText: {
      fontSize: 28,
      fontFamily: FF.body,
      color: theme.muted,
    },
  });
}
