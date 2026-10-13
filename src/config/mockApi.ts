import { getPublicAppEnv, type EnvSource } from "./env";

export const isMockApi = (source: EnvSource = import.meta.env): boolean => {
  return getPublicAppEnv(source).useMockApi;
};
