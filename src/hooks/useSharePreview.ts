import { useEffect, useState } from "react";
import {
  fetchSharePreview,
  type FetchSharePreviewInput,
  type SharePreviewQueryResult,
} from "../api/sharePreview";

export type UseSharePreviewOptions = Omit<FetchSharePreviewInput, "fetchImpl"> & {
  requestSharePreview?: typeof fetchSharePreview;
};

export type SharePreviewViewState =
  | { status: "loading" }
  | SharePreviewQueryResult;

export type UseSharePreviewResult = SharePreviewViewState & {
  handleRetry: () => void;
};

type CachedSharePreview = {
  apiBaseUrl: string | undefined;
  token: string | undefined;
  reloadCount: number;
  result: SharePreviewQueryResult;
};

const isCachedForRequest = (
  cached: CachedSharePreview | undefined,
  apiBaseUrl: string | undefined,
  token: string | undefined,
  reloadCount: number,
): cached is CachedSharePreview => {
  if (!cached) {
    return false;
  }

  return (
    cached.apiBaseUrl === apiBaseUrl &&
    cached.token === token &&
    cached.reloadCount === reloadCount
  );
};

export const useSharePreview = ({
  apiBaseUrl,
  token,
  requestSharePreview = fetchSharePreview,
}: UseSharePreviewOptions): UseSharePreviewResult => {
  const [reloadCount, setReloadCount] = useState(0);
  const [cached, setCached] = useState<CachedSharePreview | undefined>(
    undefined,
  );

  const handleRetry = () => {
    setReloadCount((currentCount) => currentCount + 1);
  };

  useEffect(() => {
    let isCancelled = false;

    const loadSharePreview = async () => {
      const result = await requestSharePreview({ apiBaseUrl, token });
      if (isCancelled) {
        return;
      }

      setCached({
        apiBaseUrl,
        token,
        reloadCount,
        result,
      });
    };

    void loadSharePreview();

    return () => {
      isCancelled = true;
    };
  }, [apiBaseUrl, requestSharePreview, token, reloadCount]);

  if (!isCachedForRequest(cached, apiBaseUrl, token, reloadCount)) {
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
