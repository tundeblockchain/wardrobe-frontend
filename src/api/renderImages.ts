/**
 * Single mapper for optional Virtual Try On image fields on item and outfit
 * responses (GET /items/{itemId}, nested item/outfit GETs and lists, GET /outfits).
 *
 * Confirmed fields, all optional:
 * 1. renderImageUrls[] — signed URLs, already newest first
 * 2. renderHistory[] — { imageUrl, createdAt }; sort by createdAt descending
 *    only when falling back to this list
 * 3. render.imageUrl — current render once READY
 *
 * Dedupes URLs across the three sources.
 */

export type RenderImageHistoryEntry = {
  imageUrl?: string | null;
  createdAt?: string | null;
};

export type RenderImageSource = {
  renderImageUrls?: Array<string | null | undefined> | null;
  renderHistory?: RenderImageHistoryEntry[] | null;
  render?: { imageUrl?: string | null } | null;
};

const readOptionalUrl = (
  value: string | null | undefined,
): string | undefined => {
  const trimmed = value?.trim();
  if (!trimmed) {
    return undefined;
  }

  return trimmed;
};

const uniquePush = (urls: string[], seen: Set<string>, url?: string) => {
  if (!url || seen.has(url)) {
    return;
  }

  seen.add(url);
  urls.push(url);
};

const historyNewestFirst = (
  history: RenderImageHistoryEntry[] | null | undefined,
): RenderImageHistoryEntry[] => {
  return [...(history ?? [])].sort((left, right) => {
    const leftAt = left.createdAt?.trim() ?? "";
    const rightAt = right.createdAt?.trim() ?? "";
    return rightAt.localeCompare(leftAt);
  });
};

export const mapRenderImageUrls = (source: RenderImageSource): string[] => {
  const seen = new Set<string>();
  const urls: string[] = [];

  for (const value of source.renderImageUrls ?? []) {
    uniquePush(urls, seen, readOptionalUrl(value));
  }

  for (const entry of historyNewestFirst(source.renderHistory)) {
    uniquePush(urls, seen, readOptionalUrl(entry.imageUrl));
  }

  uniquePush(urls, seen, readOptionalUrl(source.render?.imageUrl));
  return urls;
};
