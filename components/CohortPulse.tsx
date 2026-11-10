import { TOTAL_RESPONDENTS, TRIED_TO_CUT_DOWN, getQuestion } from "@/data/survey";

/** Anonymous, aggregate-only encouragement. Never individuals, rankings or comparisons. */
export function CohortPulse() {
  const used = getQuestion("tools-used").answers;
  const failed = getQuestion("why-failed").answers;
  const count = (list: { label: string; count: number }[], label: string) =>
    list.find((a) => a.label === label)?.count ?? 0;

  const stats = [
    { n: TRIED_TO_CUT_DOWN, text: "have already tried to cut down their phone time.", tint: "bg-peach" },
    {
      n: TOTAL_RESPONDENTS - count(used, "None"),
      text: "have already tried at least one tool, like Digital Wellbeing, Focus mode or a blocker.",
      tint: "bg-sky",
    },
    {
      n: count(used, "Android Digital Wellbeing"),
      text: "use Android Digital Wellbeing, so a free tool already on your phone is a normal place to start.",
      tint: "bg-butter",
    },
  ];

  return (
    <section aria-labelledby="pulse-h" className="space-y-5">
      <div>
        <h2 id="pulse-h" className="text-3xl font-bold">
          Cohort pulse
        </h2>
        <p className="mt-1 text-muted">
          Anonymous totals from our survey of {TOTAL_RESPONDENTS} first-years. No names, no rankings.
        </p>
      </div>
      <ul className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <li key={s.text} className={`pop rounded-[var(--radius-blob)] ${s.tint} p-6`}>
            <p className="font-display text-4xl font-bold">
              {s.n} <span className="text-2xl">of {TOTAL_RESPONDENTS}</span>
            </p>
            <p className="mt-2">{s.text}</p>
          </li>
        ))}
      </ul>
      <div className="rounded-[var(--radius-blob)] border-2 border-line bg-surface p-6">
        <h3 className="text-xl font-bold">What makes a change stick, according to your batch</h3>
        <p className="mt-1">We asked why tools stopped working. The answers point to what helps:</p>
        <ul className="mt-4 grid gap-3 sm:grid-cols-3">
          <li className="rounded-[1.25rem] bg-sky p-4">
            <p className="font-extrabold">
              <span aria-hidden="true">↻ </span>Pick something automatic
            </p>
            <p className="mt-1 text-sm">
              {count(failed, "Forgot to use it")} people simply forgot. Schedules and daily limits keep going on busy
              days.
            </p>
          </li>
          <li className="rounded-[1.25rem] bg-mint p-4">
            <p className="font-extrabold">
              <span aria-hidden="true">⌂ </span>Start free and built in
            </p>
            <p className="mt-1 text-sm">
              {count(failed, "Cost")} mentioned cost and {count(failed, "Too many permissions")} mentioned permissions.
              Your phone&apos;s own settings avoid both.
            </p>
          </li>
          <li className="rounded-[1.25rem] bg-butter p-4">
            <p className="font-extrabold">
              <span aria-hidden="true">✦ </span>Keep it simple
            </p>
            <p className="mt-1 text-sm">
              {count(failed, "Too complicated")} found tools too complicated. One small goal beats five settings.
            </p>
          </li>
        </ul>
      </div>
    </section>
  );
}
