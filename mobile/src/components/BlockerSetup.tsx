import { B, Bullets, Button, Card, T } from "@/components/ui";
import { device } from "@/lib/device";
import { useTheme } from "@/theme";

/**
 * Status of STOIC's accessibility service, which shows every pause, limit, focus and
 * schedule screen. Shared by the Limits and Schedules screens.
 */
export function BlockerSetupCard({ enabled, onLabel }: { enabled: boolean | null; onLabel: string }) {
  const t = useTheme();
  if (enabled === null || !device) return null;
  if (enabled) {
    return (
      <Card tint="mint">
        <T v="label" color={t.goodInk}>
          ✓ {onLabel}
        </T>
        <T v="small">To switch everything off at once, turn STOIC off in Android&apos;s Accessibility settings.</T>
      </Card>
    );
  }
  return (
    <Card tint="butter">
      <T v="h2">Turn on STOIC in Accessibility</T>
      <T>
        To show a pause, time&apos;s-up or bedtime screen, Android needs you to switch on STOIC under <B>Accessibility</B>.
        STOIC uses it only to see <B>which app is in front</B>. It cannot read what is on your screen or what you type, and
        nothing leaves your phone.
      </T>
      <Bullets
        items={[
          "Tap the button below.",
          "Under “Downloaded apps” (or “Installed apps”), tap “STOIC limits and pauses”.",
          "Switch it on and confirm.",
          "Come back here.",
        ]}
      />
      <Button label="Open Accessibility settings" onPress={() => device!.openAccessibilitySettings()} />
      <T v="small">
        If Android says “Restricted setting”, open Settings, Apps, STOIC, tap the three dots at the top right, and choose
        “Allow restricted settings”. Then try again. Android does this for apps installed from a file.
      </T>
      <T v="small">You can set things up below first. They start working once this is on.</T>
    </Card>
  );
}
