import { useMemo, useState } from "react";
import type { Mood } from "@/components/Pebble";
import { device } from "@/lib/device";
import type { FinishedSession } from "@/lib/focus";
import { computeScore, type Score } from "@/lib/score";
import { KEYS, useStored } from "@/lib/storage";
import { todayScreenMs } from "@/lib/todayUsage";
import { useForeground } from "@/lib/useForeground";
import { dayKey } from "@/lib/week";

export interface Goals {
  screenH: number;
  focusMin: number;
}
export const DEFAULT_GOALS: Goals = { screenH: 3, focusMin: 50 };

const NO_LOG: FinishedSession[] = [];
const H = 3_600_000;
const MIN = 60_000;

/** Today's day score and everything it is made from. Refreshes whenever the screen is shown. */
export function useDayScore() {
  const [goals, setGoals] = useStored<Goals>(KEYS.scoreGoals, DEFAULT_GOALS);
  const [log] = useStored<FinishedSession[]>(KEYS.focusLog, NO_LOG);
  const [screenMs, setScreenMs] = useState<number | null>(null);
  const [access, setAccess] = useState(true);
  const [choices, setChoices] = useState({ wentBack: 0, overrode: 0 });
  const [bedtimeMin, setBedtimeMin] = useState<number | null>(null);

  useForeground(() => {
    if (!device) return;
    setAccess(device.hasUsageAccess());
    setChoices(device.getChoicesToday());
    todayScreenMs().then(setScreenMs);
    device.getBedtimeUse().then((b) => setBedtimeMin(b ? b.minutes : null));
  });

  const today = dayKey();
  const focusMs = useMemo(
    () => (log ?? []).filter((s) => dayKey(new Date(s.startedAt)) === today).reduce((sum, s) => sum + s.focusedMs, 0),
    [log, today],
  );

  const score: Score | null = useMemo(() => {
    if (screenMs === null || goals === undefined) return null;
    return computeScore({
      screenMs,
      screenGoalMs: goals.screenH * H,
      focusMs,
      focusGoalMs: goals.focusMin * MIN,
      wentBack: choices.wentBack,
      overrode: choices.overrode,
      bedtimeMin,
    });
  }, [screenMs, goals, focusMs, choices, bedtimeMin]);

  return { score, goals, setGoals, access, bedtimeMin, screenMs, focusMs, today };
}

/** Pebble's mood for a score. */
export function moodFor(total: number): Mood {
  if (total >= 80) return "cheer";
  if (total >= 60) return "happy";
  if (total >= 40) return "calm";
  return "sleepy";
}
