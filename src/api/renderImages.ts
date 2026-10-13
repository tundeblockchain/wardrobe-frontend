/**
 * Single mapper for optional Virtual Try On image fields.
 * Backend may still rename a field; keep the fallback order here.
 *
 * Order: renderImageUrls[], then renderHistory[].imageUrl, then render.imageUrl.
 * Newest first. Every field is optional.
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

export type DatedRenderImage = {
  imageUrl: string;
  createdAt?: string;
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

export const mapRenderGalleryEntries = (
  source: RenderImageSource,
): DatedRenderImage[] => {
  const historyByUrl = new Map<string, string>();
  for (const entry of source.renderHistory ?? []) {
    const url = readOptionalUrl(entry.imageUrl);
    const createdAt = entry.createdAt?.trim();
    if (url && createdAt && !historyByUrl.has(url)) {
      historyByUrl.set(url, createdAt);
    }
  }

  return mapRenderImageUrls(source).map((imageUrl, index) => {
    const createdAt = historyByUrl.get(imageUrl);
    return createdAt
      ? { imageUrl, createdAt }
      : { imageUrl, createdAt: String(index).padStart(4, "0") };
  });
};

export const mapRenderGalleryNewestFirst = (
  sources: RenderImageSource[],
): string[] => {
  const seen = new Set<string>();
  const entries = sources.flatMap((source) => mapRenderGalleryEntries(source));
  entries.sort((left, right) => {
    const leftAt = left.createdAt ?? "";
    const rightAt = right.createdAt ?? "";
    return rightAt.localeCompare(leftAt);
  });

  const urls: string[] = [];
  for (const entry of entries) {
    uniquePush(urls, seen, entry.imageUrl);
  }

  return urls;
};
