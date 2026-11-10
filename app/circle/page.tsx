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
    <div className="space-y-12">
      <header className="max-w-3xl space-y-3">
        <h1 className="text-4xl font-bold sm:text-5xl">{SITE_NAME} Circle</h1>
        <p className="text-lg">
          Most of your batch is working on this too. The Circle shows what first-years are doing <em>together</em>,
          and helps you keep one small goal a week. No leaderboards, no comparing people, no guilt trips.
        </p>
      </header>

      <CohortPulse />

      <section aria-labelledby="pledge-h" className="rounded-[var(--radius-blob)] border-2 border-line bg-surface p-5 sm:p-8">
        <h2 id="pledge-h" className="text-3xl font-bold">
          My weekly pledge
        </h2>
        <p className="mt-2 max-w-3xl text-muted">
          <span aria-hidden="true">🔒 </span>Saved only in this browser on this device, and never sent to us. Check-ins
          are self-reported, because a website can&apos;t see how you use your phone (and we wouldn&apos;t want it
          to).{" "}
          <Link href="/design-note" className="font-extrabold text-brand">
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
