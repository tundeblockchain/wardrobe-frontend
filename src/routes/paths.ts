export const appPaths = {
  home: "/",
  terms: "/terms",
  privacy: "/privacy",
} as const;

export type AppPath = (typeof appPaths)[keyof typeof appPaths];
