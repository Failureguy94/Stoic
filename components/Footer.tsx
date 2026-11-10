import Link from "next/link";
import { SITE_NAME } from "@/lib/site";
import { Pebble } from "@/components/Pebble";

export function Footer() {
  return (
    <footer className="bg-lavender">
      <svg aria-hidden="true" viewBox="0 0 1440 40" preserveAspectRatio="none" className="block h-6 w-full bg-bg">
        <path d="M0 40V20c240-26 480-26 720 0s480 26 720 0v20z" fill="var(--lavender)" />
      </svg>
      <div className="mx-auto flex max-w-5xl flex-col gap-5 px-4 pt-4 pb-10 sm:flex-row sm:items-start sm:px-6">
        <Pebble mood="sleepy" size={72} className="shrink-0" />
        <div className="space-y-3">
          <nav aria-label="Footer">
            <ul className="flex flex-wrap gap-x-5 gap-y-2 font-bold">
              <li>
                <Link href="/about">About, method and accessibility</Link>
              </li>
              <li>
                <Link href="/design-note">Design note: tamper-resistant tracking</Link>
              </li>
              <li>
                <Link href="/about#attribution">Sources and AI-assistance acknowledgement</Link>
              </li>
            </ul>
          </nav>
          <p className="text-sm">
            {SITE_NAME} is a first-year course project at IIIT Nagpur. It gives general information, not medical
            advice. Tool details were checked on the dates shown and can change, so confirm on the official page
            before you pay or grant permissions.
          </p>
        </div>
      </div>
    </footer>
  );
}
