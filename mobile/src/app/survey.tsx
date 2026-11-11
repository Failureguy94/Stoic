import { View } from "react-native";
import { SURVEY, TOTAL_RESPONDENTS, TRIED_TO_CUT_DOWN, type SurveyQuestion } from "@shared/survey";
import { B, Card, Screen, T } from "@/components/ui";
import { SITE_NAME } from "@/lib/site";
import { radius, space, useTheme, type Tint } from "@/theme";

const TINTS: Tint[] = ["peach", "mint", "sky", "butter", "lavender", "rose", "mint"];

export default function Survey() {
  const t = useTheme();
  const changes: [string, string][] = [
    ["12 of 17 wanted a short trusted list", `Instead of a list of other apps, ${SITE_NAME} puts the tools in one place: limits, bedtime, focus, notifications and website blocking.`],
    ["11 of 17 wanted step-by-step guides", "Every feature has a short how-to guide with an “if it didn't work” box."],
    [
      "Tools failed because of permissions (6), cost (6) and forgetting (6)",
      `${SITE_NAME} is free, asks for each permission only when you switch on the feature that needs it, and works automatically once set up.`,
    ],
    [
      "YouTube/reels (10) and social media (8) were the top distractions",
      "Limits, opens per day, check-ins and website blocking all start with those apps, and the quick fixes on the Today tab point straight at them.",
    ],
    [
      "Many said changes didn't last",
      "Schedules and bedtime run by themselves, and strict mode keeps your rules firm through a weak moment.",
    ],
    [
      `${TRIED_TO_CUT_DOWN} of 17 had tried to cut down, but many said it didn't last`,
      `We added the ${SITE_NAME} Circle: one small weekly goal, gentle check-ins, and no shaming.`,
    ],
  ];

  return (
    <Screen>
      <T v="lead">
        We asked {TOTAL_RESPONDENTS} first-years at IIIT Nagpur about their phones using a Google Form. It&apos;s a small group
        from one college, so read these as signals, not statistics.
      </T>
      <Card tint="mint">
        <T v="lead">
          <B>
            {TRIED_TO_CUT_DOWN} of {TOTAL_RESPONDENTS}
          </B>{" "}
          had already tried to cut down. Many said it didn&apos;t last because they ignored the tool or switched it off.
        </T>
      </Card>

      <View style={{ gap: space.md }}>
        <T v="h2">The numbers</T>
        {SURVEY.map((q, i) => (
          <BarChart key={q.id} q={q} tint={TINTS[i % TINTS.length]} />
        ))}
      </View>

      <View style={{ gap: space.md }}>
        <T v="h2">What this changed in the hub</T>
        {changes.map(([finding, change], i) => (
          <Card key={finding} style={{ flexDirection: "row", gap: space.md }}>
            <View
              importantForAccessibility="no-hide-descendants"
              style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: t.brand, alignItems: "center", justifyContent: "center" }}
            >
              <T v="label" color={t.brandInk}>
                {i + 1}
              </T>
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <T v="label">{finding}</T>
              <T>{change}</T>
            </View>
          </Card>
        ))}
      </View>
    </Screen>
  );
}

/** Bar chart where every bar also shows its number as text, and each row reads as one sentence to screen readers. */
function BarChart({ q, tint }: { q: SurveyQuestion; tint: Tint }) {
  const t = useTheme();
  const max = Math.max(...q.answers.map((a) => a.count));
  return (
    <Card tint={tint}>
      <T v="h3">{q.question}</T>
      <T v="small">
        {TOTAL_RESPONDENTS} respondents.{q.note ? ` ${q.note}` : ""}
      </T>
      <View style={{ gap: space.sm, marginTop: 4 }}>
        {q.answers.map((a) => {
          const pct = Math.round((a.count / TOTAL_RESPONDENTS) * 100);
          return (
            <View key={a.label} accessible accessibilityLabel={`${a.label}: ${a.count} students, ${pct} percent`} style={{ gap: 2 }}>
              <T v="label">{a.label}</T>
              <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
                <View style={{ flex: 1, flexDirection: "row" }}>
                  <View style={{ height: 18, borderRadius: radius.pill, backgroundColor: t.brand, width: `${(a.count / max) * 100}%`, minWidth: 10 }} />
                </View>
                <T v="label" style={{ minWidth: 78, textAlign: "right" }}>
                  {a.count} <T v="small">({pct}%)</T>
                </T>
              </View>
            </View>
          );
        })}
      </View>
    </Card>
  );
}
