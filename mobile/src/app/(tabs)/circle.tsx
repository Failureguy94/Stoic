import { useEffect, useRef, useState, type ComponentRef } from "react";
import { AccessibilityInfo, TextInput, View } from "react-native";
import { TOTAL_RESPONDENTS, TRIED_TO_CUT_DOWN, getQuestion } from "@shared/survey";
import { Pebble, type Mood } from "@/components/Pebble";
import { AppLink, B, Button, Card, Chip, ChipGroup, Screen, T } from "@/components/ui";
import { device } from "@/lib/device";
import { focusedMsInWeek, sessionsInWeek, type FinishedSession } from "@/lib/focus";
import {
  GOAL_IDEAS,
  MAX_GOAL_LENGTH,
  REPLIES,
  checkIn,
  cleanGoal,
  recentWeeks,
  startPledge,
  totalCheckIns,
  weeksKept,
  type Outcome,
  type Pledge,
} from "@/lib/pledge";
import { SITE_NAME } from "@/lib/site";
import { KEYS, useStored } from "@/lib/storage";
import { formatDuration, shortDate, weekOf } from "@/lib/week";
import { font, radius, space, useTheme, type Theme, type Tint } from "@/theme";

const NO_LOG: FinishedSession[] = [];
const count = (list: { label: string; count: number }[], label: string) => list.find((a) => a.label === label)?.count ?? 0;

export default function Circle() {
  return (
    <Screen tab>
      <View style={{ gap: space.sm }}>
        <T v="h1">{SITE_NAME} Circle</T>
        <T v="lead">
          Most of your batch is working on this too. The Circle shows what first-years are doing together, and helps you keep one
          small goal a week. No leaderboards, no comparing people, no guilt trips.
        </T>
      </View>
      <CohortPulse />
      <WeeklyPledge />
    </Screen>
  );
}

/** Anonymous, aggregate-only encouragement. Never individuals, rankings or comparisons. */
function CohortPulse() {
  const used = getQuestion("tools-used").answers;
  const failed = getQuestion("why-failed").answers;
  const stats: { n: number; text: string; tint: Tint }[] = [
    { n: TRIED_TO_CUT_DOWN, text: "have already tried to cut down their phone time.", tint: "peach" },
    {
      n: TOTAL_RESPONDENTS - count(used, "None"),
      text: "have already tried at least one tool, like Digital Wellbeing, Focus mode or a blocker.",
      tint: "sky",
    },
    {
      n: count(used, "Android Digital Wellbeing"),
      text: "use Android Digital Wellbeing, so a free tool already on your phone is a normal place to start.",
      tint: "butter",
    },
  ];
  return (
    <View style={{ gap: space.md }}>
      <T v="h2">Cohort pulse</T>
      <T muted>Anonymous totals from our survey of {TOTAL_RESPONDENTS} first-years. No names, no rankings.</T>
      {stats.map((s) => (
        <Card key={s.text} tint={s.tint}>
          <View accessible accessibilityLabel={`${s.n} of ${TOTAL_RESPONDENTS} ${s.text}`}>
            <T v="h1">
              {s.n} <T v="h3">of {TOTAL_RESPONDENTS}</T>
            </T>
            <T>{s.text}</T>
          </View>
        </Card>
      ))}
      <Card>
        <T v="h3">What makes a change stick, according to your batch</T>
        <T>
          <B>↻ Pick something automatic. </B>
          {count(failed, "Forgot to use it")} people simply forgot. Schedules and daily limits keep going on busy days.
        </T>
        <T>
          <B>⌂ Start free and built in. </B>
          {count(failed, "Cost")} mentioned cost and {count(failed, "Too many permissions")} mentioned permissions. Your
          phone&apos;s own settings avoid both.
        </T>
        <T>
          <B>✦ Keep it simple. </B>
          {count(failed, "Too complicated")} found tools too complicated. One small goal beats five settings.
        </T>
      </Card>
    </View>
  );
}

function WeeklyPledge() {
  const [pledge, setPledge] = useStored<Pledge | null>(KEYS.pledge, null);
  const [log] = useStored<FinishedSession[]>(KEYS.focusLog, NO_LOG);
  const [message, setMessage] = useState("");
  const [mood, setMood] = useState<Mood>("calm");
  const [editing, setEditing] = useState(false);

  const say = (text: string, m: Mood) => {
    setMessage(text);
    setMood(m);
    AccessibilityInfo.announceForAccessibility(text);
  };

  /** This week's measured screen time, if Usage access is on (Android). Otherwise the check-in is self-reported. */
  const measuredThisWeek = async (): Promise<number | undefined> => {
    if (!device?.hasUsageAccess()) return undefined;
    try {
      const days = await device.getUsageByDay(7);
      const week = weekOf();
      return days.filter((d) => weekOf(new Date(`${d.day}T12:00:00`)) === week).reduce((sum, d) => sum + d.totalMs, 0);
    } catch {
      return undefined;
    }
  };

  return (
    <Card>
      <View style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
        <View style={{ flex: 1, gap: 4 }}>
          <T v="h2">My weekly pledge</T>
          <T v="small" muted>
            🔒 Saved only on this phone and never sent to us.
          </T>
        </View>
        <Pebble mood={mood} size={80} float />
      </View>

      {pledge === undefined ? (
        <T muted>Loading your pledge…</T>
      ) : !pledge || editing ? (
        <GoalForm
          initial={pledge?.goal}
          submitLabel={pledge ? "Save goal" : "Start my pledge"}
          onCancel={pledge ? () => setEditing(false) : undefined}
          onSubmit={(goal) => {
            if (pledge) {
              setPledge({ ...pledge, goal });
              setEditing(false);
              say(`Goal updated to “${goal}”. Your weeks so far are kept.`, "happy");
            } else {
              setPledge(startPledge(goal));
              say(`Pledge saved: “${goal}”. Check in any time this week.`, "happy");
            }
          }}
        />
      ) : (
        <Tracker
          pledge={pledge}
          focusLog={log ?? []}
          onCheckIn={async (o) => {
            const measured = await measuredThisWeek();
            setPledge(checkIn(pledge, o, new Date(), measured));
            say(REPLIES[o], o === "kept" ? "cheer" : o === "partly" ? "happy" : "sleepy");
          }}
          onEdit={() => setEditing(true)}
          onDelete={() => {
            setPledge(null);
            say("Your pledge and check-ins were removed from this phone.", "calm");
          }}
        />
      )}

      <View accessibilityLiveRegion="polite" style={{ minHeight: 24 }}>
        {message ? <T v="h3">{message}</T> : null}
      </View>
      <AppLink href="/design-note">How check-ins are verified, and what still can&apos;t be</AppLink>
    </Card>
  );
}

function GoalForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial?: string;
  submitLabel: string;
  onSubmit: (goal: string) => void;
  onCancel?: () => void;
}) {
  const t = useTheme();
  const startsCustom = !!initial && !GOAL_IDEAS.includes(initial);
  const [choice, setChoice] = useState<string>(startsCustom ? "custom" : (initial ?? GOAL_IDEAS[0]));
  const [custom, setCustom] = useState(startsCustom ? initial! : "");
  const [error, setError] = useState("");
  const input = useRef<ComponentRef<typeof TextInput>>(null);

  const submit = () => {
    const goal = cleanGoal(choice === "custom" ? custom : choice);
    if (!goal) {
      const text = "Write your goal in a few words, or pick one of the ideas.";
      setError(text);
      AccessibilityInfo.announceForAccessibility(text);
      input.current?.focus();
      return;
    }
    setError("");
    onSubmit(goal);
  };

  return (
    <View style={{ gap: space.md }}>
      <T v="h3">Pick one small goal for this week</T>
      <T muted>Small and specific beats big and vague.</T>
      <ChipGroup label="Goal ideas">
        {GOAL_IDEAS.map((g) => (
          <Chip key={g} label={g} selected={choice === g} onPress={() => setChoice(g)} />
        ))}
        <Chip label="My own goal" icon="✏️" selected={choice === "custom"} onPress={() => setChoice("custom")} />
      </ChipGroup>
      {choice === "custom" ? (
        <View style={{ gap: 6 }}>
          <T v="label" nativeID="goal-label">
            My goal (up to {MAX_GOAL_LENGTH} characters)
          </T>
          <TextInput
            ref={input}
            accessibilityLabel={`My goal, up to ${MAX_GOAL_LENGTH} characters`}
            accessibilityLabelledBy="goal-label"
            value={custom}
            onChangeText={setCustom}
            maxLength={MAX_GOAL_LENGTH}
            returnKeyType="done"
            onSubmitEditing={submit}
            placeholderTextColor={t.muted}
            style={{
              minHeight: 48,
              borderWidth: 2,
              borderColor: error ? t.alertInk : t.field,
              borderRadius: radius.card,
              paddingHorizontal: space.lg,
              paddingVertical: space.sm,
              fontFamily: font.body,
              fontSize: 16,
              color: t.ink,
              backgroundColor: t.surface,
            }}
          />
        </View>
      ) : null}
      {error ? (
        <T v="label" color={t.alertInk} accessibilityRole="alert">
          {error}
        </T>
      ) : null}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.md, alignItems: "center" }}>
        <Button label={submitLabel} onPress={submit} />
        {onCancel ? <Button kind="quiet" label="Cancel" onPress={onCancel} /> : null}
      </View>
    </View>
  );
}

function weekLook(t: Theme, outcome?: Outcome) {
  switch (outcome) {
    case "kept":
      return { symbol: "★", label: "Kept", bg: t.mint, fg: t.goodInk, dashed: false };
    case "partly":
      return { symbol: "◐", label: "Partly", bg: t.butter, fg: t.warnInk, dashed: false };
    case "rest":
      return { symbol: "☾", label: "Rest week", bg: t.lavender, fg: t.ink, dashed: false };
    default:
      return { symbol: "·", label: "No check-in", bg: t.surface, fg: t.muted, dashed: true };
  }
}

function Tracker({
  pledge,
  focusLog,
  onCheckIn,
  onEdit,
  onDelete,
}: {
  pledge: Pledge;
  focusLog: FinishedSession[];
  onCheckIn: (o: Outcome) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const t = useTheme();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const goalRef = useRef<ComponentRef<typeof View>>(null);
  const thisWeek = weekOf();
  const current = pledge.checkIns[thisWeek];
  const kept = weeksKept(pledge);
  const total = totalCheckIns(pledge);
  const sessions = sessionsInWeek(focusLog).length;

  // After editing the goal, move screen-reader focus back to it.
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (goalRef.current) AccessibilityInfo.sendAccessibilityEvent(goalRef.current, "focus");
  }, [pledge.goal]);

  const choices: [Outcome, string][] = [
    ["kept", "★ I kept it"],
    ["partly", "◐ Partly"],
    ["rest", "☾ Not this week"],
  ];

  return (
    <View style={{ gap: space.lg }}>
      <View ref={goalRef} accessible accessibilityLabel={`My goal this week: ${pledge.goal}`} style={{ backgroundColor: t.lavender, borderRadius: radius.card, padding: space.lg }}>
        <T v="small" muted style={{ fontFamily: font.xbold, textTransform: "uppercase", letterSpacing: 1 }}>
          My goal this week
        </T>
        <T v="h2">{pledge.goal}</T>
      </View>

      <View style={{ gap: space.sm }}>
        <T v="label">
          Week of {shortDate(thisWeek)}: how did it go?{current ? " (you can change your answer)" : ""}
        </T>
        <ChipGroup label={`Week of ${shortDate(thisWeek)}: how did it go?`}>
          {choices.map(([o, label]) => (
            <Chip key={o} label={label} selected={current?.outcome === o} onPress={() => onCheckIn(o)} />
          ))}
        </ChipGroup>
        {current ? (
          <T v="small" muted>
            {current.measuredMs !== undefined
              ? `Screen time this week so far: ${formatDuration(current.measuredMs)} (measured by your phone).`
              : "This check-in is self-reported."}
          </T>
        ) : null}
        {sessions > 0 ? (
          <T v="small" muted>
            Focus this week: {sessions} {sessions === 1 ? "session" : "sessions"}, {formatDuration(focusedMsInWeek(focusLog))}.
          </T>
        ) : null}
      </View>

      <View style={{ gap: space.sm }}>
        <T v="lead">
          <B>{kept}</B> {kept === 1 ? "week" : "weeks"} kept or partly kept, from {total} {total === 1 ? "check-in" : "check-ins"}.
        </T>
        <T v="small" muted>
          This number only goes up. Rest weeks never take anything away.
        </T>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
          {recentWeeks(pledge).map((k) => {
            const look = weekLook(t, pledge.checkIns[k]?.outcome);
            return (
              <View
                key={k}
                accessible
                accessibilityLabel={`Week of ${shortDate(k)}: ${look.label}`}
                style={{
                  width: 78,
                  alignItems: "center",
                  borderRadius: 16,
                  borderWidth: 2,
                  borderStyle: look.dashed ? "dashed" : "solid",
                  borderColor: look.dashed ? t.line : look.fg,
                  backgroundColor: look.bg,
                  paddingVertical: 8,
                }}
              >
                <T v="h3" color={look.fg} accessibilityRole="none">
                  {look.symbol}
                </T>
                <T v="small" color={look.fg} style={{ fontFamily: font.xbold, fontSize: 12 }}>
                  {look.label}
                </T>
                <T v="small" color={look.fg} style={{ fontSize: 12 }}>
                  {shortDate(k)}
                </T>
              </View>
            );
          })}
        </View>
      </View>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm, alignItems: "center" }}>
        <Button kind="quiet" label="Change my goal" onPress={onEdit} />
        {!confirmDelete ? (
          <Button kind="quiet" label="Delete my pledge data" onPress={() => setConfirmDelete(true)} />
        ) : (
          <View style={{ gap: space.sm }}>
            <T>Delete your goal and all check-ins from this phone?</T>
            <View style={{ flexDirection: "row", gap: space.md }}>
              <Button kind="outline" label="Yes, delete" onPress={onDelete} />
              <Button kind="quiet" label="Keep it" onPress={() => setConfirmDelete(false)} />
            </View>
          </View>
        )}
      </View>
    </View>
  );
}
