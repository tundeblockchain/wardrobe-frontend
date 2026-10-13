import { request, type RequestOptions } from "./httpClient";

export type PublicRequestOptions = RequestOptions;

export const publicRequest = async <T>(
  path: string,
  options: PublicRequestOptions = {},
): Promise<T> => {
  return request<T>(path, options);
};
