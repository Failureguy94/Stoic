/** Site-wide configuration. Change the name here and it updates everywhere. */
export const SITE_NAME = "STOIC";
export const SITE_TAGLINE = "Digital Wellness Resource Hub";
export const SITE_DESCRIPTION =
  "A short, friendly, checked list of digital wellness tools for first-year students, with comparisons and step-by-step guides.";

export const NAV_ITEMS = [
  { href: "/", label: "Find your fix" },
  { href: "/tools", label: "Compare" },
  { href: "/guides", label: "Guides" },
  { href: "/circle", label: "Circle" },
  { href: "/survey", label: "Survey" },
  { href: "/about", label: "About" },
] as const;
