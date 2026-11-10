import { View } from "react-native";
import { SURVEY, TOTAL_RESPONDENTS, TRIED_TO_CUT_DOWN, type SurveyQuestion } from "@shared/survey";
import { tools } from "@shared/tools";
import { B, Card, Screen, T } from "@/components/ui";
import { SITE_NAME } from "@/lib/site";
import { radius, space, useTheme, type Tint } from "@/theme";

const TINTS: Tint[] = ["peach", "mint", "sky", "butter", "lavender", "rose", "mint"];

export default function Survey() {
  const t = useTheme();
  const changes: [string, string][] = [
    ["12 of 17 wanted a short trusted list", `We kept it to ${tools.length} tools, all checked on official pages, and dropped one we couldn't verify.`],
    ["11 of 17 wanted step-by-step guides", "We wrote three setup guides with screenshots and an “if it didn't work” box."],
    [
      "Tools failed because of permissions (6), cost (6) and forgetting (6)",
      "Every tool shows three labels up front: cost, permission level, and Automatic vs Needs you to remember.",
    ],
    [
      "YouTube/reels (10) and social media (8) were the top distractions",
      "They're the first two choices in the Find your fix picker, and one guide is all about YouTube.",
    ],
    [
      "11 study on a Windows laptop, and 9 already use Android Digital Wellbeing",
      "We cover Android, Windows and browser tools, plus a smaller iPhone section, starting with free built-in tools.",
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
