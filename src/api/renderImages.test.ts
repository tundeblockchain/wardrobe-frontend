import { describe, expect, it } from "vitest";
import {
  mapRenderGalleryNewestFirst,
  mapRenderImageUrls,
  type RenderImageSource,
} from "./renderImages";

describe("mapRenderImageUrls", () => {
  it("uses renderImageUrls, then history, then render, and skips missing fields", () => {
    expect(mapRenderImageUrls({})).toEqual([]);
    expect(
      mapRenderImageUrls({
        renderImageUrls: undefined,
        renderHistory: undefined,
        render: undefined,
      }),
    ).toEqual([]);
    expect(
      mapRenderImageUrls({
        renderImageUrls: ["  ", null, undefined],
        renderHistory: [{ imageUrl: "  " }, {}],
        render: { imageUrl: "" },
      }),
    ).toEqual([]);

    expect(
      mapRenderImageUrls({
        renderImageUrls: ["https://cdn.example.com/a.jpg"],
        renderHistory: [{ imageUrl: "https://cdn.example.com/b.jpg" }],
        render: { imageUrl: "https://cdn.example.com/c.jpg" },
      }),
    ).toEqual([
      "https://cdn.example.com/a.jpg",
      "https://cdn.example.com/b.jpg",
      "https://cdn.example.com/c.jpg",
    ]);
  });

  it("falls back through optional fields when earlier ones are absent", () => {
    const historyOnly: RenderImageSource = {
      renderHistory: [
        {
          imageUrl: "https://cdn.example.com/old.jpg",
          createdAt: "2026-09-01T10:00:00.000Z",
        },
        {
          imageUrl: "https://cdn.example.com/new.jpg",
          createdAt: "2026-10-01T10:00:00.000Z",
        },
      ],
    };
    expect(mapRenderImageUrls(historyOnly)).toEqual([
      "https://cdn.example.com/new.jpg",
      "https://cdn.example.com/old.jpg",
    ]);

    expect(
      mapRenderImageUrls({
        render: { imageUrl: "https://cdn.example.com/current.jpg" },
      }),
    ).toEqual(["https://cdn.example.com/current.jpg"]);
  });

  it("does not repeat the same URL across the fallback fields", () => {
    expect(
      mapRenderImageUrls({
        renderImageUrls: ["https://cdn.example.com/latest.jpg"],
        renderHistory: [
          { imageUrl: "https://cdn.example.com/latest.jpg" },
          { imageUrl: "https://cdn.example.com/older.jpg" },
        ],
        render: { imageUrl: "https://cdn.example.com/latest.jpg" },
      }),
    ).toEqual([
      "https://cdn.example.com/latest.jpg",
      "https://cdn.example.com/older.jpg",
    ]);
  });
});

describe("mapRenderGalleryNewestFirst", () => {
  it("orders a gallery newest first across items and outfits", () => {
    const urls = mapRenderGalleryNewestFirst([
      {
        renderHistory: [
          {
            imageUrl: "https://cdn.example.com/item-old.jpg",
            createdAt: "2026-08-01T09:00:00.000Z",
          },
        ],
      },
      {
        renderImageUrls: ["https://cdn.example.com/outfit-new.jpg"],
        renderHistory: [
          {
            imageUrl: "https://cdn.example.com/outfit-new.jpg",
            createdAt: "2026-10-12T18:00:00.000Z",
          },
        ],
      },
      {
        render: { imageUrl: "https://cdn.example.com/item-mid.jpg" },
        renderHistory: [
          {
            imageUrl: "https://cdn.example.com/item-mid.jpg",
            createdAt: "2026-09-15T12:00:00.000Z",
          },
        ],
      },
    ]);

    expect(urls).toEqual([
      "https://cdn.example.com/outfit-new.jpg",
      "https://cdn.example.com/item-mid.jpg",
      "https://cdn.example.com/item-old.jpg",
    ]);
  });
});
