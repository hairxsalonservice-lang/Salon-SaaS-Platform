import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withSpring,
  withDelay,
  withTiming,
  withSequence,
  Easing,
} from "react-native-reanimated";
import Svg, { Circle, Path } from "react-native-svg";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);

const SPRING_CONFIG = { damping: 12, stiffness: 200, mass: 0.6 };

export default function SuccessAnimation({
  size = 80,
  color = "#34D399",
  bgColor = "rgba(52, 211, 153, 0.12)",
  delay = 0,
  onComplete,
}) {
  const circleScale = useSharedValue(0);
  const checkProgress = useSharedValue(0);
  const outerScale = useSharedValue(0);
  const outerOpacity = useSharedValue(0);

  useEffect(() => {
    outerScale.value = withDelay(
      delay,
      withSequence(
        withSpring(1.2, { damping: 8, stiffness: 300 }),
        withSpring(1, SPRING_CONFIG)
      )
    );
    outerOpacity.value = withDelay(delay, withSpring(1, SPRING_CONFIG));

    circleScale.value = withDelay(
      delay + 100,
      withSpring(1, SPRING_CONFIG)
    );

    checkProgress.value = withDelay(
      delay + 300,
      withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) }, (finished) => {
        if (finished && onComplete) {
          onComplete();
        }
      })
    );
  }, [delay]);

  const outerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: outerScale.value }],
    opacity: outerOpacity.value,
  }));

  const circleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: circleScale.value }],
  }));

  const r = size / 2;
  const checkPath = `M${r * 0.35} ${r * 1.0} L${r * 0.8} ${r * 1.35} L${r * 1.6} ${r * 0.65}`;
  const checkLength = size * 1.2;

  const checkProps = useAnimatedProps(() => ({
    strokeDashoffset: checkLength * (1 - checkProgress.value),
  }));

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Animated.View
        style={[
          styles.outerRing,
          { width: size * 1.3, height: size * 1.3, borderRadius: size * 0.65, backgroundColor: bgColor },
          outerStyle,
        ]}
      />
      <Animated.View style={[styles.circle, circleStyle]}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Circle cx={r} cy={r} r={r} fill={color} />
          <AnimatedPath
            d={checkPath}
            stroke="#FFFFFF"
            strokeWidth={size * 0.08}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            strokeDasharray={checkLength}
            animatedProps={checkProps}
          />
        </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  outerRing: {
    position: "absolute",
  },
  circle: {
    position: "absolute",
  },
});
