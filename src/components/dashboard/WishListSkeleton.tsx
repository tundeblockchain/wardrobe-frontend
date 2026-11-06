import { Skeleton, Stack } from "@mui/material";
import { dashboardCopy } from "../../content/dashboardCopy";
import {
  HorizontalResourceCardItem,
  HorizontalResourceCardList,
} from "./HorizontalResourceCardList";
import { DEFAULT_RESOURCE_CARD_IMAGE_ASPECT_RATIO } from "./ResourceCard";

export const WISH_LIST_SKELETON_TEST_ID = "wish-list-skeleton";
export const WISH_LIST_SKELETON_COUNT = 4;

export const WishListSkeleton = () => {
  const copy = dashboardCopy.wishList;

  return (
    <Stack
      spacing={1}
      role="status"
      aria-live="polite"
      aria-label={copy.loadingLabel}
      data-testid={WISH_LIST_SKELETON_TEST_ID}
    >
      <HorizontalResourceCardList label={copy.loadingLabel}>
        {Array.from({ length: WISH_LIST_SKELETON_COUNT }, (_, index) => (
          <HorizontalResourceCardItem key={`wish-skeleton-${index}`}>
            <Stack spacing={1}>
              <Skeleton
                variant="rounded"
                sx={{
                  aspectRatio: DEFAULT_RESOURCE_CARD_IMAGE_ASPECT_RATIO,
                  height: "auto",
                  width: "100%",
                }}
              />
              <Skeleton variant="text" width="80%" />
              <Skeleton variant="text" width="50%" />
            </Stack>
          </HorizontalResourceCardItem>
        ))}
      </HorizontalResourceCardList>
    </Stack>
  );
};
