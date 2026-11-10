import type { Metadata } from "next";
import Link from "next/link";
import { BarChart } from "@/components/BarChart";
import { SURVEY, TOTAL_RESPONDENTS, TRIED_TO_CUT_DOWN } from "@/data/survey";
import { SITE_NAME } from "@/lib/site";
import { tools } from "@/data/tools";

export const metadata: Metadata = {
  title: "Survey results",
  description: `What ${TOTAL_RESPONDENTS} first-year students told us about phone use and digital wellness tools.`,
};

const CHANGES: { finding: string; change: React.ReactNode }[] = [
  {
    finding: "12 of 17 wanted a short trusted list",
    change: (
      <>
        We kept the list to {tools.length} tools, each checked on its official page, and dropped one we could not verify.
      </>
    ),
  },
  {
    finding: "11 of 17 wanted step-by-step guides",
    change: (
      <>
        We wrote <Link href="/guides">three setup guides</Link> with screenshots and an &ldquo;if it didn&apos;t
        work&rdquo; box.
      </>
    ),
  },
  {
    finding: "Tools failed because of permissions (6), cost (6) and forgetting (6)",
    change: (
      <>
        Every tool shows three labels up front: cost (Free / Freemium / Paid), permission level, and whether it
        works <strong>automatically</strong> or needs you to remember.
      </>
    ),
  },
  {
    finding: "YouTube/reels (10) and social media (8) were the top distractions",
    change: (
      <>
        These are the first two options in the <Link href="/">Find your fix</Link> picker, and one guide is
        dedicated to YouTube.
      </>
    ),
  },
  {
    finding: "11 study on a Windows laptop, but 9 already use Android Digital Wellbeing",
    change: (
      <>
        We cover Android, Windows and browser tools, plus a smaller iPhone section, and start with the free
        built-in tools people already have.
      </>
    ),
  },
  {
    finding: `${TRIED_TO_CUT_DOWN} of 17 had tried to cut down, but many said it did not last`,
    change: (
      <>
        We added the <Link href="/circle">{SITE_NAME} Circle</Link>: one small weekly goal, gentle check-ins, and
        no shaming.
      </>
    ),
  },
];

export default function SurveyPage() {
  return (
    <div className="space-y-10">
      <header className="max-w-3xl space-y-3">
        <h1 className="text-3xl font-bold sm:text-4xl">Survey results</h1>
        <p className="text-lg">
          We asked {TOTAL_RESPONDENTS} first-year students at IIIT Nagpur about their phone use, using a Google
          Form. It is a small sample from one college, so treat these as signals, not statistics.
        </p>
        <p className="rounded-lg bg-accent-soft p-4 text-lg">
          <strong>
            {TRIED_TO_CUT_DOWN} of {TOTAL_RESPONDENTS}
          </strong>{" "}
          had already tried to cut down. Many said it did not last, because they ignored the tool or turned it off.
        </p>
      </header>

      <section aria-labelledby="charts-h" className="space-y-5">
        <h2 id="charts-h" className="text-2xl font-bold">
          The numbers
        </h2>
        <div className="grid gap-5 lg:grid-cols-2">
          {SURVEY.map((q) => (
            <BarChart key={q.id} q={q} total={TOTAL_RESPONDENTS} />
          ))}
        </div>
      </section>

      <section aria-labelledby="changed-h" className="max-w-3xl">
        <h2 id="changed-h" className="text-2xl font-bold">
          What this changed in the hub
        </h2>
        <ul className="mt-4 space-y-4">
          {CHANGES.map((c) => (
            <li key={c.finding} className="rounded-lg border border-border bg-surface p-4">
              <p className="font-bold">{c.finding}</p>
              <p className="mt-1 [&_a]:font-bold [&_a]:text-accent">{c.change}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
