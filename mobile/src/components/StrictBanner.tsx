import { useState } from "react";
import { AppLink, Card, T } from "@/components/ui";
import { device } from "@/lib/device";
import { untilText } from "@/lib/strict";
import { useForeground } from "@/lib/useForeground";

/** Shown on settings screens while strict mode is on. */
export function StrictBanner() {
  const [until, setUntil] = useState(0);
  useForeground(() => {
    if (device) setUntil(device.getStrict().until);
  });
  if (!until) return null;
  return (
    <Card tint="rose">
      <T v="label">🔒 Strict mode is on {untilText(until)}</T>
      <T v="small">You can make things stricter, but not looser, until then.</T>
      <AppLink href="/strict">About strict mode</AppLink>
    </Card>
  );
}
