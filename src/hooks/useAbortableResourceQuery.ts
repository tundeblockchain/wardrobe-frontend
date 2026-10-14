import { useEffect, useRef, useState } from "react";
import { ApiError, isApiError } from "../api/httpClient";
import {
  resourceQueryKeyMatches,
  subscribeResourceQueryInvalidation,
} from "./resourceQueryCache";
import type {
  ResourceQueryState,
  UseResourceQueryResult,
} from "./useResourceQuery";

type CachedAbortableQuery<T> = {
  queryKey: string;
  reloadCount: number;
  result: Exclude<ResourceQueryState<T>, { status: "loading" }>;
};

const toApiError = (error: unknown): ApiError => {
  if (isApiError(error)) {
    return error;
  }

  return new ApiError({
    status: 0,
    code: "NETWORK",
    message: error instanceof Error ? error.message : "Request failed.",
  });
};

const isCachedForRequest = <T>(
  cached: CachedAbortableQuery<T> | undefined,
  queryKey: string,
  reloadCount: number,
): cached is CachedAbortableQuery<T> => {
  if (!cached) {
    return false;
  }

  return cached.queryKey === queryKey && cached.reloadCount === reloadCount;
};

const isAbortError = (error: unknown): boolean => {
  if (error instanceof DOMException) {
    return error.name === "AbortError";
  }

  return error instanceof Error && error.name === "AbortError";
};

/**
 * Fetch once per visit or Refresh. Abort in-flight work on unmount.
 * Subscribes to keyed invalidation so logout (and wardrobe delete) drop
 * recommendation results without refetching on unrelated keys like outfits.
 */
export const useAbortableResourceQuery = <T>(
  queryKey: string,
  queryFn: (signal: AbortSignal) => Promise<T>,
): UseResourceQueryResult<T> => {
  const [reloadCount, setReloadCount] = useState(0);
  const [cached, setCached] = useState<CachedAbortableQuery<T> | undefined>(
    undefined,
  );
  const queryFnRef = useRef(queryFn);

  useEffect(() => {
    queryFnRef.current = queryFn;
  }, [queryFn]);

  const handleRetry = () => {
    setReloadCount((currentCount) => currentCount + 1);
  };

  useEffect(() => {
    const unsubscribe = subscribeResourceQueryInvalidation((keys) => {
      if (resourceQueryKeyMatches(queryKey, keys)) {
        setReloadCount((currentCount) => currentCount + 1);
      }
    });

    return unsubscribe;
  }, [queryKey]);

  useEffect(() => {
    const abortController = new AbortController();
    let isCancelled = false;

    const loadResource = async () => {
      try {
        const data = await queryFnRef.current(abortController.signal);
        if (isCancelled || abortController.signal.aborted) {
          return;
        }

        setCached({
          queryKey,
          reloadCount,
          result: { status: "ready", data },
        });
      } catch (error) {
        if (
          isCancelled ||
          abortController.signal.aborted ||
          isAbortError(error)
        ) {
          return;
        }

        setCached({
          queryKey,
          reloadCount,
          result: { status: "error", error: toApiError(error) },
        });
      }
    };

    void loadResource();

    return () => {
      isCancelled = true;
      abortController.abort();
    };
  }, [queryKey, reloadCount]);

  if (!isCachedForRequest(cached, queryKey, reloadCount)) {
    return {
      status: "loading",
      handleRetry,
    };
  }

  return {
    ...cached.result,
    handleRetry,
  };
};
