// src/components/BouncyButton.jsx
import React from "react";
import { Pressable, View, StyleSheet, Platform } from "react-native";
import { PLATFORM_PRESS } from "../theme/platform";

const isAndroid = Platform.OS === "android";

export default function BouncyButton({ children, onPress, style, ...props }) {
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

  if (isAndroid) {
    return (
      <Pressable
        onPress={onPress}
        android_ripple={{ color: "rgba(0, 0, 0, 0.06)", borderless: false }}
        style={({ pressed }) => [
          pressableStyle,
          pressed ? { opacity: PLATFORM_PRESS.opacityDown } : null,
        ]}
        {...props}
      >
        <View style={style}>{children}</View>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        pressableStyle,
        pressed
          ? { opacity: PLATFORM_PRESS.opacityDown, transform: [{ scale: PLATFORM_PRESS.scaleDown }] }
          : null,
      ]}
      {...props}
    >
      <View style={style}>{children}</View>
    </Pressable>
  );
}
