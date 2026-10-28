// src/screen/SupportScreen.jsx
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  LayoutAnimation,
  Platform,
  StatusBar,
  UIManager,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { C, FF } from "../theme";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const TOP_INSET = Platform.OS === "ios" ? 52 : (StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 36);

const FAQS_DATA = [
  {
    id: "f1",
    question: "What is HairX?",
    answer: "HairX is a premier salon booking platform connecting you with top-rated hair stylists, beauty salons, and luxury spa treatments near you.",
  },
  {
    id: "f2",
    question: "How much does this cost?",
    answer: "We provide high-end services without the high-end price. A moderate price allows us to provide the high end services you enjoy and the lower price allows you to enjoy it more often! Prices for services are subject to consultation.",
  },
  {
    id: "f3",
    question: "Do you accept paypal?",
    answer: "Yes, we accept PayPal, UPI, major Credit/Debit Cards, Net Banking, and Pay at Salon options for your convenience.",
  },
  {
    id: "f4",
    question: "Where are you located?",
    answer: "We partner with certified salons located across major cities. You can search by your live location or browse salons in your area directly on the home map.",
  },
  {
    id: "f5",
    question: "Can I just come in or do I have to make an appointment?",
    answer: "While walk-ins are accepted based on slot availability, we strongly recommend booking an appointment in advance through the app to guarantee your preferred time and stylist.",
  },
];

export default function SupportScreen({ goBack }) {
  const { isDark } = useTheme();
  const [expandedId, setExpandedId] = useState("f2"); // Default expanded "How much does this cost?" matching reference mockup

  const toggleAccordion = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(expandedId === id ? null : id);
  };

  const styles = getStyles(isDark);

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* Header Bar */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>FAQs</Text>
        <TouchableOpacity onPress={goBack} style={styles.closeBtn} activeOpacity={0.7}>
          <Ionicons name="close" size={22} color={C.ink} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.faqList}>
          {FAQS_DATA.map((item) => {
            const isExpanded = expandedId === item.id;
            return (
              <View key={item.id} style={styles.faqRow}>
                <TouchableOpacity
                  style={styles.faqQuestionRow}
                  onPress={() => toggleAccordion(item.id)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.faqQuestionText}>{item.question}</Text>
                  <Ionicons
                    name={isExpanded ? "remove" : "add"}
                    size={20}
                    color={isExpanded ? (C.muted) : (C.muted)}
                  />
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.answerContainer}>
                    <Text style={styles.answerText}>{item.answer}</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

function getStyles(isDark) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: C.bg,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingTop: TOP_INSET,
      paddingHorizontal: 24,
      paddingBottom: 16,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: C.border,
    },
    headerTitle: {
      fontFamily: FF.displayBold,
      fontSize: 22,
      color: C.ink,
      letterSpacing: 0.2,
    },
    closeBtn: {
      padding: 4,
    },
    scrollContent: {
      paddingHorizontal: 24,
      paddingTop: 8,
      paddingBottom: 40,
    },
    faqList: {
      flexDirection: "column",
    },
    faqRow: {
      paddingVertical: 18,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: C.border,
    },
    faqQuestionRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    faqQuestionText: {
      flex: 1,
      fontSize: 15,
      fontFamily: "Oswald_700Bold",
      color: C.ink,
      marginRight: 16,
      lineHeight: 21,
    },
    answerContainer: {
      paddingTop: 12,
      paddingBottom: 4,
    },
    answerText: {
      fontSize: 13.5,
      fontFamily: "Oswald_400Regular",
      color: C.muted,
      lineHeight: 20,
    },
  });
}
