import Link from "next/link";
import { FixPicker } from "@/components/FixPicker";
import { SITE_NAME } from "@/lib/site";
import { TOTAL_RESPONDENTS, TRIED_TO_CUT_DOWN } from "@/data/survey";
import { tools } from "@/data/tools";

export default function Home() {
  return (
    <div className="space-y-10">
      <header className="max-w-3xl space-y-3">
        <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
          Less scrolling, more studying. Pick one tool that fits you.
        </h1>
        <p className="text-lg">
          {SITE_NAME} is a short, checked list of digital wellness tools for first-year students, with
          plain answers to the three questions that matter: <strong>does it cost money</strong>,{" "}
          <strong>what permissions does it want</strong>, and <strong>will it work even when I forget</strong>.
        </p>
      </header>

      <FixPicker />

      <section aria-labelledby="pulse-h" className="rounded-xl bg-accent-soft p-5 sm:p-7">
        <h2 id="pulse-h" className="text-2xl font-bold">
          You are not the only one
        </h2>
        <p className="mt-2 text-lg">
          <strong>
            {TRIED_TO_CUT_DOWN} of {TOTAL_RESPONDENTS}
          </strong>{" "}
          first-years we surveyed have already tried to cut down their phone time. Most of your batch is working
          on this too.
        </p>
        <p className="mt-3">
          <Link href="/circle" className="font-bold text-accent">
            Join the {SITE_NAME} Circle and pick one small weekly goal
          </Link>
        </p>
      </section>

      <section aria-labelledby="more-h">
        <h2 id="more-h" className="text-2xl font-bold">
          Explore the hub
        </h2>
        <ul className="mt-4 grid gap-4 sm:grid-cols-3">
          <HubLink href="/tools" title="Compare tools">
            All {tools.length} tools side by side, with filters for platform, purpose and free-only.
          </HubLink>
          <HubLink href="/guides" title="Setup guides">
            Step-by-step guides written by a student, with screenshots.
          </HubLink>
          <HubLink href="/survey" title="Survey results">
            What {TOTAL_RESPONDENTS} first-years told us, and how it shaped this hub.
          </HubLink>
        </ul>
      </section>
    </div>
  );
}

function HubLink({ href, title, children }: { href: string; title: string; children: React.ReactNode }) {
  return (
    <li className="rounded-lg border border-border bg-surface p-4">
      <Link href={href} className="text-lg font-bold text-accent">
        {title}
      </Link>
      <p className="mt-1">{children}</p>
    </li>
  );
}
