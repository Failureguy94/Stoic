import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

/**
 * Small JSON store on the phone (AsyncStorage). Nothing here is sent anywhere.
 * `value` is undefined while loading, then the stored value or the fallback.
 */
const listeners = new Map<string, Set<() => void>>();

export async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export async function writeJson<T>(key: string, value: T | null) {
  try {
    if (value === null) await AsyncStorage.removeItem(key);
    else await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or unavailable: keep working for this session.
  }
  listeners.get(key)?.forEach((l) => l());
}

export function useStored<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T | undefined>(undefined);

  useEffect(() => {
    let alive = true;
    const load = () => readJson(key, fallback).then((v) => alive && setValue(v));
    load();
    if (!listeners.has(key)) listeners.set(key, new Set());
    listeners.get(key)!.add(load);
    return () => {
      alive = false;
      listeners.get(key)?.delete(load);
    };
    // fallback is a constant per call site
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const save = useCallback(
    (next: T | null) => {
      setValue(next === null ? fallback : next);
      return writeJson(key, next);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key],
  );

  return [value, save] as const;
}

export const KEYS = {
  pledge: "stoic.pledge.v1",
  focusLog: "stoic.focus.log.v1",
  focusActive: "stoic.focus.active.v1",
  focusPrefs: "stoic.focus.prefs.v1",
  scoreGoals: "stoic.score.goals.v1",
  scoreHistory: "stoic.score.history.v1",
} as const;
