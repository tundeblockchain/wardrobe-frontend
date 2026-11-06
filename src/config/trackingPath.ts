const DYNAMIC_ROUTE_TEMPLATES: ReadonlyArray<{
  pattern: RegExp;
  template: string;
}> = [
  {
    pattern: /^\/app\/wardrobes\/new$/,
    template: "/app/wardrobes/new",
  },
  {
    pattern: /^\/app\/wardrobes\/[^/]+\/items\/new$/,
    template: "/app/wardrobes/:id/items/new",
  },
  {
    pattern: /^\/app\/wardrobes\/[^/]+\/recommendations\/detail$/,
    template: "/app/wardrobes/:id/recommendations/detail",
  },
  {
    pattern: /^\/app\/wardrobes\/[^/]+\/recommendations$/,
    template: "/app/wardrobes/:id/recommendations",
  },
  {
    pattern: /^\/app\/wardrobes\/[^/]+\/edit$/,
    template: "/app/wardrobes/:id/edit",
  },
  {
    pattern: /^\/app\/wardrobes\/[^/]+$/,
    template: "/app/wardrobes/:id",
  },
  {
    pattern: /^\/app\/items\/[^/]+\/edit$/,
    template: "/app/items/:id/edit",
  },
  {
    pattern: /^\/app\/items\/[^/]+$/,
    template: "/app/items/:id",
  },
  {
    pattern: /^\/app\/outfits\/new$/,
    template: "/app/outfits/new",
  },
  {
    pattern: /^\/app\/outfits\/[^/]+\/edit$/,
    template: "/app/outfits/:id/edit",
  },
  {
    pattern: /^\/app\/virtual-profiles\/new$/,
    template: "/app/virtual-profiles/new",
  },
  {
    pattern: /^\/app\/virtual-profiles\/[^/]+\/edit$/,
    template: "/app/virtual-profiles/:id/edit",
  },
  {
    pattern: /^\/share\/[^/]+$/,
    template: "/share/:token",
  },
];

const SAFE_QUERY_KEYS = new Set(["mode", "type"]);
const SAFE_QUERY_VALUES = new Set(["signup", "bug"]);

const stripTrailingSlash = (pathname: string): string => {
  if (pathname === "/") {
    return pathname;
  }

  return pathname.replace(/\/+$/, "");
};

export const toTrackingPathname = (pathname: string): string => {
  const normalized = stripTrailingSlash(pathname);
  if (!normalized) {
    return "/";
  }

  for (const route of DYNAMIC_ROUTE_TEMPLATES) {
    if (route.pattern.test(normalized)) {
      return route.template;
    }
  }

  return normalized;
};

export const toTrackingSearch = (search: string): string => {
  const trimmed = search.startsWith("?") ? search.slice(1) : search;
  if (!trimmed) {
    return "";
  }

  const params = new URLSearchParams(trimmed);
  const safeParams = new URLSearchParams();

  params.forEach((value, key) => {
    if (!SAFE_QUERY_KEYS.has(key)) {
      return;
    }

    if (!SAFE_QUERY_VALUES.has(value)) {
      return;
    }

    safeParams.set(key, value);
  });

  const serialized = safeParams.toString();
  return serialized ? `?${serialized}` : "";
};

export const toTrackingPath = (pathname: string, search = ""): string => {
  return `${toTrackingPathname(pathname)}${toTrackingSearch(search)}`;
};

export const TRACKING_PAGE_TITLES: Record<string, string> = {
  "/": "Home",
  "/terms": "Terms of Service",
  "/privacy": "Privacy Policy",
  "/contact": "Contact",
  "/pricing": "Pricing",
  "/login": "Sign in",
  "/login?mode=signup": "Create account",
  "/share/:token": "Shared look",
  "/app": "Dashboard",
  "/app/wardrobes": "Wardrobes",
  "/app/wardrobes/new": "Add wardrobe",
  "/app/wardrobes/:id": "Wardrobe",
  "/app/wardrobes/:id/edit": "Edit wardrobe",
  "/app/wardrobes/:id/items/new": "Add item",
  "/app/wardrobes/:id/recommendations": "Recommendations",
  "/app/wardrobes/:id/recommendations/detail": "Recommendation",
  "/app/items/:id": "Item",
  "/app/items/:id/edit": "Edit item",
  "/app/outfits": "Outfits",
  "/app/outfits/new": "Add outfit",
  "/app/outfits/:id/edit": "Edit outfit",
  "/app/virtual-profiles": "Virtual profiles",
  "/app/virtual-profiles/new": "Add virtual profile",
  "/app/virtual-profiles/:id/edit": "Edit virtual profile",
  "/app/virtual-try-on": "Virtual try-on",
  "/app/settings": "Settings",
  "/app/pricing": "Pricing",
  "/app/billing/success": "Billing success",
  "/app/billing/cancel": "Billing cancelled",
};

export const getTrackingPageTitle = (trackingPath: string): string => {
  return TRACKING_PAGE_TITLES[trackingPath] ?? "Pocket Closet";
};
