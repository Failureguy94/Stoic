import Link from "next/link";
import { Pebble } from "@/components/Pebble";
import { SITE_NAME } from "@/lib/site";
import { TOTAL_RESPONDENTS, TRIED_TO_CUT_DOWN } from "@/data/survey";

const FEATURES: { icon: string; title: string; body: string; doc: string; tint: string }[] = [
  {
    icon: "✋",
    title: "Limits and pauses",
    body: "A 10-second pause before a distracting app, daily limits, fewer opens, and a gentle “Still worth it?” check-in.",
    doc: "limits",
    tint: "bg-peach",
  },
  {
    icon: "🌙",
    title: "Bedtime and schedules",
    body: "Hours when apps stay closed, with Do Not Disturb. Calls, messages and alarms always work.",
    doc: "schedules",
    tint: "bg-lavender",
  },
  {
    icon: "⏱️",
    title: "Focus with Pebble",
    body: "A focus timer that grows Pebble, and can block apps or switch the internet off until you're done.",
    doc: "focus",
    tint: "bg-mint",
  },
  {
    icon: "🔔",
    title: "Notifications",
    body: "See which apps interrupt you most, and get the noisy ones in one summary at times you choose.",
    doc: "notifications",
    tint: "bg-sky",
  },
  {
    icon: "🌐",
    title: "Websites and internet",
    body: "Block sites in every browser on your phone, always or only while you focus.",
    doc: "websites",
    tint: "bg-butter",
  },
  {
    icon: "🔒",
    title: "Strict mode",
    body: "Make your own rules firm for a while, so a weak moment can't undo them.",
    doc: "strict",
    tint: "bg-rose",
  },
  {
    icon: "🌟",
    title: "Your day score",
    body: "One number for your day, from goals you set, explained in plain words. No streaks to lose.",
    doc: "day-score",
    tint: "bg-lavender",
  },
  {
    icon: "📊",
    title: "Screen time you can trust",
    body: "Your real per-app time, plus your own record that uninstalling an app can't erase.",
    doc: "screen-time",
    tint: "bg-mint",
  },
];

export default function Home() {
  return (
    <div className="space-y-12">
      <header className="grid items-center gap-6 pt-4 md:grid-cols-[1fr_auto]">
        <div className="space-y-4">
          <p className="inline-block rounded-full bg-butter px-4 py-1 font-bold text-warn-ink">
            Made by a first-year, for first-years
          </p>
          <h1 className="text-4xl font-bold leading-tight sm:text-5xl">Your phone, on your terms.</h1>
          <p className="max-w-2xl text-lg">
            {SITE_NAME} is a free Android app that helps you take back your study time: limits, bedtime, focus,
            notification control and website blocking in one place. It&apos;s <strong>kind</strong> (no streaks, no
            shaming), <strong>private</strong> (everything stays on your phone), and it{" "}
            <strong>keeps working when you forget about it</strong>.
          </p>
          <p className="flex flex-wrap gap-3">
            <Link href="/docs/getting-started" className="pop inline-block rounded-full bg-brand px-5 py-2.5 font-extrabold text-brand-ink no-underline">
              Get started
            </Link>
            <a href="#features" className="inline-block rounded-full border-2 border-line px-5 py-2.5 font-extrabold no-underline">
              See what it does
            </a>
          </p>
        </div>
        <div className="hidden justify-self-center md:block">
          <Pebble mood="cheer" size={200} float />
        </div>
      </header>

      <section aria-labelledby="features-h" id="features">
        <h2 id="features-h" className="text-3xl font-bold">
          What {SITE_NAME} does
        </h2>
        <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <li key={f.title} className={`pop flex flex-col rounded-[var(--radius-blob)] ${f.tint} p-5`}>
              <p aria-hidden="true" className="text-3xl">
                {f.icon}
              </p>
              <h3 className="mt-2 font-display text-xl font-bold">{f.title}</h3>
              <p className="mt-1 flex-1">{f.body}</p>
              <p className="mt-3">
                <Link href={`/docs/${f.doc}`} className="font-extrabold">
                  How it works<span className="sr-only">: {f.title}</span> ›
                </Link>
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="private-h" className="rounded-[var(--radius-blob)] border-2 border-line bg-surface p-6 sm:p-8">
        <h2 id="private-h" className="text-2xl font-bold">
          Private by design
        </h2>
        <ul className="mt-3 list-disc space-y-2 pl-6">
          <li>No account. Your data stays on your phone. The app only goes online to download its own updates.</li>
          <li>Each permission is asked for only when you switch on the feature that needs it.</li>
          <li>
            Limits only see <strong>which app is in front</strong>, never what&apos;s on your screen or what you type.
          </li>
          <li>Website blocking happens on your phone. It never sees the pages you read.</li>
        </ul>
        <p className="mt-4">
          <Link href="/about" className="font-extrabold">
            Every permission and what it&apos;s for
          </Link>
        </p>
      </section>

      <section aria-labelledby="get-h" className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-[var(--radius-blob)] bg-sky p-6">
          <h2 id="get-h" className="text-2xl font-bold">
            Get {SITE_NAME}
          </h2>
          <p className="mt-2">
            {SITE_NAME} for Android is being tested on real phones and isn&apos;t on the Play Store yet. The{" "}
            <Link href="/docs">how-to guides</Link> show everything it does.
          </p>
          <p className="mt-2">
            On a laptop? <Link href="/docs/browser">{SITE_NAME} for your browser</Link> brings pauses, limits,
            focus and a calmer YouTube to Chrome and Edge, and{" "}
            <Link href="/docs/desktop">{SITE_NAME} for Windows and Mac</Link> does the same for apps like games and
            Discord.
          </p>
        </div>
        <div className="rounded-[var(--radius-blob)] bg-butter p-6">
          <h2 className="text-2xl font-bold">On iPhone?</h2>
          <p className="mt-2">
            Apple only lets approved apps see screen time or pause other apps. Until {SITE_NAME} has that approval, the
            app is Android only. The <Link href="/circle">Circle</Link> works in any browser.
          </p>
        </div>
      </section>

      <section
        aria-labelledby="batch-h"
        className="flex flex-col items-start gap-5 rounded-[var(--radius-blob)] bg-mint p-6 sm:flex-row sm:items-center sm:p-8"
      >
        <p aria-hidden="true" className="font-display text-6xl font-bold leading-none text-good-ink">
          {TRIED_TO_CUT_DOWN}/{TOTAL_RESPONDENTS}
        </p>
        <div>
          <h2 id="batch-h" className="text-2xl font-bold">
            Your batch is in this too
          </h2>
          <p className="mt-1">
            {TRIED_TO_CUT_DOWN} of the {TOTAL_RESPONDENTS} first-years we asked have already tried to cut down their
            phone time. Their answers shaped what {SITE_NAME} does. <Link href="/survey">See the survey</Link>.
          </p>
          <p className="mt-3">
            <Link href="/circle" className="font-extrabold text-good-ink">
              Join the {SITE_NAME} Circle and pick one small weekly goal
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
