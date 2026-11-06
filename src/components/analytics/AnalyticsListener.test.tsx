import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AnalyticsListener } from "./AnalyticsListener";

describe("AnalyticsListener", () => {
  afterEach(() => {
    delete window.gtag;
    delete window.fbq;
    delete window.ttq;
  });

  it("does not fire page views when tracking IDs are unset", () => {
    window.gtag = vi.fn();
    window.fbq = vi.fn();
    window.ttq = Object.assign(vi.fn(), { track: vi.fn() });

    render(
      <MemoryRouter>
        <AnalyticsListener
          gaMeasurementId={undefined}
          metaPixelId={undefined}
          tiktokPixelId={undefined}
        />
      </MemoryRouter>,
    );

    expect(window.gtag).not.toHaveBeenCalled();
    expect(window.fbq).not.toHaveBeenCalled();
    expect(window.ttq?.track).not.toHaveBeenCalled();
  });

  it("does not fire page views for invalid tracking IDs", () => {
    window.gtag = vi.fn();
    window.fbq = vi.fn();
    window.ttq = Object.assign(vi.fn(), { track: vi.fn() });

    render(
      <MemoryRouter>
        <AnalyticsListener
          gaMeasurementId="not-valid"
          metaPixelId="abc"
          tiktokPixelId="nope"
        />
      </MemoryRouter>,
    );

    expect(window.gtag).not.toHaveBeenCalled();
    expect(window.fbq).not.toHaveBeenCalled();
    expect(window.ttq?.track).not.toHaveBeenCalled();
  });

  it("fires a templated page view when a valid Google Analytics ID is provided", () => {
    window.gtag = vi.fn();

    render(
      <MemoryRouter initialEntries={["/app/wardrobes/wd_weekend01"]}>
        <AnalyticsListener
          gaMeasurementId="G-XXXXXXXXXX"
          metaPixelId={undefined}
          tiktokPixelId={undefined}
        />
      </MemoryRouter>,
    );

    expect(window.gtag).toHaveBeenCalledWith(
      "event",
      "page_view",
      expect.objectContaining({ page_path: "/app/wardrobes/:id" }),
    );
    expect(JSON.stringify((window.gtag as ReturnType<typeof vi.fn>).mock.calls)).not.toContain(
      "wd_weekend01",
    );
    expect(window.fbq).toBeUndefined();
  });

  it("fires Meta and TikTok page views when those IDs are provided", () => {
    window.fbq = vi.fn();
    window.ttq = Object.assign(vi.fn(), { track: vi.fn() });

    render(
      <MemoryRouter>
        <AnalyticsListener
          gaMeasurementId={undefined}
          metaPixelId="000000000000000"
          tiktokPixelId="CXXXXXXXXXXXXXXXXX"
        />
      </MemoryRouter>,
    );

    expect(window.fbq).toHaveBeenCalledWith(
      "track",
      "PageView",
      expect.objectContaining({ page_path: "/" }),
      expect.objectContaining({ eventID: expect.any(String) }),
    );
    expect(window.ttq?.track).toHaveBeenCalledWith(
      "PageView",
      expect.objectContaining({ page_path: "/" }),
      expect.objectContaining({ event_id: expect.any(String) }),
    );
    expect(window.gtag).toBeUndefined();
  });
});
