export type FeatureIconId = "catalog" | "outfits" | "tryOn" | "details";

export type FeatureItem = {
  id: FeatureIconId;
  title: string;
  description: string;
};

export const featureItems: FeatureItem[] = [
  {
    id: "catalog",
    title: "Catalog every piece",
    description:
      "Photograph and organize garments so the whole closet lives in one wardrobe.",
  },
  {
    id: "outfits",
    title: "Compose outfits",
    description:
      "Mix pieces into looks you can save, revisit, and wear with less guesswork.",
  },
  {
    id: "tryOn",
    title: "Try looks on",
    description:
      "Preview how an outfit sits together before you pull it from the rail.",
  },
  {
    id: "details",
    title: "Keep item details",
    description:
      "Open any piece for notes, categories, and a dedicated detail view.",
  },
];
