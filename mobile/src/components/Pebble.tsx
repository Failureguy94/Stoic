import { useEffect, useState } from "react";
import { AccessibilityInfo, Animated, Easing } from "react-native";
import Svg, { Circle, Ellipse, G, Path, Text as SvgText } from "react-native-svg";
import { useTheme } from "@/theme";

export type Mood = "calm" | "happy" | "sleepy" | "cheer";

/**
 * Pebble: STOIC's mascot, a calm little stone. Same drawing as the website
 * (components/Pebble.tsx). Always decorative, so hidden from screen readers.
 */
export function Pebble({ mood = "calm", size = 120, float = false }: { mood?: Mood; size?: number; float?: boolean }) {
  const t = useTheme();
  const [y] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!float) return;
    let loop: Animated.CompositeAnimation | undefined;
    let cancelled = false;
    // Respect the system "remove animations" setting.
    AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (reduce || cancelled) return;
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(y, { toValue: -6, duration: 2000, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(y, { toValue: 0, duration: 2000, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        ]),
      );
      loop.start();
    });
    return () => {
      cancelled = true;
      loop?.stop();
    };
  }, [float, y]);

  const smiling = mood === "happy" || mood === "cheer";
  return (
    <Animated.View
      style={{ transform: [{ translateY: y }] }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Svg width={size} height={size * 0.82} viewBox="0 0 120 98">
        <Ellipse cx="60" cy="92" rx="38" ry="5" fill={t.line} />
        <Path
          d="M14 58c0-27 20-48 49-48 27 0 45 18 45 43 0 22-16 34-46 34C31 87 14 78 14 58z"
          fill={t.lavender}
          stroke={t.ink}
          strokeWidth="3"
        />
        <Path d="M36 28c6-6 14-9 22-9" stroke={t.surface} strokeWidth="4" strokeLinecap="round" fill="none" />
        <Ellipse cx="38" cy="60" rx="7" ry="4" fill={t.rose} />
        <Ellipse cx="84" cy="60" rx="7" ry="4" fill={t.rose} />
        {mood === "sleepy" ? (
          <G stroke={t.ink} strokeWidth="3" strokeLinecap="round" fill="none">
            <Path d="M42 50q5 4 10 0" />
            <Path d="M70 50q5 4 10 0" />
          </G>
        ) : smiling ? (
          <G stroke={t.ink} strokeWidth="3" strokeLinecap="round" fill="none">
            <Path d="M42 51q5-6 10 0" />
            <Path d="M70 51q5-6 10 0" />
          </G>
        ) : (
          <G fill={t.ink}>
            <Circle cx="47" cy="49" r="3.6" />
            <Circle cx="75" cy="49" r="3.6" />
          </G>
        )}
        {mood === "cheer" ? (
          <Path d="M53 61q8 9 16 0z" fill={t.ink} />
        ) : mood === "sleepy" ? (
          <Circle cx="61" cy="63" r="2.5" fill={t.ink} />
        ) : (
          <Path d="M54 61q7 6 14 0" stroke={t.ink} strokeWidth="3" strokeLinecap="round" fill="none" />
        )}
        {mood === "sleepy" ? (
          <G fill={t.muted}>
            <SvgText x="92" y="22" fontSize="12" fontWeight="700">
              z
            </SvgText>
            <SvgText x="101" y="12" fontSize="9" fontWeight="700">
              z
            </SvgText>
          </G>
        ) : null}
        {mood === "cheer" ? (
          <G stroke={t.brand} strokeWidth="3" strokeLinecap="round">
            <Path d="M18 18l5 5M10 34h7M28 8v7" />
            <Path d="M102 18l-5 5M110 34h-7M92 8v7" />
          </G>
        ) : null}
      </Svg>
    </Animated.View>
  );
}
