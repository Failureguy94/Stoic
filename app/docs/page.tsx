import type { Metadata } from "next";
import Link from "next/link";
import { DOC_PAGES } from "@/lib/docs";
import { Pebble } from "@/components/Pebble";

export const metadata: Metadata = {
  title: "How-to guides",
  description: "Short guides to every part of the STOIC app: setup, limits, bedtime, focus, notifications, websites and more.",
};

const TINTS = ["bg-mint", "bg-peach", "bg-lavender", "bg-sky", "bg-butter", "bg-rose"];

export default function DocsIndex() {
  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-6 md:flex-row md:items-center">
        <div className="max-w-3xl space-y-3">
          <h1 className="text-4xl font-bold sm:text-5xl">How-to guides</h1>
          <p className="text-lg">
            Short guides to every part of STOIC: what it does, how to set it up, and what to do if it doesn&apos;t
            work. The same guides are inside the app, under <strong>More</strong>.
          </p>
        </div>
        <Pebble mood="happy" size={130} className="hidden md:block" />
      </header>
      <ul className="grid gap-5 md:grid-cols-3">
        {DOC_PAGES.map((d, i) => (
          <li key={d.slug} className={`pop flex flex-col rounded-[var(--radius-blob)] ${TINTS[i % TINTS.length]} p-6`}>
            <p aria-hidden="true" className="text-4xl">
              {d.icon}
            </p>
            <h2 className="mt-3 text-xl font-bold leading-snug">
              <Link href={`/docs/${d.slug}`}>{d.title}</Link>
            </h2>
            <p className="mt-2 flex-1">{d.summary}</p>
            <p className="mt-4 text-sm font-bold">{d.minutes} min read</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
