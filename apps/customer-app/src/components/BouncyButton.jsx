import React, { useCallback } from "react";
import { Pressable, View, StyleSheet, Platform } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { PLATFORM_PRESS } from "../theme/platform";
import { triggerHaptic } from "../theme/appleMotion";

const isAndroid = Platform.OS === "android";

const SPRING_DOWN = { damping: 15, stiffness: 400, mass: 0.4 };
const SPRING_UP = { damping: 12, stiffness: 300, mass: 0.4 };

export default function BouncyButton({
  children,
  onPress,
  style,
  activeScale,
  haptic = "light",
  ...props
}) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const scaleTarget = activeScale ?? (isAndroid ? 0.985 : PLATFORM_PRESS.scaleDown);

  const onPressIn = useCallback(() => {
    if (haptic) triggerHaptic(haptic);
    scale.value = withSpring(scaleTarget, SPRING_DOWN);
    opacity.value = withSpring(isAndroid ? 0.95 : 0.85, SPRING_DOWN);
  }, [scaleTarget, haptic]);

  const onPressOut = useCallback(() => {
    scale.value = withSpring(1, SPRING_UP);
    opacity.value = withSpring(1, SPRING_UP);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const flatStyle = StyleSheet.flatten(style) || {};
  const isAbsolute = flatStyle.position === "absolute";
  const pressableStyle = isAbsolute
    ? {
        position: "absolute",
        top: flatStyle.top,
        left: flatStyle.left,
        right: flatStyle.right,
        bottom: flatStyle.bottom,
        zIndex: flatStyle.zIndex,
      }
    : null;

  return (
    <Pressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      android_ripple={
        isAndroid
          ? { color: "rgba(0, 0, 0, 0.06)", borderless: false }
          : undefined
      }
      style={pressableStyle}
      {...props}
    >
      <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>
    </Pressable>
  );
}
