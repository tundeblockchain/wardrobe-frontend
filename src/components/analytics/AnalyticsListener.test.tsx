import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AnalyticsListener } from "./AnalyticsListener";

describe("AnalyticsListener", () => {
  afterEach(() => {
    delete window.gtag;
    delete window.fbq;
  });

  it("does not fire page views when tracking IDs are unset", () => {
    window.gtag = vi.fn();
    window.fbq = vi.fn();

    render(
      <MemoryRouter>
        <AnalyticsListener
          gaMeasurementId={undefined}
          metaPixelId={undefined}
        />
      </MemoryRouter>,
    );

    expect(window.gtag).not.toHaveBeenCalled();
    expect(window.fbq).not.toHaveBeenCalled();
  });

  it("does not fire page views for invalid tracking IDs", () => {
    window.gtag = vi.fn();
    window.fbq = vi.fn();

    render(
      <MemoryRouter>
        <AnalyticsListener gaMeasurementId="not-valid" metaPixelId="abc" />
      </MemoryRouter>,
    );

    expect(window.gtag).not.toHaveBeenCalled();
    expect(window.fbq).not.toHaveBeenCalled();
  });

  it("fires a page view when a valid Google Analytics ID is provided", () => {
    window.gtag = vi.fn();

    render(
      <MemoryRouter>
        <AnalyticsListener
          gaMeasurementId="G-XXXXXXXXXX"
          metaPixelId={undefined}
        />
      </MemoryRouter>,
    );

    expect(window.gtag).toHaveBeenCalledWith(
      "event",
      "page_view",
      expect.objectContaining({ page_path: "/" }),
    );
    expect(window.fbq).toBeUndefined();
  });

  it("fires a Meta PageView when a valid pixel ID is provided", () => {
    window.fbq = vi.fn();

    render(
      <MemoryRouter>
        <AnalyticsListener
          gaMeasurementId={undefined}
          metaPixelId="000000000000000"
        />
      </MemoryRouter>,
    );

    expect(window.fbq).toHaveBeenCalledWith("track", "PageView");
    expect(window.gtag).toBeUndefined();
  });
});
