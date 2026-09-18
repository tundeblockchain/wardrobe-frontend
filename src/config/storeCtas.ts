export type StoreKind = "appStore" | "playStore";

export type StoreUrlEnv = {
  appStoreUrl: string | undefined;
  playStoreUrl: string | undefined;
};

export type StoreCta = {
  kind: StoreKind;
  label: string;
  comingSoonLabel: string;
  href: string | undefined;
};

export const getStoreCtas = ({
  appStoreUrl,
  playStoreUrl,
}: StoreUrlEnv): StoreCta[] => {
  return [
    {
      kind: "appStore",
      label: "Download on the App Store",
      comingSoonLabel: "App Store — coming soon",
      href: appStoreUrl,
    },
    {
      kind: "playStore",
      label: "Get it on Google Play",
      comingSoonLabel: "Google Play — coming soon",
      href: playStoreUrl,
    },
  ];
};

export const isStoreCtaAvailable = (cta: StoreCta): boolean => {
  return Boolean(cta.href);
};

export const areStoreLinksPublished = ({
  appStoreUrl,
  playStoreUrl,
}: StoreUrlEnv): boolean => {
  return Boolean(appStoreUrl || playStoreUrl);
};
