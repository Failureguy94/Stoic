import Link from "next/link";
import { FixPicker } from "@/components/FixPicker";
import { Pebble } from "@/components/Pebble";
import { SITE_NAME } from "@/lib/site";
import { TOTAL_RESPONDENTS, TRIED_TO_CUT_DOWN } from "@/data/survey";
import { tools } from "@/data/tools";

export default function Home() {
  return (
    <div className="space-y-12">
      <header className="grid items-center gap-6 pt-4 md:grid-cols-[1fr_auto]">
        <div className="space-y-4">
          <p className="inline-block rounded-full bg-butter px-4 py-1 font-bold text-warn-ink">
            Made by a first-year, for first-years
          </p>
          <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
            Hey! What&apos;s eating your study time?
          </h1>
          <p className="max-w-2xl text-lg">
            {SITE_NAME} is a short, friendly list of tools that actually help, with straight answers to three
            questions: <strong>does it cost money</strong>, <strong>what does it want access to</strong>, and{" "}
            <strong>will it still work when I forget about it</strong>.
          </p>
        </div>
        <div className="hidden justify-self-center md:block">
          <Pebble mood="cheer" size={200} float />
        </div>
      </header>

      <FixPicker />

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
            phone time. You&apos;re in good company.
          </p>
          <p className="mt-3">
            <Link href="/circle" className="font-extrabold text-good-ink">
              Join the {SITE_NAME} Circle and pick one small weekly goal
            </Link>
          </p>
        </div>
      </section>

      <section aria-labelledby="explore-h">
        <h2 id="explore-h" className="text-3xl font-bold">
          Have a look around
        </h2>
        <ul className="mt-5 grid gap-4 sm:grid-cols-3">
          <Explore href="/tools" title="Compare tools" tint="bg-peach" icon="⚖️">
            All {tools.length} tools side by side. Filter by phone, laptop or free-only.
          </Explore>
          <Explore href="/guides" title="Setup guides" tint="bg-sky" icon="📘">
            Step-by-step help with screenshots, written by a student.
          </Explore>
          <Explore href="/survey" title="Survey results" tint="bg-butter" icon="📊">
            What {TOTAL_RESPONDENTS} first-years told us, and what it changed here.
          </Explore>
        </ul>
      </section>
    </div>
  );
}

function Explore({
  href,
  title,
  tint,
  icon,
  children,
}: {
  href: string;
  title: string;
  tint: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <li className={`pop rounded-[var(--radius-blob)] ${tint} p-5`}>
      <p aria-hidden="true" className="text-3xl">
        {icon}
      </p>
      <Link href={href} className="mt-2 block font-display text-xl font-bold">
        {title}
      </Link>
      <p className="mt-1">{children}</p>
    </li>
  );
}
