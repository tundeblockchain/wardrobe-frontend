import { useMemo } from "react";
import { useApi } from "./useApi";
import { createWishlistApi, type WishlistApi } from "./wishlistApi";

export const useWishlistApi = (): WishlistApi => {
  const api = useApi();

  return useMemo(() => createWishlistApi(api), [api]);
};
