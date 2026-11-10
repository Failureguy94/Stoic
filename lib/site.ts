/**
 * Site-wide configuration. Change the name here and it updates everywhere.
 */
export const SITE_NAME = "STOIC";

export const SITE_TAGLINE = "Digital Wellness Resource Hub";

export const SITE_DESCRIPTION =
  "A short, trusted list of digital wellness tools for first-year college students, with plain-language comparisons and step-by-step setup guides.";

/** Primary navigation, in display order. */
export const NAV_ITEMS = [
  { href: "/", label: "Find your fix" },
  { href: "/tools", label: "Compare tools" },
  { href: "/guides", label: "Guides" },
  { href: "/circle", label: `${SITE_NAME} Circle` },
  { href: "/survey", label: "Survey results" },
  { href: "/about", label: "About" },
] as const;
