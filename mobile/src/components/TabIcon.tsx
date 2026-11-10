import type { ColorValue } from "react-native";
import Svg, { Circle, Path, Rect } from "react-native-svg";

export type TabIconName = "fix" | "compare" | "focus" | "circle" | "more";

/** Simple original line icons for the tab bar (decorative: tabs also have text labels). */
export function TabIcon({ name, color, size = 26 }: { name: TabIconName; color: ColorValue; size?: number }) {
  const p = { stroke: color, strokeWidth: 2.2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, fill: "none" };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === "fix" && (
        <>
          <Circle cx="10.5" cy="10.5" r="6.5" {...p} />
          <Path d="M15.5 15.5L21 21" {...p} />
        </>
      )}
      {name === "compare" && (
        <>
          <Rect x="3" y="4" width="7" height="16" rx="2" {...p} />
          <Rect x="14" y="4" width="7" height="16" rx="2" {...p} />
        </>
      )}
      {name === "focus" && (
        <>
          <Circle cx="12" cy="13" r="8" {...p} />
          <Path d="M12 9v4l2.5 2M9.5 2.5h5" {...p} />
        </>
      )}
      {name === "circle" && (
        <>
          <Circle cx="8" cy="9" r="3" {...p} />
          <Circle cx="16.5" cy="9" r="3" {...p} />
          <Path d="M2.5 19c.6-3 2.8-4.5 5.5-4.5s4.9 1.5 5.5 4.5M14.5 14.6c3.2-.6 6.2.8 7 4.4" {...p} />
        </>
      )}
      {name === "more" && (
        <>
          <Circle cx="5" cy="12" r="1.6" fill={color} />
          <Circle cx="12" cy="12" r="1.6" fill={color} />
          <Circle cx="19" cy="12" r="1.6" fill={color} />
        </>
      )}
    </Svg>
  );
}
