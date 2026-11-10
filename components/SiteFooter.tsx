import Link from "next/link";
import { SITE_NAME } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="mt-12 border-t border-border bg-surface">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-8 text-sm text-muted sm:px-6">
        <nav aria-label="Footer">
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
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
        <p>
          {SITE_NAME} is a first-year course project at IIIT Nagpur. It gives general information,
          not medical advice. Tool details were checked on the dates shown and can change; always
          confirm on the official page before you pay or grant permissions.
        </p>
      </div>
    </footer>
  );
}
