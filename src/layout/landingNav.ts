import { appPaths } from "../routes/paths";

export type HashNavLink = {
  kind: "hash";
  href: string;
  label: string;
  ariaLabel: string;
};

export type RouteNavLink = {
  kind: "route";
  to: string;
  label: string;
  ariaLabel: string;
};

export type AppNavLink = HashNavLink | RouteNavLink;

export const landingNavLinks: HashNavLink[] = [
  {
    kind: "hash",
    href: "/#features",
    label: "Features",
    ariaLabel: "Jump to features",
  },
  {
    kind: "hash",
    href: "/#screenshots",
    label: "Screenshots",
    ariaLabel: "Jump to screenshot showcase",
  },
  {
    kind: "hash",
    href: "/#download",
    label: "Download",
    ariaLabel: "Jump to download",
  },
];

export const legalNavLinks: RouteNavLink[] = [
  {
    kind: "route",
    to: appPaths.terms,
    label: "Terms of Service",
    ariaLabel: "Terms of Service",
  },
  {
    kind: "route",
    to: appPaths.privacy,
    label: "Privacy Policy",
    ariaLabel: "Privacy Policy",
  },
];

export const primaryNavLinks: AppNavLink[] = [
  ...landingNavLinks,
  ...legalNavLinks,
];
