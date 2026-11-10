import type { Metadata } from "next";
import Link from "next/link";
import { GUIDES } from "@/lib/guides";
import { Pebble } from "@/components/Pebble";

export const metadata: Metadata = {
  title: "Setup guides",
  description: "Step-by-step setup guides for digital wellness tools, written and tested by a student.",
};

const TINTS = ["bg-mint", "bg-peach", "bg-sky"];
const ICONS = ["📱", "🔕", "📺"];

export default function GuidesIndex() {
  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-6 md:flex-row md:items-center">
        <div className="max-w-3xl space-y-3">
          <h1 className="text-4xl font-bold sm:text-5xl">Setup guides</h1>
          <p className="text-lg">
            11 of the 17 students we asked wanted step-by-step guides, so here they are. Each one is written by a
            student, tested on a real device, and follows the same pattern: who it&apos;s for, how long it takes,
            numbered steps with screenshots, and what to do if it didn&apos;t work.
          </p>
        </div>
        <Pebble mood="happy" size={130} className="hidden md:block" />
      </header>
      <ul className="grid gap-5 md:grid-cols-3">
        {GUIDES.map((g, i) => (
          <li key={g.slug} className={`pop flex flex-col rounded-[var(--radius-blob)] ${TINTS[i % 3]} p-6`}>
            <p aria-hidden="true" className="text-4xl">
              {ICONS[i % 3]}
            </p>
            <h2 className="mt-3 text-xl font-bold leading-snug">
              <Link href={`/guides/${g.slug}`}>{g.title}</Link>
            </h2>
            <p className="mt-2 flex-1">{g.summary}</p>
            <p className="mt-4 text-sm font-bold">Device: {g.devices}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
