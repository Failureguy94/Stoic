import { TOTAL_RESPONDENTS, TRIED_TO_CUT_DOWN, getQuestion } from "@/data/survey";

/**
 * Anonymous, aggregate-only encouragement from our survey.
 * Never shows individuals, rankings or comparisons between people.
 */
export function CohortPulse() {
  const used = getQuestion("tools-used");
  const usedSomething = TOTAL_RESPONDENTS - (used.answers.find((a) => a.label === "None")?.count ?? 0);
  const wellbeing = used.answers.find((a) => a.label === "Android Digital Wellbeing")?.count ?? 0;
  const failed = getQuestion("why-failed").answers;

  const stats = [
    {
      big: `${TRIED_TO_CUT_DOWN} of ${TOTAL_RESPONDENTS}`,
      text: "first-years we surveyed have already tried to cut down their phone time.",
    },
    {
      big: `${usedSomething} of ${TOTAL_RESPONDENTS}`,
      text: "have already tried at least one tool, such as Digital Wellbeing, Focus mode or a blocker.",
    },
    {
      big: `${wellbeing} of ${TOTAL_RESPONDENTS}`,
      text: "already use Android Digital Wellbeing, so a free tool on your phone is a normal place to start.",
    },
  ];

  return (
    <section aria-labelledby="pulse-h" className="space-y-5">
      <div>
        <h2 id="pulse-h" className="text-2xl font-bold">
          Cohort pulse
        </h2>
        <p className="mt-1 text-muted">
          Anonymous totals from our survey of {TOTAL_RESPONDENTS} first-years. No names, no rankings.
        </p>
      </div>
      <ul className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <li key={s.big + s.text} className="rounded-lg bg-accent-soft p-5">
            <p className="text-3xl font-bold">{s.big}</p>
            <p className="mt-1">{s.text}</p>
          </li>
        ))}
      </ul>
      <div className="rounded-lg border border-border bg-surface p-5">
        <h3 className="text-lg font-bold">What makes a change stick, according to your batch</h3>
        <p className="mt-1">
          When we asked why tools stopped working, the answers pointed to what helps:
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5">
          <li>
            <strong>Pick something automatic.</strong> {countOf(failed, "Forgot to use it")} people said they simply
            forgot. Schedules and daily limits keep working on busy days.
          </li>
          <li>
            <strong>Start free and built in.</strong> {countOf(failed, "Cost")} mentioned cost and{" "}
            {countOf(failed, "Too many permissions")} mentioned permissions. Your phone&apos;s own settings avoid both.
          </li>
          <li>
            <strong>Keep it simple.</strong> {countOf(failed, "Too complicated")} found tools too complicated. One small
            goal beats five settings.
          </li>
        </ul>
      </div>
    </section>
  );
}

function countOf(list: { label: string; count: number }[], label: string) {
  return list.find((a) => a.label === label)?.count ?? 0;
}
