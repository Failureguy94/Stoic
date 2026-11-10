"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS, SITE_NAME, SITE_TAGLINE } from "@/lib/site";

export function SiteHeader() {
  const pathname = usePathname();

  const isCurrent = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-4 sm:px-6 md:flex-row md:items-center md:justify-between">
        <Link href="/" className="no-underline">
          <span className="block text-2xl font-bold tracking-[0.18em]">{SITE_NAME}</span>
          <span className="block text-sm text-muted">{SITE_TAGLINE}</span>
        </Link>
        <nav aria-label="Main">
          <ul className="flex flex-wrap gap-x-1 gap-y-1">
            {NAV_ITEMS.map((item) => {
              const current = isCurrent(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={current ? "page" : undefined}
                    className={`inline-block rounded-md px-3 py-2 text-[0.95rem] font-bold no-underline ${
                      current
                        ? "bg-accent text-accent-fg"
                        : "text-fg underline-offset-4 hover:bg-accent-soft hover:underline"
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
