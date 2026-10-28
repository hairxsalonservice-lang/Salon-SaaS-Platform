// src/components/SpringTouchable.jsx
import React from "react";
import { Pressable, StyleSheet, Platform } from "react-native";
import { triggerHaptic } from "../theme/appleMotion";
import { PLATFORM_PRESS } from "../theme/platform";

const isAndroid = Platform.OS === "android";

export default function SpringTouchable({
  children,
  onPress,
  style,
  hapticType = "light",
  disabled = false,
  rippleColor,
  ...props
}) {
  const handlePress = (e) => {
    if (disabled) return;
    triggerHaptic(hapticType);
    if (onPress) onPress(e);
  };

  const flatStyle = StyleSheet.flatten(style) || {};

  if (isAndroid) {
    return (
      <Pressable
        onPress={handlePress}
        disabled={disabled}
        android_ripple={{
          color: rippleColor || "rgba(0, 0, 0, 0.08)",
          borderless: false,
        }}
        style={({ pressed }) => [
          flatStyle,
          pressed && !disabled ? { opacity: PLATFORM_PRESS.opacityDown } : null,
        ]}
        {...props}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      style={({ pressed }) => [
        flatStyle,
        pressed && !disabled
          ? { opacity: PLATFORM_PRESS.opacityDown, transform: [{ scale: PLATFORM_PRESS.scaleDown }] }
          : null,
      ]}
      {...props}
    >
      {children}
    </Pressable>
  );
}
