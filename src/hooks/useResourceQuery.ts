import { useEffect, useState } from "react";
import { ApiError, isApiError } from "../api/httpClient";
import {
  resourceQueryKeyMatches,
  subscribeResourceQueryInvalidation as subscribeKeyedInvalidation,
} from "./resourceQueryCache";
import { subscribeResourceQueryInvalidation as subscribeAllInvalidation } from "./resourceQueryInvalidation";

export type ResourceQueryState<T> =
  | { status: "loading" }
  | { status: "ready"; data: T }
  | { status: "error"; error: ApiError };

export type UseResourceQueryResult<T> = ResourceQueryState<T> & {
  handleRetry: () => void;
};

type CachedResourceQuery<T> = {
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
  cached: CachedResourceQuery<T> | undefined,
  queryKey: string,
  reloadCount: number,
): cached is CachedResourceQuery<T> => {
  if (!cached) {
    return false;
  }

  return cached.queryKey === queryKey && cached.reloadCount === reloadCount;
};

export const useResourceQuery = <T>(
  queryKey: string,
  queryFn: () => Promise<T>,
): UseResourceQueryResult<T> => {
  const [reloadCount, setReloadCount] = useState(0);
  const [cached, setCached] = useState<CachedResourceQuery<T> | undefined>(
    undefined,
  );

  const handleRetry = () => {
    setReloadCount((currentCount) => currentCount + 1);
  };

  useEffect(() => {
    const handleInvalidate = () => {
      setReloadCount((currentCount) => currentCount + 1);
    };

    const unsubscribeAll = subscribeAllInvalidation(handleInvalidate);
    const unsubscribeKeyed = subscribeKeyedInvalidation((keys) => {
      if (resourceQueryKeyMatches(queryKey, keys)) {
        handleInvalidate();
      }
    });

    return () => {
      unsubscribeAll();
      unsubscribeKeyed();
    };
  }, [queryKey]);

  useEffect(() => {
    let isCancelled = false;

    const loadResource = async () => {
      try {
        const data = await queryFn();
        if (isCancelled) {
          return;
        }

        setCached({
          queryKey,
          reloadCount,
          result: { status: "ready", data },
        });
      } catch (error) {
        if (isCancelled) {
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
    };
  }, [queryFn, queryKey, reloadCount]);

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
