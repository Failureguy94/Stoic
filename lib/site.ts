/** Site-wide configuration. Change the name here and it updates everywhere. */
export const SITE_NAME = "STOIC";
export const SITE_TAGLINE = "Digital wellbeing, made for students";
export const SITE_DESCRIPTION =
  "STOIC is a free Android app for students: screen time, limits, bedtime, focus, notification control and website blocking, private and on your phone.";

export const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/docs", label: "Guides" },
  { href: "/circle", label: "Circle" },
  { href: "/survey", label: "Survey" },
  { href: "/about", label: "About" },
] as const;
