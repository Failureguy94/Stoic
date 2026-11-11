import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { AppState } from "react-native";

/**
 * Run `fn` when the screen is shown and again whenever the app returns to the
 * front (for example after the user comes back from Android Settings).
 */
export function useForeground(fn: () => void) {
  const ref = useRef(fn);
  useLayoutEffect(() => {
    ref.current = fn;
  });

  useFocusEffect(
    useCallback(() => {
      ref.current();
    }, []),
  );

  useEffect(() => {
    const sub = AppState.addEventListener("change", (s) => s === "active" && ref.current());
    return () => sub.remove();
  }, []);
}
