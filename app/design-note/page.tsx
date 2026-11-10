import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Design note: tamper-resistant tracking (future work)",
  description:
    "Why screen-time totals can be erased, and a privacy-first design for a native Android app that makes gaps visible. Not implemented.",
};

export default function DesignNotePage() {
  return (
    <div className="prose max-w-3xl">
      <h1>Design note: tamper-resistant tracking (future work)</h1>

      <p className="rounded-lg border-l-4 border-note-border bg-note-bg p-4">
        <strong>Status: design only, not implemented.</strong> Nothing on this page exists in {SITE_NAME} today.
        Check-ins on this website are self-reported, and no system can be fully cheat-proof.
      </p>

      <h2>The problem</h2>
      <p>
        Students in our survey said tools stopped working because they ignored them or turned them off. There is a
        sneakier version too. On some Android phones (we saw this on a Redmi), when you uninstall
        an app, its usage history disappears from Digital Wellbeing. Uninstall Instagram on Sunday night, reinstall
        it on Monday, and the week&apos;s total looks smaller than it really was.
      </p>
      <p>
        A website cannot help here: browsers have no permission to read how long you used other apps on your phone.
        That is why the <Link href="/circle">{SITE_NAME} Circle</Link> asks you to report your own numbers, and says so
        clearly.
      </p>

      <h2>A possible fix: a small native Android companion app</h2>
      <ol>
        <li>
          <strong>Read usage events from the system.</strong> Android&apos;s <code>UsageStatsManager</code> API
          provides device usage history and statistics. It needs the <code>PACKAGE_USAGE_STATS</code> permission, which
          the user must grant themselves in Settings (&ldquo;Usage access&rdquo;), and can switch off at any time.
          Android&apos;s documentation also notes that usage events &ldquo;are only kept by the system for a few
          days&rdquo;, which is another reason to sync them regularly.
        </li>
        <li>
          <strong>Sync to an append-only log.</strong> The app regularly uploads daily per-app totals to a server
          that only ever <em>adds</em> records and never edits or deletes them. Once a day is synced, uninstalling
          an app on the phone cannot erase it.
        </li>
        <li>
          <strong>Send a heartbeat.</strong> The app checks in on a regular schedule. If heartbeats stop, or Usage
          access is switched off, the missing period shows as <strong>&ldquo;unverified&rdquo;</strong>. It is not
          shown as zero and not shown as a failure. The person can see the gap, and so can anyone they chose to
          share with.
        </li>
        <li>
          <strong>Keep it opt-in and privacy-first.</strong> Verification is off by default. Only daily totals for
          apps the user picks are synced, never message content, and never the full app list. Data is tied to a
          random ID rather than a name, and the user can export or delete it at any time.
        </li>
      </ol>

      <h2>What this still cannot stop</h2>
      <ul>
        <li>Using a second phone, a laptop, or a friend&apos;s device.</li>
        <li>Turning the phone off or putting it in airplane mode before using it. This creates an &ldquo;unverified&rdquo; gap, not a false low number.</li>
        <li>Rooted or modified phones that fake system data.</li>
        <li>The phone maker&apos;s own battery savers killing the app in the background, which causes honest gaps.</li>
      </ul>
      <p>
        So the honest goal is not &ldquo;cheat-proof&rdquo;. It is <strong>&ldquo;gaps are visible&rdquo;</strong>,
        so a person can trust their own numbers.
      </p>

      <h2>Why we did not build it now</h2>
      <p>
        It needs a native Android app, a server, and careful privacy review. That is beyond a first-year web project
        with a two-week deadline. We think writing the design down honestly is more useful than claiming our
        website can do something it cannot.
      </p>

      <h2>Reference</h2>
      <ul>
        <li>
          <a href="https://developer.android.com/reference/android/app/usage/UsageStatsManager" rel="noopener noreferrer">
            Android Developers: UsageStatsManager API reference
          </a>{" "}
          (checked 10 Nov 2026)
        </li>
      </ul>
    </div>
  );
}
