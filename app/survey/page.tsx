import type { Metadata } from "next";
import Link from "next/link";
import { BarChart } from "@/components/BarChart";
import { Pebble } from "@/components/Pebble";
import { SURVEY, TOTAL_RESPONDENTS, TRIED_TO_CUT_DOWN } from "@/data/survey";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Survey results",
  description: `What ${TOTAL_RESPONDENTS} first-year students told us about phone use, and how it shaped STOIC.`,
};

const TINTS = ["bg-peach", "bg-mint", "bg-sky", "bg-butter", "bg-lavender", "bg-rose", "bg-mint"];

export default function SurveyPage() {
  const changes: { finding: string; change: React.ReactNode }[] = [
    {
      finding: "12 of 17 wanted a short trusted list",
      change: <>Instead of a list of other apps, {SITE_NAME} puts the tools in one place: limits, bedtime, focus, notifications and website blocking.</>,
    },
    {
      finding: "11 of 17 wanted step-by-step guides",
      change: (
        <>
          Every feature has a short <Link href="/docs">how-to guide</Link> with an &ldquo;if it didn&apos;t work&rdquo;
          box.
        </>
      ),
    },
    {
      finding: "Tools failed because of permissions (6), cost (6) and forgetting (6)",
      change: (
        <>
          {SITE_NAME} is free, asks for each permission only when you switch on the feature that needs it, and works
          automatically once set up.
        </>
      ),
    },
    {
      finding: "YouTube/reels (10) and social media (8) were the top distractions",
      change: (
        <>
          <Link href="/docs/limits">Limits, opens per day and check-ins</Link> and{" "}
          <Link href="/docs/websites">website blocking</Link> all start with those apps.
        </>
      ),
    },
    {
      finding: "11 study on a Windows laptop",
      change: <>A {SITE_NAME} browser extension and laptop app are next, so the same rules can follow you to your laptop.</>,
    },
    {
      finding: `${TRIED_TO_CUT_DOWN} of 17 had tried to cut down, but many said it didn't last`,
      change: (
        <>
          Schedules run by themselves, <Link href="/docs/strict">strict mode</Link> keeps rules firm through a weak
          moment, and the <Link href="/circle">{SITE_NAME} Circle</Link> offers one small weekly goal with no shaming.
        </>
      ),
    },
  ];

  return (
    <div className="space-y-12">
      <header className="flex flex-col gap-6 md:flex-row md:items-center">
        <div className="max-w-3xl space-y-3">
          <h1 className="text-4xl font-bold sm:text-5xl">Survey results</h1>
          <p className="text-lg">
            We asked {TOTAL_RESPONDENTS} first-years at IIIT Nagpur about their phones using a Google Form. It&apos;s
            a small group from one college, so read these as signals, not statistics.
          </p>
          <p className="rounded-[1.25rem] bg-mint p-4 text-lg">
            <strong>
              {TRIED_TO_CUT_DOWN} of {TOTAL_RESPONDENTS}
            </strong>{" "}
            had already tried to cut down. Many said it didn&apos;t last because they ignored the tool or switched it
            off.
          </p>
        </div>
        <Pebble mood="calm" size={130} className="hidden md:block" />
      </header>

      <section aria-labelledby="charts-h" className="space-y-5">
        <h2 id="charts-h" className="text-3xl font-bold">
          The numbers
        </h2>
        <div className="grid gap-5 lg:grid-cols-2">
          {SURVEY.map((q, i) => (
            <BarChart key={q.id} q={q} total={TOTAL_RESPONDENTS} tint={TINTS[i % TINTS.length]} />
          ))}
        </div>
      </section>

      <section aria-labelledby="changed-h" className="max-w-3xl">
        <h2 id="changed-h" className="text-3xl font-bold">
          What this changed in the hub
        </h2>
        <ol className="mt-5 space-y-4">
          {changes.map((c, i) => (
            <li key={c.finding} className="flex gap-4 rounded-[1.25rem] border-2 border-line bg-surface p-4">
              <span
                aria-hidden="true"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand font-display font-bold text-brand-ink"
              >
                {i + 1}
              </span>
              <div>
                <p className="font-extrabold">{c.finding}</p>
                <p className="mt-1 [&_a]:font-extrabold [&_a]:text-brand">{c.change}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
