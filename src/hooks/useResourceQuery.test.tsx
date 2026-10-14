import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ApiError } from "../api/httpClient";
import { renderWithProviders } from "../test/renderWithProviders";
import { invalidateCatalogLists } from "./resourceQueryCache";
import { invalidateResourceQueries } from "./resourceQueryInvalidation";
import { useResourceQuery } from "./useResourceQuery";

const QueryProbe = ({
  queryKey,
  queryFn,
}: {
  queryKey: string;
  queryFn: () => Promise<string>;
}) => {
  const query = useResourceQuery(queryKey, queryFn);

  if (query.status === "loading") {
    return <p>loading</p>;
  }

  if (query.status === "error") {
    return (
      <div>
        <p>{query.error.message}</p>
        <button type="button" onClick={query.handleRetry}>
          retry
        </button>
      </div>
    );
  }

  return <p>{query.data}</p>;
};

describe("useResourceQuery", () => {
  it("renders ready data and can retry after an error", async () => {
    const queryFn = vi
      .fn()
      .mockRejectedValueOnce(
        new ApiError({ status: 500, message: "Server error" }),
      )
      .mockResolvedValueOnce("ready");
    const user = userEvent.setup();

    renderWithProviders(
      <QueryProbe queryKey="probe" queryFn={queryFn} />,
      { auth: { user: { id: "user-1" } } },
    );

    expect(screen.getByText("loading")).toBeInTheDocument();
    expect(await screen.findByText("Server error")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "retry" }));

    await waitFor(() => {
      expect(screen.getByText("ready")).toBeInTheDocument();
    });
    expect(queryFn).toHaveBeenCalledTimes(2);
  });

  it("refetches a catalog list after cache invalidation", async () => {
    const queryFn = vi
      .fn()
      .mockResolvedValueOnce("stale")
      .mockResolvedValueOnce("fresh");

    renderWithProviders(
      <QueryProbe queryKey="wardrobes" queryFn={queryFn} />,
      { auth: { user: { id: "user-1" } } },
    );

    expect(await screen.findByText("stale")).toBeInTheDocument();

    invalidateCatalogLists();

    await waitFor(() => {
      expect(screen.getByText("fresh")).toBeInTheDocument();
    });
    expect(queryFn).toHaveBeenCalledTimes(2);
  });

  it("refetches entitlements after cache invalidation", async () => {
    const queryFn = vi
      .fn()
      .mockResolvedValueOnce("used-2")
      .mockResolvedValueOnce("used-1");

    renderWithProviders(<QueryProbe queryKey="me" queryFn={queryFn} />, {
      auth: { user: { id: "user-1" } },
    });

    expect(await screen.findByText("used-2")).toBeInTheDocument();

    invalidateCatalogLists();

    await waitFor(() => {
      expect(screen.getByText("used-1")).toBeInTheDocument();
    });
    expect(queryFn).toHaveBeenCalledTimes(2);
  });

  it("refetches Virtual Profiles after wardrobe-delete cache invalidation", async () => {
    const queryFn = vi
      .fn()
      .mockResolvedValueOnce("stale-profiles")
      .mockResolvedValueOnce("fresh-profiles");

    renderWithProviders(
      <QueryProbe queryKey="virtual-profiles" queryFn={queryFn} />,
      { auth: { user: { id: "user-1" } } },
    );

    expect(await screen.findByText("stale-profiles")).toBeInTheDocument();

    invalidateCatalogLists();

    await waitFor(() => {
      expect(screen.getByText("fresh-profiles")).toBeInTheDocument();
    });
    expect(queryFn).toHaveBeenCalledTimes(2);
  });

  it("refetches when resource queries are invalidated", async () => {
    const queryFn = vi
      .fn()
      .mockResolvedValueOnce("first")
      .mockResolvedValueOnce("second");

    renderWithProviders(
      <QueryProbe queryKey="probe" queryFn={queryFn} />,
      { auth: { user: { id: "user-1" } } },
    );

    expect(await screen.findByText("first")).toBeInTheDocument();
    invalidateResourceQueries();
    await waitFor(() => {
      expect(screen.getByText("second")).toBeInTheDocument();
    });
    expect(queryFn).toHaveBeenCalledTimes(2);
  });

  it("does not enter a refetch loop or repeat GET /me when queryFn is unstable", async () => {
    const queryFn = vi.fn<() => Promise<string>>().mockResolvedValue("ready");
    const UnstableMeProbe = () => {
      const query = useResourceQuery("me", () => queryFn());

      if (query.status !== "ready") {
        return <p>loading</p>;
      }

      return <p>{query.data}</p>;
    };

    renderWithProviders(<UnstableMeProbe />, {
      auth: { user: { id: "user-1" } },
    });

    expect(await screen.findByText("ready")).toBeInTheDocument();
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 50);
    });
    expect(queryFn.mock.calls.length).toBeGreaterThan(0);
    expect(queryFn.mock.calls.length).toBeLessThanOrEqual(2);
  });

  it("does not enter a refetch loop for settings-plan when queryFn is unstable", async () => {
    const queryFn = vi.fn<() => Promise<string>>().mockResolvedValue("premium");
    const UnstablePlanProbe = () => {
      const query = useResourceQuery("settings-plan", () => queryFn());

      if (query.status !== "ready") {
        return <p>loading</p>;
      }

      return <p>{query.data}</p>;
    };

    renderWithProviders(<UnstablePlanProbe />, {
      auth: { user: { id: "user-1" } },
    });

    expect(await screen.findByText("premium")).toBeInTheDocument();
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 50);
    });
    expect(queryFn.mock.calls.length).toBeGreaterThan(0);
    expect(queryFn.mock.calls.length).toBeLessThanOrEqual(2);
  });
});
