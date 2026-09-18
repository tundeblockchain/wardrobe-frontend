export type LandingNavLink = {
  href: string;
  label: string;
  ariaLabel: string;
};

export const landingNavLinks: LandingNavLink[] = [
  {
    href: "/#features",
    label: "Features",
    ariaLabel: "Jump to features",
  },
  {
    href: "/#screenshots",
    label: "Screenshots",
    ariaLabel: "Jump to screenshot showcase",
  },
  {
    href: "/#download",
    label: "Download",
    ariaLabel: "Jump to download",
  },
];
