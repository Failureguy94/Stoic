import { AccessibilityInfo, Alert } from "react-native";

/**
 * Strict mode refuses changes that would loosen settings (StoicDeviceModule.kt, ERR_STRICT).
 * Run a save; if strict mode refuses it, explain kindly and let the screen reload the real values.
 * Returns true when the save went through.
 */
export function tryStrictSave(save: () => void, reload: () => void): boolean {
  try {
    save();
    return true;
  } catch (e) {
    const err = e as { code?: string; message?: string };
    // Expo wraps native errors ("Call to function ... has been rejected. → Caused by: ..."): keep only our sentence.
    const sentence = err.message?.match(/Strict mode is on[^\n]*/)?.[0];
    const isStrict = err.code === "ERR_STRICT" || sentence !== undefined;
    const message = isStrict ? (sentence ?? "Strict mode is on.") : "That change couldn't be saved. Please try again.";
    Alert.alert(isStrict ? "Strict mode is on" : "Not saved", message);
    AccessibilityInfo.announceForAccessibility(message);
    reload();
    return false;
  }
}

/** "until 5:00 PM" or "until Thu 9:00 AM" when it's not today. */
export function untilText(ms: number) {
  const d = new Date(ms);
  const time = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  const sameDay = d.toDateString() === new Date().toDateString();
  return sameDay ? `until ${time}` : `until ${d.toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" })}, ${time}`;
}
