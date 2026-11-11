import { device } from "@/lib/device";
import { dayKey } from "@/lib/week";

/**
 * Today's screen time in ms, the same number the "My screen time" page shows.
 * With "Keep my own record" on, STOIC's own record wins: Android forgets the
 * history of apps that are uninstalled, STOIC's add-only record does not.
 */
export async function todayScreenMs(): Promise<number> {
  if (!device) return 0;
  if (device.isLogEnabled() && device.hasUsageAccess()) {
    await device.recordSnapshotNow();
    const today = (await device.getDayRecords()).find((d) => d.day === dayKey());
    if (today) return today.totalMs;
  }
  const apps = await device.getUsageToday();
  return apps.reduce((sum, a) => sum + a.ms, 0);
}
