import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { useState } from "react";
import { TextInput, View } from "react-native";
import { AppPicker } from "@/components/AppPicker";
import { Button, Card, Chip, ChipGroup, SwitchRow, T } from "@/components/ui";
import type { LaunchableApp, Schedule } from "@/lib/device";
import { DAY_NAMES, DAY_SHORT, describeWindow, formatMin } from "@/lib/schedules";
import { font, radius, space, useTheme, type Tint } from "@/theme";

/** Edits one schedule (Bedtime or the user's own). Every change is saved straight away by the parent. */
export function ScheduleEditor({
  schedule: s,
  tint,
  labels,
  dndAccess,
  onChange,
  onRemove,
  onOpenDndSettings,
}: {
  schedule: Schedule;
  tint: Tint;
  /** Package name -> app label, for showing chosen apps. */
  labels: Map<string, string>;
  dndAccess: boolean;
  onChange: (patch: Partial<Schedule>, spoken?: string) => void;
  onRemove?: () => void;
  onOpenDndSettings: () => void;
}) {
  const t = useTheme();
  const [picking, setPicking] = useState(false);
  const bedtime = s.kind === "bedtime";

  const pickTime = (which: "startMin" | "endMin") => {
    const min = s[which];
    DateTimePickerAndroid.open({
      mode: "time",
      value: new Date(2000, 0, 1, Math.floor(min / 60), min % 60),
      onValueChange: (_event, date) => {
        const next = date.getHours() * 60 + date.getMinutes();
        onChange({ [which]: next }, `${which === "startMin" ? "Starts" : "Ends"} at ${formatMin(next)}.`);
      },
    });
  };

  const toggleDay = (day: number) => {
    const days = s.days.includes(day) ? s.days.filter((d) => d !== day) : [...s.days, day].sort();
    onChange({ days });
  };

  const addApp = (app: LaunchableApp) => {
    onChange({ packages: [...s.packages, app.packageName] }, `${app.label} added.`);
    setPicking(false);
  };

  return (
    <Card tint={tint}>
      {bedtime ? (
        <SwitchRow
          label="Bedtime"
          hint={s.enabled ? describeWindow(s) : "Off"}
          value={s.enabled}
          onChange={(on) => onChange({ enabled: on }, on ? "Bedtime is on." : "Bedtime is off.")}
        />
      ) : (
        <>
          <TextInput
            accessibilityLabel="Schedule name"
            value={s.name}
            onChangeText={(name) => onChange({ name })}
            maxLength={40}
            style={{
              minHeight: 48,
              borderWidth: 2,
              borderColor: t.field,
              borderRadius: radius.pill,
              paddingHorizontal: space.lg,
              fontFamily: font.display,
              fontSize: 18,
              color: t.ink,
              backgroundColor: t.surface,
            }}
          />
          <SwitchRow
            label="On"
            hint={s.enabled ? describeWindow(s) : "Paused"}
            value={s.enabled}
            onChange={(on) => onChange({ enabled: on }, on ? `${s.name} is on.` : `${s.name} is paused.`)}
          />
        </>
      )}

      {s.enabled || !bedtime ? (
        <>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
            <Button kind="outline" label={`Starts ${formatMin(s.startMin)}`} onPress={() => pickTime("startMin")} />
            <Button kind="outline" label={`Ends ${formatMin(s.endMin)}`} onPress={() => pickTime("endMin")} />
          </View>
          {s.endMin < s.startMin ? (
            <T v="small" muted>
              Runs past midnight and ends the next morning.
            </T>
          ) : null}

          <T v="label" style={{ marginTop: space.sm }}>
            Days
          </T>
          <View accessibilityLabel={`Days for ${s.name}`} style={{ flexDirection: "row", flexWrap: "wrap", gap: space.xs }}>
            {DAY_SHORT.map((short, i) => (
              <Chip
                key={i}
                role="checkbox"
                label={short}
                accessibilityLabel={DAY_NAMES[i]}
                selected={s.days.includes(i + 1)}
                onPress={() => toggleDay(i + 1)}
              />
            ))}
          </View>
          {s.days.length === 0 ? <T v="small">Pick at least one day, or this never starts.</T> : null}

          <T v="label" style={{ marginTop: space.sm }}>
            Which apps
          </T>
          <ChipGroup label={`Which apps ${s.name} blocks`}>
            <Chip label="All apps" selected={s.allApps} onPress={() => onChange({ allApps: true })} />
            <Chip label="Only apps I pick" selected={!s.allApps} onPress={() => onChange({ allApps: false })} />
          </ChipGroup>
          {s.allApps ? (
            <T v="small" muted>
              Except your always-allowed apps, and phone, messages, alarms and Settings, which always work.
            </T>
          ) : (
            <>
              {s.packages.length === 0 ? <T v="small">No apps picked yet, so nothing is blocked.</T> : null}
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
                {s.packages.map((pkg) => {
                  const label = labels.get(pkg) ?? pkg;
                  return (
                    <Chip
                      key={pkg}
                      role="button"
                      label={`${label}  ✕`}
                      accessibilityLabel={`Remove ${label}`}
                      selected={false}
                      onPress={() => onChange({ packages: s.packages.filter((p) => p !== pkg) }, `${label} removed.`)}
                    />
                  );
                })}
              </View>
              {picking ? (
                <AppPicker exclude={new Set(s.packages)} onPick={addApp} onCancel={() => setPicking(false)} />
              ) : (
                <Button kind="outline" label="Add an app to block" onPress={() => setPicking(true)} />
              )}
            </>
          )}

          <SwitchRow
            label="Turn on Do Not Disturb"
            hint="Alarms and the people you allow in Do Not Disturb still get through"
            value={s.dnd}
            onChange={(on) => onChange({ dnd: on })}
          />
          {s.dnd && !dndAccess ? (
            <View style={{ gap: space.sm }}>
              <T v="small">
                Android needs you to allow STOIC under “Do Not Disturb access” first. STOIC only switches it on and off for
                this schedule, and leaves it alone if you changed it yourself.
              </T>
              <Button kind="outline" label="Open Do Not Disturb access" onPress={onOpenDndSettings} />
            </View>
          ) : null}

          <SwitchRow
            label="Let me add 5 more minutes"
            hint="Off makes this strict until it ends"
            value={s.allowSnooze}
            onChange={(on) => onChange({ allowSnooze: on })}
          />
        </>
      ) : null}

      {onRemove ? <Button kind="quiet" label={`Remove ${s.name}`} onPress={onRemove} /> : null}
    </Card>
  );
}
