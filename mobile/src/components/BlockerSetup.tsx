import { B, Button, Card, T } from "@/components/ui";
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
      </Card>
    );
  }
  return (
    <Card tint="butter">
      <T v="h3">One switch first</T>
      <T>
        In Accessibility, switch on <B>STOIC limits and pauses</B>. It only sees which app is in front.
      </T>
      <Button label="Open Accessibility settings" onPress={() => device!.openAccessibilitySettings()} />
      <T v="small" muted>
        Says “Restricted setting”? Settings › Apps › STOIC › ⋮ › Allow restricted settings.
      </T>
    </Card>
  );
}
