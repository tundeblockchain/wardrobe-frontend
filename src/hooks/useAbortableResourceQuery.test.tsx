import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { clearClientSessionCache } from "../auth/clearClientSessionCache";
import { ApiError } from "../api/httpClient";
import { renderWithProviders } from "../test/renderWithProviders";
import {
  CATALOG_LIST_QUERY_KEYS,
  invalidateResourceQueries,
} from "./resourceQueryCache";
import { useAbortableResourceQuery } from "./useAbortableResourceQuery";

const QueryProbe = ({
  queryKey,
  queryFn,
}: {
  queryKey: string;
  queryFn: (signal: AbortSignal) => Promise<string>;
}) => {
  const query = useAbortableResourceQuery(queryKey, queryFn);

  return (
    <div>
      {query.status === "loading" ? <p>loading</p> : null}
      {query.status === "error" ? <p>{query.error.message}</p> : null}
      {query.status === "ready" ? <p>{query.data}</p> : null}
      <button type="button" onClick={query.handleRetry}>
        retry
      </button>
    </div>
  );
};

describe("useAbortableResourceQuery", () => {
  it("fetches once and retries only from Refresh", async () => {
    const queryFn = vi
      .fn<(signal: AbortSignal) => Promise<string>>()
      .mockResolvedValueOnce("first")
      .mockResolvedValueOnce("second");
    const user = userEvent.setup();

    renderWithProviders(
      <QueryProbe queryKey="recommendations:wd_1" queryFn={queryFn} />,
      { auth: { user: { id: "user-1" } } },
    );

    expect(await screen.findByText("first")).toBeInTheDocument();
    invalidateResourceQueries([CATALOG_LIST_QUERY_KEYS.outfits]);
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 30);
    });
    expect(screen.getByText("first")).toBeInTheDocument();
    expect(queryFn).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: "retry" }));
    await waitFor(() => {
      expect(screen.getByText("second")).toBeInTheDocument();
    });
    expect(queryFn).toHaveBeenCalledTimes(2);
  });

  it("refetches when logout keyed invalidation covers recommendation queries", async () => {
    const queryFn = vi
      .fn<(signal: AbortSignal) => Promise<string>>()
      .mockResolvedValueOnce("stale")
      .mockResolvedValueOnce("fresh");

    renderWithProviders(
      <QueryProbe queryKey="recommendations:wd_1" queryFn={queryFn} />,
      { auth: { user: { id: "user-1" } } },
    );

    expect(await screen.findByText("stale")).toBeInTheDocument();
    clearClientSessionCache();
    await waitFor(() => {
      expect(screen.getByText("fresh")).toBeInTheDocument();
    });
    expect(queryFn).toHaveBeenCalledTimes(2);
  });

  it("aborts the in-flight request on unmount", async () => {
    const queryFn = vi.fn((signal: AbortSignal) => {
      return new Promise<string>((_resolve, reject) => {
        signal.addEventListener(
          "abort",
          () => {
            reject(new DOMException("Aborted", "AbortError"));
          },
          { once: true },
        );
      });
    });
    const { unmount } = renderWithProviders(
      <QueryProbe queryKey="recommendations:wd_1" queryFn={queryFn} />,
      { auth: { user: { id: "user-1" } } },
    );

    await waitFor(() => {
      expect(queryFn).toHaveBeenCalledTimes(1);
    });
    const signal = queryFn.mock.calls[0]?.[0];
    expect(signal?.aborted).toBe(false);
    unmount();
    expect(signal?.aborted).toBe(true);
  });

  it("surfaces a non-abort error", async () => {
    renderWithProviders(
      <QueryProbe
        queryKey="recommendations:wd_1"
        queryFn={async () => {
          throw new ApiError({ status: 500, message: "Server error" });
        }}
      />,
      { auth: { user: { id: "user-1" } } },
    );

    expect(await screen.findByText("Server error")).toBeInTheDocument();
  });
});
