import React, { useCallback } from "react";
import { Pressable, StyleSheet, Platform } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { triggerHaptic } from "../theme/appleMotion";
import { PLATFORM_PRESS } from "../theme/platform";

const isAndroid = Platform.OS === "android";

const SPRING_DOWN = { damping: 15, stiffness: 400, mass: 0.4 };
const SPRING_UP = { damping: 12, stiffness: 300, mass: 0.4 };

export default function SpringTouchable({
  children,
  onPress,
  style,
  hapticType = "light",
  disabled = false,
  rippleColor,
  activeScale,
  ...props
}) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const scaleTarget = activeScale ?? (isAndroid ? 0.985 : PLATFORM_PRESS.scaleDown);

  const onPressIn = useCallback(() => {
    if (disabled) return;
    scale.value = withSpring(scaleTarget, SPRING_DOWN);
    opacity.value = withSpring(isAndroid ? 0.95 : 0.85, SPRING_DOWN);
  }, [disabled, scaleTarget]);

  const onPressOut = useCallback(() => {
    scale.value = withSpring(1, SPRING_UP);
    opacity.value = withSpring(1, SPRING_UP);
  }, []);

  const handlePress = useCallback(
    (e) => {
      if (disabled) return;
      triggerHaptic(hapticType);
      if (onPress) onPress(e);
    },
    [disabled, hapticType, onPress]
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const flatStyle = StyleSheet.flatten(style) || {};

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={disabled}
      android_ripple={
        isAndroid
          ? { color: rippleColor || "rgba(0, 0, 0, 0.08)", borderless: false }
          : undefined
      }
      {...props}
    >
      <Animated.View style={[flatStyle, animatedStyle]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
