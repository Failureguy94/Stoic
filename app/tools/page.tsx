import type { Metadata } from "next";
import Link from "next/link";
import { CompareTools } from "@/components/CompareTools";
import { tools } from "@/data/tools";

export const metadata: Metadata = {
  title: "Compare tools",
  description: "Digital wellness tools side by side: cost, permissions, privacy, effort and limitations.",
};

export default function ToolsPage() {
  return (
    <div className="space-y-6" data-wide>
      <header className="max-w-3xl space-y-3">
        <h1 className="text-4xl font-bold sm:text-5xl">Compare tools</h1>
        <p className="text-lg">
          {tools.length} tools, each checked on its official page. Your batch said tools failed because of{" "}
          <strong>permissions</strong>, <strong>cost</strong> and <strong>forgetting</strong>, so those three come
          first on every tool.
        </p>
        <details className="rounded-[1.25rem] bg-butter p-4">
          <summary className="cursor-pointer font-extrabold">What do the labels mean?</summary>
          <dl className="mt-3 space-y-2">
            <div>
              <dt className="inline font-extrabold">Free: </dt>
              <dd className="inline">
                everything works without paying. If something important costs money it says <strong>Freemium</strong>{" "}
                and lists what&apos;s paid.
              </dd>
            </div>
            <div>
              <dt className="inline font-extrabold">Built in / Low / High permissions: </dt>
              <dd className="inline">
                &ldquo;Built in&rdquo; is already part of your phone or PC. &ldquo;High&rdquo; means broad access, like
                Android&apos;s Accessibility permission or &ldquo;read data on all websites&rdquo;.
              </dd>
            </div>
            <div>
              <dt className="inline font-extrabold">Automatic / Needs you to remember: </dt>
              <dd className="inline">automatic tools keep working on a schedule; the others only help when you start them.</dd>
            </div>
            <div>
              <dt className="inline font-extrabold">Not confirmed: </dt>
              <dd className="inline">we couldn&apos;t find it on an official page, so we didn&apos;t guess.</dd>
            </div>
          </dl>
        </details>
        <p>
          Not sure where to start?{" "}
          <Link href="/" className="font-extrabold text-brand">
            Try the Find your fix picker
          </Link>
        </p>
      </header>
      <CompareTools />
    </div>
  );
}
