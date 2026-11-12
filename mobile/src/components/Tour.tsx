import { router, usePathname, type Href } from "expo-router";
import {
  createContext,
  use,
  useEffect,
  useEffectEvent,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentRef,
  type ReactNode,
  type RefObject,
} from "react";
import {
  AccessibilityInfo,
  Animated,
  BackHandler,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { Button, ScreenScroll, T, type ScrollRefs } from "@/components/ui";
import { device, isAndroid } from "@/lib/device";
import { KEYS, readJson, writeJson } from "@/lib/storage";
import { TAB_ROUTES, placeBubble, sameRect, stepsFor, type Rect } from "@/lib/tour";
import { radius, space, useTheme } from "@/theme";

/** Space around the highlighted control. */
const PAD = 8;
const CORNER = 18;

interface Target {
  ref: RefObject<ComponentRef<typeof View> | null>;
  scroll: ScrollRefs | null;
}

interface TourApi {
  start: () => void;
  register: (id: string, target: Target) => () => void;
}

const TourContext = createContext<TourApi | null>(null);

/** `start()` replays the tour (from More). */
export const useTour = () => use(TourContext);

/** Marks a control the tour can point at. Renders a plain View around it. */
export function TourTarget({ id, children, style }: { id: string; children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const tour = use(TourContext);
  const scroll = use(ScreenScroll);
  const ref = useRef<ComponentRef<typeof View>>(null);
  useLayoutEffect(() => tour?.register(id, { ref, scroll }), [tour, id, scroll]);
  return (
    <View ref={ref} collapsable={false} style={style}>
      {children}
    </View>
  );
}

/** Wraps the app. Starts the tour the first time STOIC is opened. */
export function TourProvider({ children }: { children: ReactNode }) {
  const steps = useMemo(() => stepsFor(isAndroid && !!device), []);
  const [targets] = useState(() => new Map<string, Target>());
  const [index, setIndex] = useState<number | null>(null);

  useEffect(() => {
    readJson(KEYS.tourDone, false).then((done) => {
      if (!done) setIndex(0);
    });
  }, []);

  const api = useMemo<TourApi>(
    () => ({
      start: () => setIndex(0),
      register: (id, target) => {
        targets.set(id, target);
        return () => {
          if (targets.get(id) === target) targets.delete(id);
        };
      },
    }),
    [targets],
  );

  const end = () => {
    setIndex(null);
    writeJson(KEYS.tourDone, true);
    go("/", "");
  };

  return (
    <TourContext value={api}>
      {children}
      {index !== null ? (
        <Overlay
          key="tour"
          steps={steps}
          index={index}
          targets={targets}
          onIndex={(i) => (i >= steps.length ? end() : setIndex(Math.max(0, i)))}
          onEnd={end}
        />
      ) : null}
    </TourContext>
  );
}

/** Open a step's screen, keeping at most one page on top of the tabs. */
function go(route: string, from: string) {
  if (route === from) return;
  if (TAB_ROUTES.has(route)) {
    if (router.canDismiss()) router.dismissAll();
    router.navigate(route as Href);
  } else if (TAB_ROUTES.has(from) || !router.canGoBack()) {
    router.push(route as Href);
  } else {
    router.replace(route as Href);
  }
}

function Overlay({
  steps,
  index,
  targets,
  onIndex,
  onEnd,
}: {
  steps: ReturnType<typeof stepsFor>;
  index: number;
  targets: Map<string, Target>;
  onIndex: (i: number) => void;
  onEnd: () => void;
}) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { width: W, height: H } = useWindowDimensions();
  const pathname = usePathname();
  const step = steps[index];
  const [hole, setHole] = useState<Rect | null>(null);
  // Steps without a highlight show straight away; the others once it has been found.
  const [found, setFound] = useState(false);
  const ready = !step.target || found;
  const [bubbleH, setBubbleH] = useState(200);
  const direction = useRef(1);
  const [pulse] = useState(() => new Animated.Value(1));

  const move = (by: number) => {
    direction.current = by;
    setFound(false);
    setHole(null);
    onIndex(index + by);
  };

  // Open the step's screen.
  const open = useEffectEvent(() => go(step.route, pathname));
  useEffect(() => open(), [index]);

  // Find the highlighted control: scroll it into view, then keep measuring it (content
  // loads and moves things around). Optional steps are skipped if it never shows up.
  const skip = useEffectEvent(() => onIndex(index + direction.current));
  useEffect(() => {
    if (!step.target) return;
    let alive = true;
    let misses = 0;
    let scrolled = false;
    const tick = () => {
      const target = targets.get(step.target!);
      const view = target?.ref.current;
      if (!view) {
        misses += 1;
        if (misses === 8) {
          if (step.optional) skip();
          else setFound(true); // show the bubble without a highlight rather than nothing
        }
        return;
      }
      if (!scrolled) {
        scrolled = true;
        const content = target.scroll?.content.current;
        const scroller = target.scroll?.scroll.current;
        if (content && scroller) {
          view.measureLayout(content, (_x, y) => scroller.scrollTo({ y: Math.max(0, y - space.lg), animated: false }), () => {});
          return; // measure on the next tick, after the scroll
        }
      }
      view.measureInWindow((x, y, width, height) => {
        if (!alive || (width === 0 && height === 0)) return;
        const r = { x, y, width, height };
        setHole((prev) => (sameRect(prev, r) ? prev : r));
        setFound(true);
      });
    };
    const first = setTimeout(tick, 350);
    const every = setInterval(tick, 300);
    return () => {
      alive = false;
      clearTimeout(first);
      clearInterval(every);
    };
  }, [index, step, targets]);

  // Read the step out for TalkBack once it's on screen.
  useEffect(() => {
    if (ready) AccessibilityInfo.announceForAccessibility(`${step.title}. ${step.body}`);
  }, [ready, step]);

  // Android back goes to the previous step instead of leaving the tour half-way.
  const back = useEffectEvent(() => {
    if (index > 0) move(-1);
    return true;
  });
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => back());
    return () => sub.remove();
  }, []);

  // A soft pulse on the highlight ring, unless animations are off.
  useEffect(() => {
    let loop: Animated.CompositeAnimation | null = null;
    AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (reduce) return;
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 0.35, duration: 700, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        ]),
      );
      loop.start();
    });
    return () => loop?.stop();
  }, [pulse]);

  const r = hole && ready ? { x: hole.x - PAD, y: hole.y - PAD, width: hole.width + 2 * PAD, height: hole.height + 2 * PAD } : null;
  const minTop = insets.top + space.sm;
  const maxBottom = H - insets.bottom - space.sm;
  const place = placeBubble(r, bubbleH, minTop, maxBottom);
  const last = index === steps.length - 1;
  const arrowX = r ? Math.min(Math.max(r.x + r.width / 2 - 10, space.lg + CORNER), W - space.lg - CORNER - 20) : 0;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Svg width={W} height={H} style={StyleSheet.absoluteFill} pointerEvents="none">
        <Path d={`M0 0H${W}V${H}H0Z${r ? roundRect(r, CORNER) : ""}`} fill="rgba(18,12,36,0.74)" fillRule="evenodd" />
      </Svg>

      {/* Taps outside the highlight do nothing; the highlighted control itself can be used. */}
      {r ? (
        <>
          <Blocker style={{ left: 0, top: 0, width: W, height: Math.max(0, r.y) }} />
          <Blocker style={{ left: 0, top: r.y + r.height, width: W, bottom: 0 }} />
          <Blocker style={{ left: 0, top: r.y, width: Math.max(0, r.x), height: r.height }} />
          <Blocker style={{ left: r.x + r.width, top: r.y, right: 0, height: r.height }} />
          <Animated.View
            pointerEvents="none"
            style={{
              position: "absolute",
              left: r.x,
              top: r.y,
              width: r.width,
              height: r.height,
              borderRadius: CORNER,
              borderWidth: 3,
              borderColor: "#ffffff",
              opacity: pulse,
            }}
          />
        </>
      ) : (
        <Blocker style={StyleSheet.absoluteFill} />
      )}

      {ready ? (
        <View
          accessibilityViewIsModal
          onLayout={(e) => setBubbleH(e.nativeEvent.layout.height)}
          style={{
            position: "absolute",
            left: space.lg,
            right: space.lg,
            top: place.top,
            backgroundColor: t.surface,
            borderRadius: radius.card,
            borderWidth: 2,
            borderColor: t.brand,
            padding: space.lg,
            gap: space.sm,
            elevation: 10,
          }}
        >
          {place.arrow ? (
            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                left: arrowX - space.lg,
                [place.arrow === "up" ? "top" : "bottom"]: -11,
                width: 20,
                height: 20,
                backgroundColor: t.surface,
                borderColor: t.brand,
                borderLeftWidth: 2,
                borderTopWidth: 2,
                transform: [{ rotate: place.arrow === "up" ? "45deg" : "225deg" }],
              }}
            />
          ) : null}
          <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
            <Text style={{ fontSize: 24 }} importantForAccessibility="no">
              {step.icon}
            </Text>
            <T v="h3" style={{ flex: 1 }}>
              {step.title}
            </T>
            <T v="small" muted accessibilityLabel={`Step ${index + 1} of ${steps.length}`}>
              {index + 1}/{steps.length}
            </T>
          </View>
          <T>{step.body}</T>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: space.xs }}>
            {last ? <View /> : <Button kind="quiet" label="Skip tour" onPress={onEnd} />}
            <View style={{ flexDirection: "row", gap: space.sm }}>
              {index > 0 && !last ? <Button kind="outline" label="Back" onPress={() => move(-1)} /> : null}
              <Button label={last ? "Let's go" : index === 0 ? "Show me" : "Next"} onPress={() => (last ? onEnd() : move(1))} />
            </View>
          </View>
          <Progress index={index} total={steps.length} />
        </View>
      ) : null}
    </View>
  );
}

function Blocker({ style }: { style: StyleProp<ViewStyle> }) {
  return <View style={[{ position: "absolute" }, style]} onStartShouldSetResponder={() => true} />;
}

function Progress({ index, total }: { index: number; total: number }) {
  const t = useTheme();
  return (
    <View importantForAccessibility="no-hide-descendants" style={{ flexDirection: "row", gap: 4, justifyContent: "center" }}>
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          style={{ width: i === index ? 16 : 6, height: 6, borderRadius: 3, backgroundColor: i <= index ? t.brand : t.line }}
        />
      ))}
    </View>
  );
}

/** A rounded-rectangle sub-path, drawn the opposite way round so even-odd fill cuts it out. */
function roundRect({ x, y, width: w, height: h }: Rect, c: number) {
  const k = Math.min(c, w / 2, h / 2);
  return (
    `M${x + k} ${y}H${x + w - k}Q${x + w} ${y} ${x + w} ${y + k}V${y + h - k}Q${x + w} ${y + h} ${x + w - k} ${y + h}` +
    `H${x + k}Q${x} ${y + h} ${x} ${y + h - k}V${y + k}Q${x} ${y} ${x + k} ${y}Z`
  );
}

