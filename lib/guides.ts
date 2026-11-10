import type { ComponentType } from "react";
import { GUIDE_META, type GuideMeta } from "@/data/guides";

export type { GuideMeta };

type Loader = () => Promise<{ default: ComponentType }>;

/** MDX loaders for the website. Guide details live in data/guides.ts. */
const LOADERS: Record<string, Loader> = {
  "android-digital-wellbeing": () => import("@/content/guides/android-digital-wellbeing.mdx"),
  "notification-cleanup": () => import("@/content/guides/notification-cleanup.mdx"),
  "reduce-youtube-distraction": () => import("@/content/guides/reduce-youtube-distraction.mdx"),
};

export const GUIDES = GUIDE_META.map((g) => ({ ...g, load: LOADERS[g.slug] }));

export function getGuide(slug: string) {
  return GUIDES.find((g) => g.slug === slug);
}
