import type { Metadata } from "next";
import Link from "next/link";
import { CohortPulse } from "@/components/CohortPulse";
import { WeeklyPledge } from "@/components/WeeklyPledge";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: `${SITE_NAME} Circle`,
  description: "Anonymous encouragement from your batch, and one small weekly goal you check in on privately.",
};

export default function CirclePage() {
  return (
    <div className="space-y-10">
      <header className="max-w-3xl space-y-3">
        <h1 className="text-3xl font-bold sm:text-4xl">{SITE_NAME} Circle</h1>
        <p className="text-lg">
          Most of your batch is working on this too. The Circle shows what first-years are doing as a group, and
          helps you keep one small goal each week. There are no leaderboards and no comparing people.
        </p>
      </header>

      <CohortPulse />

      <section aria-labelledby="pledge-h" className="rounded-xl border border-border bg-surface p-5 sm:p-7">
        <h2 id="pledge-h" className="text-2xl font-bold">
          My weekly pledge
        </h2>
        <p className="mt-1 max-w-3xl text-muted">
          Saved only in this browser on this device. Nothing is sent to us. Check-ins are self-reported, because a
          website can&apos;t see how you use your phone (and we wouldn&apos;t want it to).{" "}
          <Link href="/design-note" className="font-bold text-accent">
            Why a website can&apos;t verify screen time
          </Link>
        </p>
        <div className="mt-6">
          <WeeklyPledge />
        </div>
      </section>
    </div>
  );
}
