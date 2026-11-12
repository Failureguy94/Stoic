import { useEffect, useMemo, useState } from "react";
import { AccessibilityInfo, View } from "react-native";
import { AndroidOnly } from "@/components/AndroidOnly";
import { AppPicker } from "@/components/AppPicker";
import { BlockerSetupCard } from "@/components/BlockerSetup";
import { ScheduleEditor } from "@/components/ScheduleEditor";
import { StrictBanner } from "@/components/StrictBanner";
import { TourTarget } from "@/components/Tour";
import { Button, Card, Chip, Screen, T } from "@/components/ui";
import { device, type LaunchableApp, type Schedule } from "@/lib/device";
import { BEDTIME_ID, newSchedule, withBedtime } from "@/lib/schedules";
import { tryStrictSave } from "@/lib/strict";
import { useForeground } from "@/lib/useForeground";
import { space, type Tint } from "@/theme";

const TINTS: Tint[] = ["sky", "mint", "peach", "butter", "rose"];

export default function Schedules() {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [dndAccess, setDndAccess] = useState(false);
  const [list, setList] = useState<Schedule[]>([]);
  const [allowed, setAllowed] = useState<string[]>([]);
  const [essentials, setEssentials] = useState<LaunchableApp[]>([]);
  const [apps, setApps] = useState<LaunchableApp[]>([]);
  const [addingAllowed, setAddingAllowed] = useState(false);

  useForeground(() => {
    if (!device) return;
    setEnabled(device.isBlockerEnabled());
    setDndAccess(device.hasDndAccess());
    setList(withBedtime(device.getSchedules()));
    setAllowed(device.getAlwaysAllowed());
  });

  useEffect(() => {
    if (!device) return;
    let live = true;
    device.getEssentialApps().then((e) => live && setEssentials(e));
    device.getLaunchableApps().then((a) => live && setApps(a));
    return () => {
      live = false;
    };
  }, []);

  const labels = useMemo(() => new Map(apps.map((a) => [a.packageName, a.label])), [apps]);
  const essentialSet = useMemo(() => new Set(essentials.map((e) => e.packageName)), [essentials]);

  if (!device) return <AndroidOnly />;

  const save = (next: Schedule[], spoken?: string) => {
    if (!tryStrictSave(() => device!.setSchedules(next), () => setList(withBedtime(device!.getSchedules())))) return;
    setList(next);
    if (spoken) AccessibilityInfo.announceForAccessibility(spoken);
  };
  const update = (id: string, patch: Partial<Schedule>, spoken?: string) =>
    save(
      list.map((s) => (s.id === id ? { ...s, ...patch } : s)),
      spoken,
    );

  const saveAllowed = (next: string[], spoken?: string) => {
    if (!tryStrictSave(() => device!.setAlwaysAllowed(next), () => setAllowed(device!.getAlwaysAllowed()))) return;
    setAllowed(next);
    if (spoken) AccessibilityInfo.announceForAccessibility(spoken);
  };

  const bedtime = list.find((s) => s.id === BEDTIME_ID);
  const custom = list.filter((s) => s.id !== BEDTIME_ID);
  const usesAllApps = list.some((s) => s.enabled && s.allApps);

  return (
    <Screen>
      <T v="lead">Hours when apps stay closed. They switch on and off by themselves.</T>

      <BlockerSetupCard enabled={enabled} onLabel="Schedules are on" />
      <StrictBanner />

      {bedtime ? (
        <TourTarget id="schedules.bedtime" style={{ gap: space.md }}>
          <T v="h2">Bedtime</T>
          <ScheduleEditor
            schedule={bedtime}
            tint="lavender"
            labels={labels}
            dndAccess={dndAccess}
            onChange={(patch, spoken) => update(bedtime.id, patch, spoken)}
            onOpenDndSettings={() => device!.openDndAccessSettings()}
          />
        </TourTarget>
      ) : null}

      <View style={{ gap: space.md }}>
        <T v="h2">My schedules</T>
        {custom.length === 0 ? <T muted>None yet. Try study hours on weekdays.</T> : null}
        {custom.map((s, i) => (
          <ScheduleEditor
            key={s.id}
            schedule={s}
            tint={TINTS[i % TINTS.length]}
            labels={labels}
            dndAccess={dndAccess}
            onChange={(patch, spoken) => update(s.id, patch, spoken)}
            onRemove={() => save(list.filter((x) => x.id !== s.id), `${s.name} removed.`)}
            onOpenDndSettings={() => device!.openDndAccessSettings()}
          />
        ))}
        <Button
          label="Add a schedule"
          onPress={() => {
            const s = newSchedule(list);
            save([...list, s], `${s.name} added: weekdays, 9 to 5. Pick the apps it blocks.`);
          }}
        />
      </View>

      <Card>
        <T v="h2">Always allowed</T>
        <T>
          Schedules set to “All apps” never block these.
          {usesAllApps ? "" : " (None of your schedules uses “All apps” right now.)"}
        </T>
        {essentials.length > 0 ? (
          <T v="small" muted>
            Always work, and can&apos;t be removed: {essentials.map((e) => e.label).join(", ")}.
          </T>
        ) : null}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
          {allowed.map((pkg) => {
            const label = labels.get(pkg) ?? pkg;
            return (
              <Chip
                key={pkg}
                role="button"
                label={`${label}  ✕`}
                accessibilityLabel={`Remove ${label} from always allowed`}
                selected={false}
                onPress={() => saveAllowed(allowed.filter((p) => p !== pkg), `${label} removed.`)}
              />
            );
          })}
        </View>
        {addingAllowed ? (
          <AppPicker
            title="Always allow an app"
            exclude={new Set([...allowed, ...essentialSet])}
            onPick={(app) => {
              saveAllowed([...allowed, app.packageName], `${app.label} is always allowed.`);
              setAddingAllowed(false);
            }}
            onCancel={() => setAddingAllowed(false)}
          />
        ) : (
          <Button kind="outline" label="Add an app" onPress={() => setAddingAllowed(true)} />
        )}
      </Card>

      <T v="small" muted>
        Calls, messages and alarms always work.
      </T>
    </Screen>
  );
}
