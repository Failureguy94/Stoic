import { useEffect } from "react";
import { View } from "react-native";
import { AndroidOnly } from "@/components/AndroidOnly";
import { Pebble } from "@/components/Pebble";
import { AppLink, B, Bullets, Card, Chip, ChipGroup, Screen, T } from "@/components/ui";
import { device } from "@/lib/device";
import { BEDTIME_ZERO_MIN, MAX } from "@/lib/score";
import { KEYS, useStored } from "@/lib/storage";
import { DEFAULT_GOALS, moodFor, useDayScore } from "@/lib/useDayScore";
import { shiftDay, weekday } from "@/lib/week";
import { font, radius, space, useTheme } from "@/theme";

const SCREEN_GOALS_H = [1, 2, 3, 4, 5];
const FOCUS_GOALS_MIN = [25, 50, 100];
const NO_HISTORY: Record<string, number> = {};
const KEEP_DAYS = 30;


export default function ScoreScreen() {
  const t = useTheme();
  const { score, goals, setGoals, access, bedtimeMin, today } = useDayScore();
  const [history, setHistory] = useStored<Record<string, number>>(KEYS.scoreHistory, NO_HISTORY);

  // Keep today's score so the week view has something to show. Saved whenever STOIC is opened.
  useEffect(() => {
    if (!score || history === undefined || history[today] === score.total) return;
    const keep = Object.keys(history)
      .filter((d) => d >= shiftDay(today, -KEEP_DAYS))
      .reduce<Record<string, number>>((o, d) => ({ ...o, [d]: history[d] }), {});
    setHistory({ ...keep, [today]: score.total });
  }, [score, history, today, setHistory]);

  if (!device) return <AndroidOnly />;

  const week = Array.from({ length: 7 }, (_, i) => shiftDay(today, i - 6));

  return (
    <Screen>
      {!access ? (
        <Card tint="butter">
          <T v="h3">Your score needs Usage access</T>
          <T>Without it STOIC can&apos;t see today&apos;s screen time, so that part counts as zero.</T>
          <AppLink href="/screen-time">Turn it on in My screen time</AppLink>
        </Card>
      ) : null}

      <Card tint="lavender">
        {score ? (
          <View style={{ alignItems: "center", gap: space.sm }}>
            <Pebble mood={moodFor(score.total)} size={110} />
            <T
              accessibilityLabel={`Today's score: ${score.total} out of 100. ${score.word}.`}
              style={{ fontFamily: font.display, fontSize: 64, lineHeight: 72, color: t.ink }}
            >
              {score.total}
            </T>
            <T v="h3" style={{ textAlign: "center" }}>
              {score.word}
            </T>
            <T v="small" muted style={{ textAlign: "center" }}>
              Your day so far, out of 100. It updates as the day goes on.
            </T>
          </View>
        ) : (
          <T muted>Working out your day…</T>
        )}
      </Card>

      {score ? (
        <Card>
          <T v="h2">What makes it up</T>
          <View style={{ gap: space.md }}>
            {score.parts.map((p) => (
              <View key={p.id} style={{ gap: space.xs }} accessible accessibilityLabel={`${p.label}: ${p.earned} of ${p.max}. ${p.why}`}>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <T v="label">{p.label}</T>
                  <T v="label">
                    {p.earned} / {p.max}
                  </T>
                </View>
                <View style={{ height: 10, borderRadius: radius.pill, backgroundColor: t.line, overflow: "hidden" }}>
                  <View style={{ width: `${(p.earned / p.max) * 100}%`, height: "100%", backgroundColor: t.brand }} />
                </View>
                <T v="small">{p.why}</T>
              </View>
            ))}
          </View>
          {bedtimeMin === null ? (
            <T v="small" muted>
              Bedtime is off, so it isn&apos;t part of your score. <AppLink href="/schedules">Set up Bedtime</AppLink>
            </T>
          ) : null}
        </Card>
      ) : null}

      <Card tint="sky">
        <T v="h2">This week</T>
        <View
          style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", height: 120, gap: space.xs }}
        >
          {week.map((d) => {
            const v = d === today ? score?.total : history?.[d];
            return (
              <View
                key={d}
                accessible
                accessibilityLabel={`${weekday(d)}: ${v === undefined ? "no score" : `${v} out of 100`}`}
                style={{ flex: 1, alignItems: "center", gap: 4 }}
              >
                <T v="small">{v ?? "–"}</T>
                <View
                  style={{
                    width: "70%",
                    height: Math.max(4, ((v ?? 0) / 100) * 80),
                    borderRadius: 6,
                    backgroundColor: v === undefined ? t.line : d === today ? t.brand : t.lavender,
                  }}
                />
                <T v="small" muted>
                  {weekday(d).slice(0, 2)}
                </T>
              </View>
            );
          })}
        </View>
        <T v="small" muted>
          A day gets a score when you open STOIC that day. Days without one show “–”.
        </T>
      </Card>

      <Card>
        <T v="h2">My goals</T>
        <T v="label">Screen time a day, at most</T>
        <ChipGroup label="Daily screen time goal">
          {SCREEN_GOALS_H.map((h) => (
            <Chip
              key={h}
              label={`${h} h`}
              accessibilityLabel={`${h} ${h === 1 ? "hour" : "hours"}`}
              selected={goals?.screenH === h}
              onPress={() => setGoals({ ...(goals ?? DEFAULT_GOALS), screenH: h })}
            />
          ))}
        </ChipGroup>
        <T v="label" style={{ marginTop: space.sm }}>
          Focus a day
        </T>
        <ChipGroup label="Daily focus goal">
          {FOCUS_GOALS_MIN.map((m) => (
            <Chip
              key={m}
              label={`${m} min`}
              accessibilityLabel={`${m} minutes`}
              selected={goals?.focusMin === m}
              onPress={() => setGoals({ ...(goals ?? DEFAULT_GOALS), focusMin: m })}
            />
          ))}
        </ChipGroup>
      </Card>

      <Card>
        <T v="h3">How the score works</T>
        <Bullets
          items={[
            <T key="s">
              <B>Screen time ({MAX.screen})</B>: full points up to your goal, then less until twice the goal.
            </T>,
            <T key="f">
              <B>Focus ({MAX.focus})</B>: Pebble focus minutes towards your goal.
            </T>,
            <T key="c">
              <B>Choices ({MAX.choices})</B>: when a pause or limit screen appears, how often you choose “Go back”.
            </T>,
            <T key="b">
              <B>Bedtime ({MAX.bedtime})</B>: phone use during last night&apos;s bedtime, down to zero at {BEDTIME_ZERO_MIN}{" "}
              minutes. Calls, messages and alarms don&apos;t count.
            </T>,
          ]}
        />
        <T v="small" muted>
          It&apos;s a mirror, not a grade. There&apos;s no streak to lose, and it stays on this phone.
        </T>
      </Card>
    </Screen>
  );
}
