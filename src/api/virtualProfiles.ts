import { isEntitlementAiRequiredError } from "./entitlementGating";
import type { ResourceApi } from "./resourceApi";
import type { AiProfile } from "./resourceTypes";

export const mergeVirtualProfiles = (
  personal: AiProfile[],
  presets: AiProfile[],
): AiProfile[] => {
  const seenIds = new Set<string>();
  const merged: AiProfile[] = [];

  for (const profile of [...personal, ...presets]) {
    if (seenIds.has(profile.aiProfileId)) {
      continue;
    }

    seenIds.add(profile.aiProfileId);
    merged.push(profile);
  }

  return merged;
};

export const loadListedVirtualProfiles = async (
  resourceApi: Pick<ResourceApi, "listAiProfiles" | "listGenericAiProfiles">,
): Promise<AiProfile[]> => {
  const generic = await resourceApi.listGenericAiProfiles();
  let personal: AiProfile[] = [];
  try {
    personal = (await resourceApi.listAiProfiles()).aiProfiles;
  } catch (error) {
    if (!isEntitlementAiRequiredError(error)) {
      throw error;
    }
  }

  return mergeVirtualProfiles(personal, generic.aiProfiles);
};
