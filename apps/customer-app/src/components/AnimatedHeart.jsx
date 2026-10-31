import React, { useEffect, useRef } from "react";
import { StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withDelay,
  interpolateColor,
} from "react-native-reanimated";
import { triggerHaptic } from "../theme/appleMotion";

const SPRING_POP = { damping: 6, stiffness: 600, mass: 0.3 };
const SPRING_SETTLE = { damping: 12, stiffness: 200, mass: 0.5 };

export default function AnimatedHeart({ filled, size = 20, color = "#FF4D6A", emptyColor = "#FFFFFF" }) {
  const progress = useSharedValue(filled ? 1 : 0);
  const scale = useSharedValue(1);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (filled) {
      triggerHaptic("medium");
      scale.value = withSequence(
        withSpring(0.6, { damping: 20, stiffness: 800 }),
        withSpring(1.3, SPRING_POP),
        withSpring(1, SPRING_SETTLE)
      );
      progress.value = withDelay(50, withSpring(1, SPRING_SETTLE));
    } else {
      triggerHaptic("light");
      scale.value = withSpring(1, SPRING_SETTLE);
      progress.value = withSpring(0, SPRING_SETTLE);
    }
  }, [filled]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <Ionicons
        name={filled ? "heart" : "heart-outline"}
        size={size}
        color={filled ? color : emptyColor}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
});
