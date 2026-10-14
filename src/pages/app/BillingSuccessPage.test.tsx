import { act, fireEvent, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { mockEntitlement, mockFreeAtLimitEntitlement } from "../../api/mockResourceApi";
import { appPaths } from "../../routes/paths";
import { renderWithProviders } from "../../test/renderWithProviders";
import {
  BILLING_SUCCESS_MAX_ATTEMPTS,
  BillingSuccessPage,
} from "./BillingSuccessPage";

const flushPoll = async (intervalMs = 2_500) => {
  await act(async () => {
    await Promise.resolve();
    await vi.advanceTimersByTimeAsync(intervalMs);
    await Promise.resolve();
  });
};

describe("BillingSuccessPage", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("stays in processing while paidTier is missing, even with session_id in the URL", async () => {
    const getMe = vi.fn().mockResolvedValue({
      ...mockFreeAtLimitEntitlement,
      paidTier: null,
    });

    renderWithProviders(
      <BillingSuccessPage getMe={getMe} pollIntervalMs={2_500} maxAttempts={8} />,
      {
        route: `${appPaths.appBillingSuccess}?session_id=cs_test_should_not_grant`,
        auth: { user: { id: "user-1" } },
      },
    );

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "Setting up your plan",
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "You are subscribed" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/cs_test/)).not.toBeInTheDocument();
    expect(getMe).toHaveBeenCalled();
  });

  it("polls /me until paidTier appears and then shows success", async () => {
    vi.useFakeTimers();
    const getMe = vi
      .fn()
      .mockResolvedValueOnce({ ...mockFreeAtLimitEntitlement, paidTier: null })
      .mockResolvedValueOnce({ ...mockFreeAtLimitEntitlement, paidTier: null })
      .mockResolvedValueOnce({
        ...mockEntitlement,
        paidTier: { tier: "basic", source: "stripe" },
      });

    renderWithProviders(
      <BillingSuccessPage getMe={getMe} pollIntervalMs={2_500} maxAttempts={8} />,
      {
        route: `${appPaths.appBillingSuccess}?session_id=cs_test_ignored`,
        auth: { user: { id: "user-1" } },
      },
    );

    await act(async () => {
      await Promise.resolve();
    });
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Setting up your plan",
      }),
    ).toBeInTheDocument();
    expect(getMe).toHaveBeenCalledTimes(1);

    await flushPoll();
    expect(getMe).toHaveBeenCalledTimes(2);

    await flushPoll();
    expect(
      screen.getByRole("heading", { level: 1, name: "You are subscribed" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Go to the dashboard" }),
    ).toHaveAttribute("href", appPaths.app);
    expect(getMe).toHaveBeenCalledTimes(3);
  });

  it("caps /me polling and Retry starts one more capped round", async () => {
    vi.useFakeTimers();
    const getMe = vi.fn().mockResolvedValue({
      ...mockFreeAtLimitEntitlement,
      paidTier: null,
    });

    renderWithProviders(
      <BillingSuccessPage getMe={getMe} pollIntervalMs={2_500} maxAttempts={8} />,
      { auth: { user: { id: "user-1" } } },
    );

    for (let attempt = 0; attempt < BILLING_SUCCESS_MAX_ATTEMPTS; attempt += 1) {
      await flushPoll();
    }

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Your plan is being set up. Refresh in a moment.",
      }),
    ).toBeInTheDocument();
    expect(getMe).toHaveBeenCalledTimes(BILLING_SUCCESS_MAX_ATTEMPTS);

    fireEvent.click(
      screen.getByRole("button", { name: "Check plan status again" }),
    );

    for (let attempt = 0; attempt < BILLING_SUCCESS_MAX_ATTEMPTS; attempt += 1) {
      await flushPoll();
    }

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Your plan is being set up. Refresh in a moment.",
      }),
    ).toBeInTheDocument();
    expect(getMe).toHaveBeenCalledTimes(BILLING_SUCCESS_MAX_ATTEMPTS * 2);
  });

  it("stops polling and aborts in-flight /me after unmount", async () => {
    vi.useFakeTimers();
    const getMe = vi.fn((signal?: AbortSignal) => {
      return new Promise<never>((_resolve, reject) => {
        signal?.addEventListener(
          "abort",
          () => {
            reject(new DOMException("Aborted", "AbortError"));
          },
          { once: true },
        );
      });
    });

    const { unmount } = renderWithProviders(
      <BillingSuccessPage getMe={getMe} pollIntervalMs={2_500} maxAttempts={8} />,
      { auth: { user: { id: "user-1" } } },
    );

    await act(async () => {
      await Promise.resolve();
    });
    expect(getMe).toHaveBeenCalledTimes(1);
    const signal = getMe.mock.calls[0]?.[0];
    expect(signal).toBeInstanceOf(AbortSignal);
    expect(signal?.aborted).toBe(false);

    unmount();

    expect(signal?.aborted).toBe(true);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2_500 * 20);
    });
    expect(getMe).toHaveBeenCalledTimes(1);
  });
});
