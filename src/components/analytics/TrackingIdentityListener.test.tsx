import { fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useAuthController } from "../../auth/useAuth";
import * as trackingIdentity from "../../config/trackingIdentity";
import { renderWithProviders } from "../../test/renderWithProviders";
import { TrackingIdentityListener } from "./TrackingIdentityListener";

const META_PIXEL_ID = "000000000000000";
const TIKTOK_PIXEL_ID = "CXXXXXXXXXXXXXXXXX";
const USER_1_HASH =
  "c6c289e49e9c05b2145860387b73bcb18df43fb09a1e4a4a9713c76c88bb541b";

const SignOutProbe = () => {
  const { setAuthUser } = useAuthController();
  return (
    <button type="button" onClick={() => setAuthUser(null)}>
      Sign out
    </button>
  );
};

const installVendors = () => {
  window.fbq = vi.fn();
  window.ttq = Object.assign(vi.fn(), {
    track: vi.fn(),
    identify: vi.fn(),
  });
};

describe("TrackingIdentityListener", () => {
  afterEach(() => {
    delete window.fbq;
    delete window.ttq;
    vi.restoreAllMocks();
  });

  it("sets hashed external_id after sign-in and never sends email, phone, name, or the raw uid", async () => {
    installVendors();

    renderWithProviders(
      <TrackingIdentityListener
        metaPixelId={META_PIXEL_ID}
        tiktokPixelId={TIKTOK_PIXEL_ID}
      />,
      {
        auth: {
          user: {
            id: "user-1",
            email: "wishlist.e2e@example.com",
            displayName: "Pat Example",
          },
          loading: false,
        },
      },
    );

    await waitFor(() => {
      expect(window.fbq).toHaveBeenCalledWith("init", META_PIXEL_ID, {
        external_id: USER_1_HASH,
      });
    });
    expect(window.ttq?.identify).toHaveBeenCalledWith({
      external_id: USER_1_HASH,
    });

    const serialized = JSON.stringify([
      (window.fbq as ReturnType<typeof vi.fn>).mock.calls,
      (window.ttq?.identify as ReturnType<typeof vi.fn>).mock.calls,
    ]);
    expect(serialized).not.toContain("user-1");
    expect(serialized).not.toContain("wishlist.e2e@example.com");
    expect(serialized).not.toContain("Pat Example");
    expect(serialized).not.toMatch(/email|phone|"name"/i);
  });

  it("re-inits Meta without user data after logout", async () => {
    installVendors();

    renderWithProviders(
      <>
        <TrackingIdentityListener
          metaPixelId={META_PIXEL_ID}
          tiktokPixelId={TIKTOK_PIXEL_ID}
        />
        <SignOutProbe />
      </>,
      {
        auth: {
          user: { id: "user-1" },
          loading: false,
        },
      },
    );

    await waitFor(() => {
      expect(window.fbq).toHaveBeenCalledWith("init", META_PIXEL_ID, {
        external_id: USER_1_HASH,
      });
    });

    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));

    await waitFor(() => {
      expect(window.fbq).toHaveBeenCalledWith("init", META_PIXEL_ID);
    });
  });

  it("does not identify when tracking IDs are unset", async () => {
    installVendors();
    const applySpy = vi.spyOn(trackingIdentity, "applyTrackingExternalId");

    renderWithProviders(
      <TrackingIdentityListener
        metaPixelId={undefined}
        tiktokPixelId={undefined}
      />,
      {
        auth: {
          user: { id: "user-1" },
          loading: false,
        },
      },
    );

    await waitFor(() => {
      expect(applySpy).toHaveBeenCalledWith(USER_1_HASH, {
        metaPixelId: undefined,
        tiktokPixelId: undefined,
      });
    });
    expect(window.fbq).not.toHaveBeenCalled();
    expect(window.ttq?.identify).not.toHaveBeenCalled();
  });
});
