import { useState } from "react";
import { AccessibilityInfo } from "react-native";
import { AndroidOnly } from "@/components/AndroidOnly";
import { StrictBanner } from "@/components/StrictBanner";
import { TourTarget } from "@/components/Tour";
import { B, Button, Card, Screen, SwitchRow, T } from "@/components/ui";
import { device, type ReelsState } from "@/lib/device";
import { tryStrictSave } from "@/lib/strict";
import { useForeground } from "@/lib/useForeground";
import { useTheme } from "@/theme";

const OFF: ReelsState = { youtube: false, instagram: false, serviceOn: false, blockedToday: 0 };

export default function Reels() {
  const t = useTheme();
  const [s, setS] = useState<ReelsState>(OFF);
  const load = () => device && setS(device.getReels());
  useForeground(load);

  if (!device) return <AndroidOnly />;

  const set = (youtube: boolean, instagram: boolean, spoken: string) => {
    if (!tryStrictSave(() => device!.setReels(youtube, instagram), load)) return;
    setS({ ...s, youtube, instagram });
    AccessibilityInfo.announceForAccessibility(spoken);
  };
  const wanted = s.youtube || s.instagram;

  return (
    <Screen>
      <T v="lead">When Shorts or Reels open, STOIC goes back, so the endless swipe never starts.</T>

      <StrictBanner />

      <TourTarget id="reels.switches">
      <Card>
        <SwitchRow
          label="Block YouTube Shorts"
          hint="Videos, search and subscriptions still work"
          value={s.youtube}
          onChange={(on) => set(on, s.instagram, on ? "YouTube Shorts will be blocked." : "YouTube Shorts allowed.")}
        />
        <SwitchRow
          label="Block Instagram Reels"
          hint="Your feed, stories and messages still work"
          value={s.instagram}
          onChange={(on) => set(s.youtube, on, on ? "Instagram Reels will be blocked." : "Instagram Reels allowed.")}
        />
        {wanted && s.serviceOn ? (
          <T v="small" muted>
            Closed {s.blockedToday} {s.blockedToday === 1 ? "time" : "times"} today.
          </T>
        ) : null}
      </Card>
      </TourTarget>

      {wanted && !s.serviceOn ? (
        <Card tint="butter">
          <T v="h2">One more switch</T>
          <T>
            In <B>Accessibility</B>, switch on <B>STOIC Shorts and Reels blocker</B>.
          </T>
          <Button label="Open Accessibility settings" onPress={() => device!.openAccessibilitySettings()} />
        </Card>
      ) : null}

      {wanted && s.serviceOn ? (
        <Card tint="mint">
          <T v="label" color={t.goodInk}>
            ✓ Shorts and Reels blocking is on
          </T>
        </Card>
      ) : null}

      <T v="small" muted>
        It only works inside YouTube and Instagram, and never reads text or messages.
      </T>
    </Screen>
  );
}
