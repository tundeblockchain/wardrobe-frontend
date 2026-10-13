export const dashboardCopy = {
  wardrobes: {
    title: "Wardrobes",
    description:
      "Photograph and organize garments so every collection lives in one place.",
    loadingLabel: "Loading wardrobes",
    emptyTitle: "No wardrobes yet",
    emptyDescription: "Wardrobes you add in the app will appear here.",
    errorTitle: "Couldn't load wardrobes",
    errorDescription: "Try again in a moment. Your collections were not changed.",
    retryLabel: "Try loading wardrobes again",
  },
  wardrobeDetail: {
    fallbackTitle: "Wardrobe",
    description: "Clothing items in this wardrobe.",
    loadingLabel: "Loading wardrobe",
    emptyTitle: "No clothing items yet",
    emptyDescription: "Items you add to this wardrobe will appear here.",
    errorTitle: "Couldn't load this wardrobe",
    errorDescription: "Try again in a moment. Nothing in this wardrobe was changed.",
    retryLabel: "Try loading this wardrobe again",
    notFoundTitle: "Wardrobe not found",
    notFoundDescription:
      "This wardrobe is missing or you do not have access to it.",
  },
  itemDetail: {
    fallbackTitle: "Item",
    description: "Details for this clothing item.",
    loadingLabel: "Loading clothing item",
    errorTitle: "Couldn't load this item",
    errorDescription: "Try again in a moment. This item was not changed.",
    retryLabel: "Try loading this item again",
    notFoundTitle: "Item not found",
    notFoundDescription:
      "This clothing item is missing or you do not have access to it.",
  },
  outfits: {
    title: "Outfits",
    description:
      "Saved looks from the pieces you already own, ready to revisit.",
    loadingLabel: "Loading outfits",
    emptyTitle: "No outfits yet",
    emptyDescription: "Outfits you save in the app will appear here.",
    errorTitle: "Couldn't load outfits",
    errorDescription: "Try again in a moment. Your looks were not changed.",
    retryLabel: "Try loading outfits again",
  },
  virtualProfiles: {
    title: "Virtual Profiles",
    description:
      "Browse Virtual Profiles and preview looks with Virtual Try On.",
    loadingLabel: "Loading Virtual Profiles",
    emptyTitle: "No Virtual Profiles yet",
    emptyDescription:
      "Create a Virtual Profile in the app to preview looks with Virtual Try On.",
    errorTitle: "Couldn't load Virtual Profiles",
    errorDescription:
      "Try again in a moment. Your Virtual Profiles were not changed.",
    retryLabel: "Try loading Virtual Profiles again",
    upgradeTitle: "Virtual Try On is a Premium feature",
    upgradeDescription:
      "Upgrade to browse Virtual Profiles and preview looks with Virtual Try On.",
    upgradeActionLabel: "View plan",
    upgradeActionAriaLabel: "View plan for Virtual Try On",
  },
} as const;
