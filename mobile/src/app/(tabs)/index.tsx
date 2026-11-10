import { useState } from "react";
import { AccessibilityInfo, View } from "react-native";
import { DEVICES, PICKER, PROBLEMS, type Device, type Problem } from "@shared/picker";
import { TOTAL_RESPONDENTS, TRIED_TO_CUT_DOWN } from "@shared/survey";
import { getTool, tools } from "@shared/tools";
import { Pebble } from "@/components/Pebble";
import { TagRow } from "@/components/Tags";
import { AppLink, B, Card, Chip, ChipGroup, ExternalLink, NavCard, Row, Screen, T } from "@/components/ui";
import { SITE_NAME } from "@/lib/site";
import { font, radius, space, useTheme, type Tint } from "@/theme";

const PROBLEM_ICON: Record<Problem, string> = {
  "youtube-reels": "📺",
  "social-media": "💬",
  notifications: "🔔",
  "late-night": "🌙",
  games: "🎮",
};
const DEVICE_ICON: Record<Device, string> = { android: "📱", iphone: "📱", laptop: "💻" };
const OPTION_TINTS: Tint[] = ["peach", "mint", "sky"];

export default function FindYourFix() {
  const t = useTheme();
  const [problem, setProblem] = useState<Problem | null>(null);
  const [device, setDevice] = useState<Device | null>(null);

  const problemLabel = PROBLEMS.find((p) => p.id === problem)?.label;
  const deviceLabel = DEVICES.find((d) => d.id === device)?.label;
  const result = problem && device ? PICKER[problem][device] : null;

  // Tell screen-reader users the results changed (same idea as aria-live on the website).
  const choose = (p: Problem | null, d: Device | null) => {
    setProblem(p);
    setDevice(d);
    if (p && d) {
      const n = PICKER[p][d].picks.length;
      const pl = PROBLEMS.find((x) => x.id === p)?.label;
      const dl = DEVICES.find((x) => x.id === d)?.label;
      AccessibilityInfo.announceForAccessibility(`${n} ${n === 1 ? "tool" : "tools"} for ${pl} on ${dl}, shown below.`);
    }
  };

  return (
    <Screen tab>
      <View style={{ gap: space.md }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
          <View style={{ flex: 1, gap: space.sm }}>
            <View style={{ alignSelf: "flex-start", backgroundColor: t.butter, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 4 }}>
              <T v="small" color={t.warnInk} style={{ fontFamily: font.bold }}>
                Made by a first-year, for first-years
              </T>
            </View>
            <T v="h1">Hey! What&apos;s eating your study time?</T>
          </View>
          <Pebble mood="cheer" size={96} float />
        </View>
        <T v="lead">
          {SITE_NAME} is a short, friendly list of tools that actually help, with straight answers to three questions:{" "}
          <B>does it cost money</B>, <B>what does it want access to</B>, and <B>will it still work when I forget about it</B>.
        </T>
      </View>

      <Card>
        <T v="h2">Find your fix</T>
        <T muted>Two taps. Your matches appear straight away, just below.</T>

        <Step n="1" title="What eats your study time most?" />
        <ChipGroup label="What eats your study time most?">
          {PROBLEMS.map((p) => (
            <Chip key={p.id} label={p.label} icon={PROBLEM_ICON[p.id]} selected={problem === p.id} onPress={() => choose(p.id, device)} />
          ))}
        </ChipGroup>

        <Step n="2" title="Which device?" />
        <ChipGroup label="Which device?">
          {DEVICES.map((d) => (
            <Chip
              key={d.id}
              label={d.label}
              hint={d.hint || undefined}
              icon={DEVICE_ICON[d.id]}
              selected={device === d.id}
              onPress={() => choose(problem, d.id)}
            />
          ))}
        </ChipGroup>

        <View style={{ backgroundColor: t.lavender, borderRadius: radius.card, padding: space.lg, gap: space.md, marginTop: space.md }}>
          {!result ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
              <Pebble mood="calm" size={60} />
              <T v="label" style={{ flex: 1 }}>
                {problem || device
                  ? `Nice! Now pick ${problem ? "your device" : "what distracts you most"}.`
                  : "Pick one in each row and I'll show you 2 or 3 tools that fit."}
              </T>
            </View>
          ) : (
            <>
              <View style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
                <Pebble mood="happy" size={52} />
                <T v="h3" style={{ flex: 1 }}>
                  Your fix for {problemLabel} on {deviceLabel}
                </T>
              </View>
              {result.picks.length === 1 ? (
                <T>Only one tool we checked really fits this, so we&apos;re not padding the list.</T>
              ) : null}
              {result.picks.map((pick, i) => {
                const tool = getTool(pick.toolId);
                return (
                  <View key={pick.toolId} style={{ backgroundColor: t.surface, borderRadius: radius.card, borderWidth: 2, borderColor: t.line, overflow: "hidden" }}>
                    <View style={{ backgroundColor: t[OPTION_TINTS[i % 3]], paddingHorizontal: space.lg, paddingVertical: 6 }}>
                      <T v="small" style={{ fontFamily: font.display }}>
                        Option {i + 1}
                      </T>
                    </View>
                    <View style={{ padding: space.lg, gap: space.sm }}>
                      <T v="h3">{tool.name}</T>
                      <T>{pick.reason}</T>
                      <TagRow cost={tool.cost} level={tool.permissionLevel} effort={tool.effort} />
                      {tool.paidFeatures.length > 0 ? (
                        <T v="small">
                          <B>Paid: </B>
                          {tool.paidFeatures.join(", ")}.
                        </T>
                      ) : null}
                      <Row>
                        <ExternalLink href={tool.officialUrl}>{`${tool.name} official page`}</ExternalLink>
                      </Row>
                    </View>
                  </View>
                );
              })}
              {result.guide ? (
                <View style={{ backgroundColor: t.surface, borderRadius: radius.card, padding: space.md }}>
                  <T v="label">📘 Step-by-step:</T>
                  <AppLink href={{ pathname: "/guides/[slug]", params: { slug: result.guide.slug } }}>{result.guide.label}</AppLink>
                </View>
              ) : null}
              <T v="small">
                <B>Tip from your batch:</B> tools mostly failed because people forgot or switched them off. An{" "}
                <B>Automatic</B> one keeps going on lazy days too.
              </T>
            </>
          )}
        </View>
      </Card>

      <Card tint="mint">
        <T v="h1" color={t.goodInk} accessibilityRole="none" importantForAccessibility="no">
          {TRIED_TO_CUT_DOWN}/{TOTAL_RESPONDENTS}
        </T>
        <T v="h2">Your batch is in this too</T>
        <T>
          {TRIED_TO_CUT_DOWN} of the {TOTAL_RESPONDENTS} first-years we asked have already tried to cut down their phone time.
          You&apos;re in good company.
        </T>
        <AppLink href="/circle">{`Join the ${SITE_NAME} Circle and pick one small weekly goal`}</AppLink>
      </Card>

      <View style={{ gap: space.md }}>
        <T v="h2">Have a look around</T>
        <NavCard href="/tools" icon="⚖️" tint="peach" title="Compare tools" body={`All ${tools.length} tools side by side. Filter by phone, laptop or free-only.`} />
        <NavCard href="/guides" icon="📘" tint="sky" title="Setup guides" body="Step-by-step help with screenshots, written by a student." />
        <NavCard href="/survey" icon="📊" tint="butter" title="Survey results" body={`What ${TOTAL_RESPONDENTS} first-years told us, and what it changed here.`} />
      </View>
    </Screen>
  );
}

function Step({ n, title }: { n: string; title: string }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: space.md, marginTop: space.md }}>
      <View
        importantForAccessibility="no-hide-descendants"
        style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: t.brand, alignItems: "center", justifyContent: "center" }}
      >
        <T v="label" color={t.brandInk}>
          {n}
        </T>
      </View>
      <T v="h3" style={{ flex: 1 }} accessibilityLabel={`Step ${n}: ${title}`}>
        {title}
      </T>
    </View>
  );
}
