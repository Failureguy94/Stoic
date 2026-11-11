import { useEffect, useMemo, useState } from "react";
import { TextInput, View } from "react-native";
import { Button, Card, Chip, T } from "@/components/ui";
import { device, type LaunchableApp } from "@/lib/device";
import { font, radius, space, useTheme } from "@/theme";

const SHOWN = 40;

/** Searchable list of the phone's apps. Tapping one calls onPick. */
export function AppPicker({
  title = "Choose an app",
  exclude,
  onPick,
  onCancel,
}: {
  title?: string;
  /** Package names to leave out (already chosen). */
  exclude: Set<string>;
  onPick: (app: LaunchableApp) => void;
  onCancel: () => void;
}) {
  const t = useTheme();
  const [apps, setApps] = useState<LaunchableApp[] | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let live = true;
    device?.getLaunchableApps().then((list) => live && setApps(list));
    return () => {
      live = false;
    };
  }, []);

  const available = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (apps ?? []).filter((a) => !exclude.has(a.packageName) && (!q || a.label.toLowerCase().includes(q)));
  }, [apps, exclude, query]);

  return (
    <Card tint="lavender">
      <T v="h3">{title}</T>
      <TextInput
        accessibilityLabel="Search apps"
        placeholder="Search apps"
        placeholderTextColor={t.muted}
        value={query}
        onChangeText={setQuery}
        autoCorrect={false}
        style={{
          minHeight: 48,
          borderWidth: 2,
          borderColor: t.field,
          borderRadius: radius.pill,
          paddingHorizontal: space.lg,
          fontFamily: font.body,
          fontSize: 16,
          color: t.ink,
          backgroundColor: t.surface,
        }}
      />
      {apps === null ? <T muted>Loading your apps…</T> : null}
      {apps && available.length === 0 ? <T>No matching apps.</T> : null}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
        {available.slice(0, SHOWN).map((a) => (
          <Chip key={a.packageName} role="checkbox" label={a.label} selected={false} onPress={() => onPick(a)} />
        ))}
      </View>
      {available.length > SHOWN ? (
        <T v="small" muted>
          Showing the first {SHOWN}. Type to narrow the list.
        </T>
      ) : null}
      <Button kind="quiet" label="Cancel" onPress={onCancel} />
    </Card>
  );
}
