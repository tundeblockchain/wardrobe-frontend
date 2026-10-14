import { describe, expect, it } from "vitest";
import {
  resolveUploadContentType,
  validateImageFile,
  validateItemForm,
  validateOutfitForm,
  validateVirtualProfileForm,
  validateWardrobeForm,
} from "./catalogValidation";

describe("catalog validation", () => {
  it("requires a wardrobe name of 100 characters or fewer", () => {
    expect(validateWardrobeForm({ name: "   " })).toEqual({
      name: "Name is required.",
    });
    expect(validateWardrobeForm({ name: "a".repeat(101) }).name).toMatch(
      /100 characters/,
    );
    expect(validateWardrobeForm({ name: "Weekend closet" })).toEqual({});
  });

  it("validates clothing item fields and a required photo on create", () => {
    expect(
      validateItemForm(
        {
          name: "",
          category: "HAT",
          subcategory: "",
          colours: "NAVY, ".concat("x".repeat(41)),
          brand: "",
          acquiredAt: "2026-13-01",
        },
        { requireImage: true, hasImage: false },
      ),
    ).toMatchObject({
      name: "Name is required.",
      category: expect.stringContaining("TOP"),
      colours: expect.stringContaining("40"),
      acquiredAt: expect.stringContaining("YYYY-MM-DD"),
      image: "A photo is required.",
    });

    expect(
      validateItemForm(
        {
          name: "Navy tee",
          category: "TOP",
          subcategory: "TSHIRT",
          colours: "NAVY",
          brand: "Example",
          acquiredAt: "2026-04-12",
        },
        { requireImage: true, hasImage: true },
      ),
    ).toEqual({});
  });

  it("validates outfit items, unique slots, and a wardrobe", () => {
    expect(
      validateOutfitForm({ name: "", wardrobeId: "", items: [] }),
    ).toMatchObject({
      name: "Name is required.",
      wardrobeId: "Wardrobe is required.",
      items: "Choose at least one clothing item.",
    });

    expect(
      validateOutfitForm({
        name: "Brunch",
        wardrobeId: "wd_1",
        items: [
          { itemId: "item_1", slot: "TOP" },
          { itemId: "item_2", slot: "TOP" },
        ],
      }).items,
    ).toMatch(/Slot TOP can only appear once/);

    expect(
      validateOutfitForm({
        name: "Brunch",
        wardrobeId: "wd_1",
        items: [
          { itemId: "item_1", slot: "TOP" },
          { itemId: "item_2", slot: "ACCESSORY" },
          { itemId: "item_3", slot: "ACCESSORY" },
        ],
      }),
    ).toEqual({});
  });

  it("validates Virtual Profile label, notes, and a required photo on create", () => {
    expect(
      validateVirtualProfileForm(
        { label: "a".repeat(101), notes: "b".repeat(101) },
        { requireImage: true, hasImage: false },
      ),
    ).toMatchObject({
      label: expect.stringContaining("100 characters"),
      notes: expect.stringContaining("100 characters"),
      image: "A photo is required.",
    });
    expect(
      validateVirtualProfileForm(
        { label: "Weekday look", notes: "Natural light" },
        { requireImage: true, hasImage: true },
      ),
    ).toEqual({});
  });

  it("resolves a missing file type from the file name", () => {
    expect(
      resolveUploadContentType(new File(["x"], "coat.heic", { type: "" })),
    ).toBe("image/heic");
    expect(
      resolveUploadContentType(new File(["x"], "coat.jpg", { type: "" })),
    ).toBe("image/jpeg");
  });

  it("rejects unsupported or oversized photos", () => {
    expect(
      validateImageFile(new File(["x"], "notes.txt", { type: "text/plain" })),
    ).toBe("Use a JPEG, PNG, WebP, or HEIC photo.");
    expect(
      validateImageFile(new File([], "empty.jpg", { type: "image/jpeg" })),
    ).toBe("Choose a photo to upload.");

    const tooLarge = new File(["x"], "huge.jpg", { type: "image/jpeg" });
    Object.defineProperty(tooLarge, "size", { value: 10 * 1024 * 1024 + 1 });
    expect(validateImageFile(tooLarge)).toBe("Photo must be 10 MB or smaller.");
    expect(
      validateImageFile(new File(["photo"], "tee.jpg", { type: "image/jpeg" })),
    ).toBeUndefined();
  });
});
