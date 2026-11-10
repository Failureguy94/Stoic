"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS, SITE_NAME, SITE_TAGLINE } from "@/lib/site";
import { Pebble } from "@/components/Pebble";

export function Header() {
  const pathname = usePathname();
  const isCurrent = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="px-4 pt-4 sm:px-6">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 rounded-[var(--radius-blob)] border-2 border-line bg-surface px-4 py-3 md:flex-row md:items-center md:justify-between">
        <Link href="/" className="flex items-center gap-2 no-underline">
          <Pebble size={44} />
          <span>
            <span className="font-display block text-2xl font-bold leading-none tracking-wide">{SITE_NAME}</span>
            <span className="block text-sm text-muted">{SITE_TAGLINE}</span>
          </span>
        </Link>
        <nav aria-label="Main">
          <ul className="flex flex-wrap gap-1.5">
            {NAV_ITEMS.map((item) => {
              const current = isCurrent(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={current ? "page" : undefined}
                    className={`inline-block rounded-full border-2 px-3.5 py-1.5 font-bold no-underline ${
                      current
                        ? "border-brand bg-brand text-brand-ink"
                        : "border-transparent hover:border-line hover:bg-lavender"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </header>
  );
}
