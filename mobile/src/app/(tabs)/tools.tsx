import { useMemo, useState } from "react";
import { AccessibilityInfo, View } from "react-native";
import { PLATFORM_LABELS, PURPOSE_LABELS, tools, type Platform, type Purpose, type Tool } from "@shared/tools";
import { Pebble } from "@/components/Pebble";
import { CostTag, EffortTag, PermissionTag, formatDate } from "@/components/Tags";
import { B, Bullets, Button, Card, Chip, ChipGroup, ExternalLink, Screen, T } from "@/components/ui";
import { radius, space, useTheme, type Tint } from "@/theme";

type PlatformFilter = Platform | "all";
type PurposeFilter = Purpose | "all";
const TINTS: Tint[] = ["peach", "mint", "sky", "butter", "lavender", "rose"];

function matches(platform: PlatformFilter, purpose: PurposeFilter, freeOnly: boolean) {
  return tools.filter(
    (tool) =>
      (platform === "all" || tool.platforms.includes(platform)) &&
      (purpose === "all" || tool.purpose.includes(purpose)) &&
      (!freeOnly || tool.cost === "free"),
  );
}

export default function CompareTools() {
  const [platform, setPlatform] = useState<PlatformFilter>("all");
  const [purpose, setPurpose] = useState<PurposeFilter>("all");
  const [freeOnly, setFreeOnly] = useState(false);
  const [showKey, setShowKey] = useState(false);

  const filtered = useMemo(() => matches(platform, purpose, freeOnly), [platform, purpose, freeOnly]);

  const apply = (p: PlatformFilter, u: PurposeFilter, f: boolean) => {
    setPlatform(p);
    setPurpose(u);
    setFreeOnly(f);
    AccessibilityInfo.announceForAccessibility(`Showing ${matches(p, u, f).length} of ${tools.length} tools`);
  };

  return (
    <Screen tab>
      <View style={{ gap: space.md }}>
        <T v="h1">Compare tools</T>
        <T v="lead">
          {tools.length} tools, each checked on its official page. Your batch said tools failed because of <B>permissions</B>,{" "}
          <B>cost</B> and <B>forgetting</B>, so those three come first on every tool.
        </T>
        <Card tint="butter">
          <Button
            kind="quiet"
            label={showKey ? "Hide what the labels mean" : "What do the labels mean?"}
            onPress={() => setShowKey((s) => !s)}
          />
          {showKey ? (
            <View style={{ gap: space.sm }}>
              <T>
                <B>Free: </B>everything works without paying. If something important costs money it says Freemium and lists
                what&apos;s paid.
              </T>
              <T>
                <B>Built in / Low / High permissions: </B>“Built in” is already part of your phone or PC. “High” means broad
                access, like Android&apos;s Accessibility permission or “read data on all websites”.
              </T>
              <T>
                <B>Automatic / Needs you to remember: </B>automatic tools keep working on a schedule; the others only help when
                you start them.
              </T>
              <T>
                <B>Not confirmed: </B>we couldn&apos;t find it on an official page, so we didn&apos;t guess.
              </T>
            </View>
          ) : null}
        </Card>
      </View>

      <Card>
        <T v="h2">Filter the list</T>
        <T v="label">Platform</T>
        <ChipGroup label="Platform">
          <Chip label="All" selected={platform === "all"} onPress={() => apply("all", purpose, freeOnly)} />
          {(Object.keys(PLATFORM_LABELS) as Platform[]).map((p) => (
            <Chip key={p} label={PLATFORM_LABELS[p]} selected={platform === p} onPress={() => apply(p, purpose, freeOnly)} />
          ))}
        </ChipGroup>
        <T v="label" style={{ marginTop: space.sm }}>
          Purpose
        </T>
        <ChipGroup label="Purpose">
          <Chip label="All" selected={purpose === "all"} onPress={() => apply(platform, "all", freeOnly)} />
          {(Object.keys(PURPOSE_LABELS) as Purpose[]).map((p) => (
            <Chip key={p} label={PURPOSE_LABELS[p]} selected={purpose === p} onPress={() => apply(platform, p, freeOnly)} />
          ))}
        </ChipGroup>
        <View style={{ marginTop: space.sm, flexDirection: "row" }}>
          <Chip
            role="checkbox"
            label="Free only"
            hint="no paid tier needed"
            selected={freeOnly}
            onPress={() => apply(platform, purpose, !freeOnly)}
          />
        </View>
        <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: space.md, marginTop: space.sm }}>
          <T v="h3">
            Showing {filtered.length} of {tools.length} tools
          </T>
          <Button kind="outline" label="Reset filters" onPress={() => apply("all", "all", false)} />
        </View>
      </Card>

      {filtered.length === 0 ? (
        <Card tint="lavender">
          <View style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
            <Pebble mood="sleepy" size={70} />
            <T v="label" style={{ flex: 1 }}>
              Hmm, nothing matches all of those. Reset the filters and try a wider search.
            </T>
          </View>
        </Card>
      ) : (
        filtered.map((tool, i) => <ToolCard key={tool.id} tool={tool} tint={TINTS[i % TINTS.length]} />)
      )}
    </Screen>
  );
}

function ToolCard({ tool, tint }: { tool: Tool; tint: Tint }) {
  const t = useTheme();
  const [open, setOpen] = useState(false);
  return (
    <View style={{ borderRadius: radius.blob, borderWidth: 2, borderColor: t.line, backgroundColor: t.surface, overflow: "hidden" }}>
      <View style={{ backgroundColor: t[tint], padding: space.lg, gap: 4 }}>
        <T v="h2">{tool.name}</T>
        <T>{tool.summary}</T>
      </View>
      <View style={{ padding: space.lg, gap: space.lg }}>
        <Field term="Platforms">
          <T>{tool.platforms.map((p) => PLATFORM_LABELS[p]).join(", ")}</T>
        </Field>
        <Field term="Cost">
          <CostTag cost={tool.cost} />
          <T>{tool.priceNote}</T>
          {tool.paidFeatures.length > 0 ? (
            <>
              <T v="label">Paid features:</T>
              <Bullets items={tool.paidFeatures} />
            </>
          ) : null}
        </Field>
        <Field term="Permissions and privacy">
          <PermissionTag level={tool.permissionLevel} />
          <T>{tool.permissions}</T>
          <T>
            <B>Privacy: </B>
            {tool.privacyNotes}
          </T>
        </Field>
        <Field term="Effort">
          <EffortTag effort={tool.effort} />
          <T>{tool.effortNote}</T>
        </Field>
        <Button
          kind="quiet"
          label={open ? `Show less about ${tool.name}` : `Show more about ${tool.name}`}
          accessibilityHint="Purpose, accessibility notes and limitations"
          onPress={() => setOpen((o) => !o)}
        />
        {open ? (
          <>
            <Field term="Purpose">
              <T>{tool.purpose.map((p) => PURPOSE_LABELS[p]).join(", ")}</T>
            </Field>
            <Field term="Accessibility notes">
              <T>{tool.accessibilityNotes}</T>
            </Field>
            <Field term="Limitations">
              <Bullets items={tool.limitations} />
            </Field>
          </>
        ) : null}
        <Field term="Official link">
          <ExternalLink href={tool.officialUrl}>{`${tool.name} official page`}</ExternalLink>
        </Field>
        <T v="small" muted>
          Checked on {formatDate(tool.dateChecked)}
        </T>
      </View>
    </View>
  );
}

function Field({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 6, alignItems: "flex-start" }}>
      <T v="label" muted>
        {term}
      </T>
      {children}
    </View>
  );
}
