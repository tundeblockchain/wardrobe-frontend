import { expect, vi } from "vitest";
import {
  createFreeAtLimitResourceApi,
  createMockResourceApi,
} from "../api/mockResourceApi";
import type { ResourceApi } from "../api/resourceApi";
import type { Entitlement } from "../api/resourceTypes";

const SETTLE_MS = 50;
const MAX_ME_FETCHES = 2;

type MockResourceApiOverrides = Parameters<typeof createMockResourceApi>[0];
type MockResourceApiOptions = Parameters<typeof createMockResourceApi>[1];

const withUnstableGetMe = (
  api: ResourceApi,
  getMe: ReturnType<typeof vi.fn<(...args: unknown[]) => Promise<Entitlement>>>,
): ResourceApi => {
  return {
    ...api,
    get getMe() {
      return () => getMe();
    },
  };
};

export const createUnstableGetMeApi = (
  getMe: ReturnType<typeof vi.fn<(...args: unknown[]) => Promise<Entitlement>>>,
  overrides: MockResourceApiOverrides = {},
  options?: MockResourceApiOptions,
): ResourceApi => {
  return withUnstableGetMe(
    createMockResourceApi({ ...overrides, getMe }, options),
    getMe,
  );
};

export const createUnstableFreeAtLimitGetMeApi = (
  getMe: ReturnType<typeof vi.fn<(...args: unknown[]) => Promise<Entitlement>>>,
  overrides: MockResourceApiOverrides = {},
  options?: Parameters<typeof createFreeAtLimitResourceApi>[1],
): ResourceApi => {
  return withUnstableGetMe(
    createFreeAtLimitResourceApi({ ...overrides, getMe }, options),
    getMe,
  );
};

export const expectBoundedGetMeFetches = async (
  getMe: { mock: { calls: unknown[] } },
): Promise<void> => {
  await new Promise<void>((resolve) => {
    setTimeout(resolve, SETTLE_MS);
  });
  expect(getMe.mock.calls.length).toBeGreaterThan(0);
  expect(getMe.mock.calls.length).toBeLessThanOrEqual(MAX_ME_FETCHES);
};
