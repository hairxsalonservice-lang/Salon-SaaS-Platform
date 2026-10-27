import React, { useEffect, useMemo, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C, S, FS, FW, R, TYPO } from "../theme";
import { toLocalDateStr } from "../services/apiClient";
import AppleTouchable from "./AppleTouchable";
import { useTheme } from "../context/ThemeContext";

function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const [h, m] = String(timeStr).trim().split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

function minutesToTime(totalMins) {
  const h = Math.floor(totalMins / 60) % 24;
  const m = totalMins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function isSlotFree(slot) {
  const st = (slot.status || "").toUpperCase();
  return (st === "" || st === "AVAILABLE") && slot.isAvailable !== false;
}

// "YYYY-MM-DD" as a local date (new Date("YYYY-MM-DD") parses as UTC midnight)
function parseLocalDate(str) {
  const [y, m, d] = String(str || "").split("-").map(Number);
  const date = new Date(y, (m || 1) - 1, d || 1);
  return isNaN(date.valueOf()) ? new Date() : date;
}

export default function SlotPicker({
  slots,
  selectedSlotId,
  selectedSlot,
  serviceDurationMinutes = 30,
  onSelectSlot,
  selectedDate,
  onSelectDate,
}) {
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => getStyles(theme, isDark), [theme, isDark]);
  const currentSlotId = selectedSlotId || selectedSlot?._id || selectedSlot?.id || (typeof selectedSlot === "string" ? selectedSlot : null);

  const [timeTab, setTimeTab] = useState("Morning");

  const uniqueSlots = useMemo(() => {
    if (!slots || !Array.isArray(slots)) return [];
    const map = new Map();
    slots.forEach((s) => {
      const timeKey = s.startTime || s.time;
      if (!timeKey) return;
      if (!map.has(timeKey)) {
        map.set(timeKey, s);
      } else {
        const existing = map.get(timeKey);
        if (!isSlotFree(existing) && isSlotFree(s)) {
          map.set(timeKey, s);
        }
      }
    });

    const list = Array.from(map.values());
    list.sort((a, b) => timeToMinutes(a.startTime || a.time) - timeToMinutes(b.startTime || b.time));
    return list;
  }, [slots]);

  // Minutes since midnight now, but only when the selected date is today (otherwise nothing is "past")
  const isToday = selectedDate === toLocalDateStr(new Date());
  const [nowTick, setNowTick] = useState(0);
  useEffect(() => {
    if (!isToday) return;
    const t = setInterval(() => setNowTick((n) => n + 1), 60000);
    return () => clearInterval(t);
  }, [isToday]);
  const nowMins = useMemo(() => {
    if (!isToday) return -1;
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  }, [isToday, nowTick]);

  const slotAvailabilityMap = useMemo(() => {
    const map = new Map();
    const duration = serviceDurationMinutes > 0 ? serviceDurationMinutes : 30;
    const freeByStart = new Map();
    uniqueSlots.forEach((s) => {
      if (isSlotFree(s)) freeByStart.set(timeToMinutes(s.startTime || s.time), s);
    });

    uniqueSlots.forEach((slot) => {
      const slotId = slot._id || slot.id;
      const startMins = timeToMinutes(slot.startTime || slot.time);
      const targetEndMins = startMins + duration;
      const targetEndTimeStr = minutesToTime(targetEndMins);

      if (!isSlotFree(slot) || startMins <= nowMins) {
        map.set(slotId, { isBooked: true, calculatedEndTime: slot.endTime });
        return;
      }

      // Walk back-to-back free slots from this start until the service fits.
      // Uses each slot's real end time (slots aren't always 30 min) and stops at any gap or booked slot.
      const chain = [];
      let cursor = startMins;
      while (cursor < targetEndMins) {
        const next = freeByStart.get(cursor);
        if (!next) break;
        chain.push(next);
        const nextEnd = next.endTime ? timeToMinutes(next.endTime) : cursor + 30;
        if (!(nextEnd > cursor)) break;
        cursor = nextEnd;
      }
      const isValid = cursor >= targetEndMins;

      map.set(slotId, {
        isBooked: !isValid,
        calculatedEndTime: targetEndTimeStr,
        consecutiveSlots: chain,
      });
    });

    return map;
  }, [uniqueSlots, serviceDurationMinutes, nowMins]);

  const dates = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const isoStr = toLocalDateStr(d);
    const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
    const dayNum = d.getDate();
    return { isoStr, dayName, dayNum, dateObj: d };
  });

  const selectedDateObj = useMemo(() => parseLocalDate(selectedDate), [selectedDate]);

  const currentMonthYear = selectedDateObj.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const tabOf = (slot) => {
    const mins = timeToMinutes(slot.startTime || slot.time);
    return mins < 12 * 60 ? "Morning" : mins < 17 * 60 ? "Afternoon" : "Evening";
  };
  useEffect(() => {
    const firstOpen = uniqueSlots.find((s) => !slotAvailabilityMap.get(s._id || s.id)?.isBooked);
    if (firstOpen) setTimeTab(tabOf(firstOpen));
    // only when the day's slots change, not on every tab tap
  }, [uniqueSlots]);

  const filteredSlots = uniqueSlots.filter(slot => {
    const slotMins = timeToMinutes(slot.startTime || slot.time);
    if (timeTab === "Morning") return slotMins < 12 * 60;
    if (timeTab === "Afternoon") return slotMins >= 12 * 60 && slotMins < 17 * 60;
    if (timeTab === "Evening") return slotMins >= 17 * 60;
    return false;
  });

  return (
    <View style={styles.container}>
      <View style={styles.dateHeaderRow}>
        <Text style={styles.sectionHeading}>Select Date</Text>
        <Text style={styles.monthYearText}>{currentMonthYear} &gt;</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.dateList}
        contentContainerStyle={styles.dateListContent}
      >
        {dates.map((d) => {
          const isSelected = selectedDate === d.isoStr;
          return (
            <AppleTouchable
              key={d.isoStr}
              style={[styles.dateCard, isSelected && styles.dateCardSelected]}
              onPress={() => onSelectDate(d.isoStr)}
              scaleTo={0.94}
              hapticType="selection"
            >
              <Text style={[styles.dateWeek, isSelected && styles.dateWeekSelected]}>
                {d.dayName}
              </Text>
              <Text style={[styles.dateNum, isSelected && styles.dateNumSelected]}>
                {d.dayNum}
              </Text>
            </AppleTouchable>
          );
        })}
      </ScrollView>

      <View style={[styles.sectionHeader, { marginTop: 24 }]}>
        <Text style={styles.sectionHeading}>Select Time</Text>
      </View>

      <View style={styles.timeTabs}>
        {["Morning", "Afternoon", "Evening"].map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.timeTabBtn, timeTab === tab && styles.timeTabBtnActive]}
            onPress={() => setTimeTab(tab)}
            activeOpacity={0.7}
          >
            <Text style={[styles.timeTabTxt, timeTab === tab && styles.timeTabTxtActive]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {(!filteredSlots || filteredSlots.length === 0) ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No available slots for {timeTab.toLowerCase()}.</Text>
        </View>
      ) : (
        <View style={styles.slotGrid}>
          {filteredSlots.map((slot) => {
            const slotId = slot._id || slot.id;
            const availability = slotAvailabilityMap.get(slotId);
            const isBooked = availability ? availability.isBooked : false;
            const displayEndTime = availability?.calculatedEndTime || slot.endTime;

            const isSelected =
              (currentSlotId && currentSlotId === slotId) ||
              (selectedSlot && selectedSlot.startTime && selectedSlot.startTime === slot.startTime);

            const handlePress = () => {
              if (isBooked) return;
              onSelectSlot({ ...slot, endTime: displayEndTime });
            };

            return (
              <AppleTouchable
                key={slotId}
                disabled={isBooked}
                style={[
                  styles.slotChip,
                  isBooked && styles.slotChipBooked,
                  isSelected && styles.slotChipSelected,
                ]}
                onPress={handlePress}
                scaleTo={isBooked ? 1 : 0.94}
                hapticType={isBooked ? "none" : "selection"}
              >
                <Text
                  numberOfLines={1}
                  style={[
                    styles.slotStart,
                    isBooked && styles.slotStartBooked,
                    isSelected && styles.slotStartSelected,
                  ]}
                >
                  {formatAMPM(slot.startTime || slot.time)}
                </Text>
              </AppleTouchable>
            );
          })}
        </View>
      )}
    </View>
  );
}

function formatAMPM(timeStr) {
  if (!timeStr) return "";
  let [h, m] = String(timeStr).trim().split(":").map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  h = h ? h : 12; 
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")} ${ampm}`;
}

function getStyles(theme, isDark) {
  const inkColor = theme?.ink || (isDark ? "#F0EDF0" : C.ink);
  const mutedColor = theme?.muted || (isDark ? "#908C96" : C.muted);
  const cardBg = theme?.surface || (isDark ? "#1C1C26" : "#FFFFFF");
  const borderColor = theme?.hairline || (isDark ? "rgba(255,255,255,0.12)" : C.border);
  const liftedBg = theme?.canvasSoft || (isDark ? "#1C1C26" : C.lifted);
  const mainColor = theme?.primary || C.main;

  return StyleSheet.create({
    container: {
      paddingBottom: 20,
    },
    dateHeaderRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    },
    sectionHeading: {
      fontSize: 16,
      fontFamily: "Oswald_700Bold",
      color: inkColor,
    },
    monthYearText: {
      fontSize: 14,
      fontFamily: "Oswald_500Medium",
      color: mutedColor,
    },
    dateList: {
      flexDirection: "row",
      flexGrow: 0,
    },
    dateListContent: {
      gap: 12,
      paddingVertical: 4,
    },
    dateCard: {
      width: 58,
      height: 70,
      borderRadius: 12,
      backgroundColor: cardBg,
      borderWidth: 1,
      borderColor: borderColor,
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
    },
    dateCardSelected: {
      backgroundColor: mainColor,
      borderColor: mainColor,
    },
    dateWeek: {
      fontSize: 13,
      color: mutedColor,
      fontFamily: "Oswald_500Medium",
    },
    dateWeekSelected: {
      color: "#FFFFFF",
      fontFamily: "Oswald_600SemiBold",
    },
    dateNum: {
      fontSize: 16,
      fontFamily: "Oswald_600SemiBold",
      color: inkColor,
    },
    dateNumSelected: {
      color: "#FFFFFF",
      fontFamily: "Oswald_700Bold",
    },
    timeTabs: {
      flexDirection: "row",
      backgroundColor: liftedBg,
      borderRadius: 12,
      padding: 4,
      marginBottom: 16,
      marginTop: 12,
    },
    timeTabBtn: {
      flex: 1,
      paddingVertical: 10,
      alignItems: "center",
      borderRadius: 8,
    },
    timeTabBtnActive: {
      backgroundColor: mainColor,
    },
    timeTabTxt: {
      fontSize: 14,
      fontFamily: "Oswald_500Medium",
      color: mutedColor,
    },
    timeTabTxtActive: {
      color: "#FFFFFF",
      fontFamily: "Oswald_600SemiBold",
    },
    slotGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
    },
    slotChip: {
      width: "31.3%",
      height: 48,
      borderRadius: 8,
      backgroundColor: cardBg,
      borderWidth: 1,
      borderColor: borderColor,
      alignItems: "center",
      justifyContent: "center",
    },
    slotChipSelected: {
      backgroundColor: isDark ? "rgba(255, 96, 130, 0.16)" : (C.lifted || "#F7F3F4"),
      borderColor: mainColor,
    },
    slotChipBooked: {
      backgroundColor: isDark ? "#161620" : cardBg,
      borderColor: borderColor,
      opacity: 0.5,
    },
    slotStart: {
      fontSize: 13,
      fontFamily: "Oswald_600SemiBold",
      color: inkColor,
    },
    slotStartSelected: {
      color: mainColor,
    },
    slotStartBooked: {
      color: mutedColor,
      textDecorationLine: "line-through",
    },
    emptyContainer: {
      padding: 20,
      alignItems: "center",
      justifyContent: "center",
    },
    emptyText: {
      color: mutedColor,
      fontSize: 14,
    },
  });
}