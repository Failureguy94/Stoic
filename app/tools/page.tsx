import type { Metadata } from "next";
import Link from "next/link";
import { CompareTools } from "@/components/CompareTools";
import { tools } from "@/data/tools";

export const metadata: Metadata = {
  title: "Compare tools",
  description: "Side-by-side comparison of digital wellness tools: cost, permissions, privacy, effort and limitations.",
};

export default function ToolsPage() {
  return (
    <div className="space-y-6">
      <header className="max-w-3xl space-y-3">
        <h1 className="text-3xl font-bold sm:text-4xl">Compare tools</h1>
        <p className="text-lg">
          {tools.length} tools we checked on their official pages. In our survey the three reasons tools failed
          were <strong>too many permissions</strong>, <strong>cost</strong> and <strong>forgetting to use them</strong>,
          so every tool shows those three things up front.
        </p>
        <details className="rounded-lg border border-border bg-surface p-4">
          <summary className="cursor-pointer font-bold">How to read the labels</summary>
          <dl className="mt-3 space-y-2">
            <div>
              <dt className="inline font-bold">Free: </dt>
              <dd className="inline">everything works without paying. If an important feature costs money, we say <strong>Freemium</strong> and list what is paid.</dd>
            </div>
            <div>
              <dt className="inline font-bold">Built in / Low / High permissions: </dt>
              <dd className="inline">
                built in means it is part of your phone or PC. High means broad access, such as Android&apos;s
                Accessibility permission or &ldquo;read data on all websites&rdquo;.
              </dd>
            </div>
            <div>
              <dt className="inline font-bold">Automatic / Needs you to remember: </dt>
              <dd className="inline">automatic tools keep working on a schedule; the others only help when you start a session.</dd>
            </div>
            <div>
              <dt className="inline font-bold">Not confirmed: </dt>
              <dd className="inline">we could not find this on an official page, so we did not guess.</dd>
            </div>
          </dl>
        </details>
        <p>
          Not sure where to start? <Link href="/" className="font-bold text-accent">Use the Find your fix picker</Link>.
        </p>
      </header>
      <CompareTools />
    </div>
  );
}
