import { useMemo } from "react";
import { createResourceApi, type ResourceApi } from "./resourceApi";
import { useApi } from "./useApi";

export const useResourceApi = (): ResourceApi => {
  const api = useApi();

  return useMemo(() => createResourceApi(api), [api]);
};
