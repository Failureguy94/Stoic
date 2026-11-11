import { useState } from "react";
import { AccessibilityInfo } from "react-native";
import { AndroidOnly } from "@/components/AndroidOnly";
import { StrictBanner } from "@/components/StrictBanner";
import { AppLink, B, Bullets, Button, Card, Screen, SwitchRow, T } from "@/components/ui";
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
      <T v="lead">
        Keep YouTube and Instagram for what you came for. When Shorts or Reels open, STOIC goes back, so the endless swipe
        never starts.
      </T>

      <StrictBanner />

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

      {wanted && !s.serviceOn ? (
        <Card tint="butter">
          <T v="h2">One more switch</T>
          <T>
            Shorts and Reels blocking is a separate part of STOIC, so it is only on if you want it. Under{" "}
            <B>Accessibility</B>, switch on <B>STOIC Shorts and Reels blocker</B>.
          </T>
          <Button label="Open Accessibility settings" onPress={() => device!.openAccessibilitySettings()} />
          <T v="small">If Android says “Restricted setting”, allow restricted settings for STOIC first (Settings, Apps, STOIC, ⋮).</T>
        </Card>
      ) : null}

      {wanted && s.serviceOn ? (
        <Card tint="mint">
          <T v="label" color={t.goodInk}>
            ✓ Shorts and Reels blocking is on
          </T>
        </Card>
      ) : null}

      <Card>
        <T v="h3">What this part of STOIC can see</T>
        <Bullets
          items={[
            "Android only lets it work inside YouTube and Instagram. It gets nothing from any other app.",
            "It looks at the names of the parts of the screen, like “the Shorts player”, never at text, messages or what you type.",
            "Nothing is stored or sent anywhere. It only counts how many times it closed Shorts or Reels today.",
          ]}
        />
        <T v="small" muted>
          YouTube and Instagram change their apps often. If Shorts or Reels stop being closed after an update, let us know.
        </T>
        <AppLink href={{ pathname: "/docs/[slug]", params: { slug: "shorts-reels" } }}>How it works</AppLink>
      </Card>
    </Screen>
  );
}
