import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

/** Local notifications only (the end of a focus session). Nothing is sent to a server. */

const CHANNEL = "focus";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

/** Ask for permission only when the user switches the reminder on. */
export async function ensureNotificationPermission(): Promise<boolean> {
  try {
    if (Platform.OS === "android") {
      // Android 13+ only shows the permission prompt once a channel exists.
      await Notifications.setNotificationChannelAsync(CHANNEL, {
        name: "Focus sessions",
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }
    const current = await Notifications.getPermissionsAsync();
    if (current.status === "granted") return true;
    const asked = await Notifications.requestPermissionsAsync();
    return asked.status === "granted";
  } catch {
    return false;
  }
}

export async function scheduleSessionEnd(seconds: number): Promise<string | undefined> {
  try {
    return await Notifications.scheduleNotificationAsync({
      content: { title: "Focus session finished", body: "Pebble is fully grown. Nice work!" },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: Math.max(1, Math.round(seconds)),
        channelId: CHANNEL,
      },
    });
  } catch {
    return undefined;
  }
}

export async function cancelSessionEnd(id?: string) {
  if (!id) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch {
    // Already fired or cancelled.
  }
}
