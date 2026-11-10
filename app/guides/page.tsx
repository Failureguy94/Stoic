import type { Metadata } from "next";
import Link from "next/link";
import { GUIDES } from "@/lib/guides";

export const metadata: Metadata = {
  title: "Setup guides",
  description: "Step-by-step setup guides for digital wellness tools, written and tested by a student.",
};

export default function GuidesIndex() {
  return (
    <div className="space-y-6">
      <header className="max-w-3xl space-y-3">
        <h1 className="text-3xl font-bold sm:text-4xl">Setup guides</h1>
        <p className="text-lg">
          11 of the 17 students we surveyed asked for step-by-step guides. Each guide below was written by a
          student, tested on a real device, and follows the same pattern: who it is for, how long it takes,
          numbered steps with screenshots, and what to do if it didn&apos;t work.
        </p>
      </header>
      <ul className="grid gap-4 md:grid-cols-3">
        {GUIDES.map((g) => (
          <li key={g.slug} className="flex flex-col rounded-lg border border-border bg-surface p-5">
            <h2 className="text-lg font-bold leading-snug">
              <Link href={`/guides/${g.slug}`} className="text-accent">
                {g.title}
              </Link>
            </h2>
            <p className="mt-2 flex-1">{g.summary}</p>
            <p className="mt-3 text-sm text-muted">
              <span className="font-bold">Device:</span> {g.devices}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
