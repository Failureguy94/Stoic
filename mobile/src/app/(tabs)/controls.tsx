import { useState } from "react";
import { View } from "react-native";
import { BlockerSetupCard } from "@/components/BlockerSetup";
import { StrictBanner } from "@/components/StrictBanner";
import { AppLink, NavCard, Screen, T } from "@/components/ui";
import { device, isAndroid } from "@/lib/device";
import { BEDTIME_ID, describeWindow } from "@/lib/schedules";
import { untilText } from "@/lib/strict";
import { useForeground } from "@/lib/useForeground";
import { space } from "@/theme";

interface Status {
  enabled: boolean | null;
  limits: string;
  schedules: string;
  sites: string;
  notifications: string;
  reels: string;
  strict: string;
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

function readStatus(): Status | null {
  if (!device) return null;
  const rules = device.getRules();
  const schedules = device.getSchedules();
  const bed = schedules.find((s) => s.id === BEDTIME_ID && s.enabled);
  const others = schedules.filter((s) => s.id !== BEDTIME_ID && s.enabled).length;
  const sites = device.getSites();
  const hold = device.getHoldApps();
  const strict = device.getStrict();
  const reels = device.getReels();
  return {
    enabled: device.isBlockerEnabled(),
    limits: rules.length ? plural(rules.length, "app with its own rules", "apps with their own rules") : "No apps yet",
    schedules:
      [bed ? `Bedtime ${describeWindow(bed)}` : "Bedtime off", others ? plural(others, "other schedule", "other schedules") : ""]
        .filter(Boolean)
        .join(" · "),
    sites:
      [
        sites.enabled && sites.sites.length ? `${plural(sites.sites.length, "address", "addresses")} blocked ${sites.always ? "always" : "during focus"}` : "No sites blocked",
        sites.internetOff ? "internet off during focus" : "",
      ]
        .filter(Boolean)
        .join(" · "),
    notifications: device.hasNotificationAccess()
      ? hold.length
        ? `Holding ${plural(hold.length, "app", "apps")} for your summary`
        : "Counting, nothing held"
      : "Off",
    reels:
      reels.youtube || reels.instagram
        ? `Blocking ${[reels.youtube && "Shorts", reels.instagram && "Reels"].filter(Boolean).join(" and ")}${reels.serviceOn ? "" : " (needs one more switch)"}`
        : "Off",
    strict: strict.until ? `On ${untilText(strict.until)}` : "Off",
  };
}

export default function Controls() {
  const [s, setS] = useState<Status | null>(null);
  useForeground(() => setS(readStatus()));

  return (
    <Screen tab>
      <T v="h1">Controls</T>
      <T v="lead">Everything that keeps your phone in its place. Each one is yours to switch on, change or switch off.</T>

      {!isAndroid || !device ? (
        <T>Controls work on Android phones for now.</T>
      ) : (
        <>
          <BlockerSetupCard enabled={s?.enabled ?? null} onLabel="Limits, schedules and blocking are on" />
          <StrictBanner />
          <View style={{ gap: space.md }}>
            <NavCard href="/limits" icon="✋" tint="peach" title="Limits and pauses" body={s?.limits ?? " "} />
            <NavCard href="/schedules" icon="🌙" tint="lavender" title="Schedules and bedtime" body={s?.schedules ?? " "} />
            <NavCard href="/sites" icon="🌐" tint="sky" title="Websites and internet" body={s?.sites ?? " "} />
            <NavCard href="/notifications" icon="🔔" tint="mint" title="Notifications" body={s?.notifications ?? " "} />
            <NavCard href="/reels" icon="🎞️" tint="peach" title="Shorts and Reels" body={s?.reels ?? " "} />
            <NavCard href="/strict" icon="🔒" tint="rose" title="Strict mode" body={s?.strict ?? " "} />
          </View>
          <AppLink href="/docs">How each one works</AppLink>
        </>
      )}
    </Screen>
  );
}
