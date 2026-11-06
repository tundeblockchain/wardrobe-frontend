import { afterEach, describe, expect, it, vi } from "vitest";
import {
  applyTrackingExternalId,
  clearTrackingExternalId,
  hashExternalId,
} from "./trackingIdentity";

const ALL_IDS = {
  gaMeasurementId: "G-XXXXXXXXXX",
  metaPixelId: "000000000000000",
  tiktokPixelId: "CXXXXXXXXXXXXXXXXX",
} as const;

const USER_1_HASH =
  "c6c289e49e9c05b2145860387b73bcb18df43fb09a1e4a4a9713c76c88bb541b";

const installVendors = () => {
  window.fbq = vi.fn();
  window.ttq = Object.assign(vi.fn(), {
    track: vi.fn(),
    identify: vi.fn(),
  });
};

describe("hashExternalId", () => {
  it("returns the SHA-256 hex of a Firebase uid and never the raw uid", async () => {
    await expect(hashExternalId("user-1")).resolves.toBe(USER_1_HASH);
    await expect(hashExternalId("user-1")).resolves.not.toBe("user-1");
  });

  it("does not hash an empty uid", async () => {
    await expect(hashExternalId("")).resolves.toBeUndefined();
    await expect(hashExternalId("   ")).resolves.toBeUndefined();
  });
});

describe("applyTrackingExternalId", () => {
  afterEach(() => {
    delete window.fbq;
    delete window.ttq;
  });

  it("re-inits Meta and identifies TikTok with only the hashed external_id", () => {
    installVendors();

    applyTrackingExternalId(USER_1_HASH, ALL_IDS);

    expect(window.fbq).toHaveBeenCalledWith("init", ALL_IDS.metaPixelId, {
      external_id: USER_1_HASH,
    });
    expect(window.ttq?.identify).toHaveBeenCalledWith({
      external_id: USER_1_HASH,
    });

    const serialized = JSON.stringify([
      (window.fbq as ReturnType<typeof vi.fn>).mock.calls,
      (window.ttq?.identify as ReturnType<typeof vi.fn>).mock.calls,
    ]);
    expect(serialized).not.toContain("user-1");
    expect(serialized).not.toMatch(/email|phone|name|@/i);
    expect(
      Object.keys(
        (window.fbq as ReturnType<typeof vi.fn>).mock.calls[0][2] as object,
      ),
    ).toEqual(["external_id"]);
  });

  it("does not apply an empty hash", () => {
    installVendors();

    applyTrackingExternalId("  ", ALL_IDS);

    expect(window.fbq).not.toHaveBeenCalled();
    expect(window.ttq?.identify).not.toHaveBeenCalled();
  });
});

describe("clearTrackingExternalId", () => {
  afterEach(() => {
    delete window.fbq;
    delete window.ttq;
  });

  it("re-inits Meta without user data", () => {
    installVendors();

    clearTrackingExternalId(ALL_IDS);

    expect(window.fbq).toHaveBeenCalledWith("init", ALL_IDS.metaPixelId);
    expect(window.fbq).toHaveBeenCalledTimes(1);
    expect(window.ttq?.identify).not.toHaveBeenCalled();
  });
});
