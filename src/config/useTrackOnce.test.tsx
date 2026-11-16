import { StrictMode, useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useTrackOnce } from "./useTrackOnce";

vi.mock("./trackingEvents", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./trackingEvents")>();
  return {
    ...actual,
    trackEvent: vi.fn(),
  };
});

import { trackEvent } from "./trackingEvents";

const mockedTrackEvent = vi.mocked(trackEvent);

const TrackOnceProbe = ({
  enabled,
  resultCount,
}: {
  enabled: boolean;
  resultCount?: number;
}) => {
  useTrackOnce(
    "view_recommendations",
    enabled,
    enabled ? { content_type: "recommendations", result_count: resultCount ?? 0 } : undefined,
  );
  return <p>Probe {enabled ? "ready" : "loading"}</p>;
};

const RefetchHost = () => {
  const [enabled, setEnabled] = useState(true);
  const [resultCount, setResultCount] = useState(2);

  const handleRefetch = () => {
    setEnabled(false);
    setResultCount(5);
    queueMicrotask(() => {
      setEnabled(true);
    });
  };

  return (
    <div>
      <TrackOnceProbe enabled={enabled} resultCount={resultCount} />
      <button type="button" onClick={handleRefetch}>
        Refetch
      </button>
    </div>
  );
};

describe("useTrackOnce", () => {
  beforeEach(() => {
    mockedTrackEvent.mockClear();
  });

  afterEach(() => {
    mockedTrackEvent.mockClear();
  });

  it("fires once for a mount, including React StrictMode double effects", async () => {
    render(
      <StrictMode>
        <TrackOnceProbe enabled resultCount={3} />
      </StrictMode>,
    );

    expect(await screen.findByText("Probe ready")).toBeInTheDocument();
    await vi.waitFor(() => {
      expect(mockedTrackEvent).toHaveBeenCalledTimes(1);
    });
    expect(mockedTrackEvent).toHaveBeenCalledWith("view_recommendations", {
      content_type: "recommendations",
      result_count: 3,
    });
  });

  it("fires again when the screen is unmounted and opened again", async () => {
    const first = render(<TrackOnceProbe enabled resultCount={1} />);
    await vi.waitFor(() => {
      expect(mockedTrackEvent).toHaveBeenCalledTimes(1);
    });
    first.unmount();

    render(<TrackOnceProbe enabled resultCount={1} />);
    await vi.waitFor(() => {
      expect(mockedTrackEvent).toHaveBeenCalledTimes(2);
    });
  });

  it("does not fire again on re-render or refetch while mounted", async () => {
    const user = userEvent.setup();
    render(<RefetchHost />);

    await vi.waitFor(() => {
      expect(mockedTrackEvent).toHaveBeenCalledTimes(1);
    });
    expect(mockedTrackEvent).toHaveBeenCalledWith("view_recommendations", {
      content_type: "recommendations",
      result_count: 2,
    });

    await user.click(screen.getByRole("button", { name: "Refetch" }));
    expect(await screen.findByText("Probe ready")).toBeInTheDocument();
    await Promise.resolve();
    expect(mockedTrackEvent).toHaveBeenCalledTimes(1);
  });

  it("does not fire while disabled", async () => {
    render(<TrackOnceProbe enabled={false} />);

    expect(screen.getByText("Probe loading")).toBeInTheDocument();
    await Promise.resolve();
    expect(mockedTrackEvent).not.toHaveBeenCalled();
  });
});
