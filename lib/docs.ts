import type { ComponentType } from "react";
import { DOCS, type DocMeta } from "@/data/docs";

export type { DocMeta };

type Loader = () => Promise<{ default: ComponentType }>;

/** MDX loaders for STOIC's how-to docs. Details live in data/docs.ts; the text in content/docs/. */
const LOADERS: Record<string, Loader> = {
  "getting-started": () => import("@/content/docs/getting-started.mdx"),
  limits: () => import("@/content/docs/limits.mdx"),
  schedules: () => import("@/content/docs/schedules.mdx"),
  focus: () => import("@/content/docs/focus.mdx"),
  notifications: () => import("@/content/docs/notifications.mdx"),
  websites: () => import("@/content/docs/websites.mdx"),
  strict: () => import("@/content/docs/strict.mdx"),
  "day-score": () => import("@/content/docs/day-score.mdx"),
  "screen-time": () => import("@/content/docs/screen-time.mdx"),
  troubleshooting: () => import("@/content/docs/troubleshooting.mdx"),
};

export const DOC_PAGES = DOCS.map((d) => ({ ...d, load: LOADERS[d.slug] }));

export function getDoc(slug: string) {
  return DOC_PAGES.find((d) => d.slug === slug);
}
