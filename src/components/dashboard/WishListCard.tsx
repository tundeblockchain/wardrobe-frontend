import type { KeyboardEvent } from "react";
import CheckroomOutlined from "@mui/icons-material/CheckroomOutlined";
import { Box, Paper, Stack, Typography } from "@mui/material";
import {
  formatWishPrice,
  getWishImageUrl,
  type WishItem,
} from "../../api/wishlistApi";
import { dashboardCopy } from "../../content/dashboardCopy";
import { ResourceImage } from "./ResourceImage";
import { DEFAULT_RESOURCE_CARD_IMAGE_ASPECT_RATIO } from "./ResourceCard";

export const WISH_LIST_CARD_TEST_ID = "wish-list-card";

export type WishListCardProps = {
  wish: WishItem;
  onOpen: (wish: WishItem) => void;
};

export const WishListCard = ({ wish, onOpen }: WishListCardProps) => {
  const copy = dashboardCopy.wishList;
  const titleId = `wish-${wish.wishId}-title`;
  const priceLabel = formatWishPrice(wish.price);

  const handleClick = () => {
    onOpen(wish);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    onOpen(wish);
  };

  return (
    <Paper
      component="button"
      type="button"
      elevation={0}
      tabIndex={0}
      aria-label={wish.name}
      aria-labelledby={titleId}
      data-testid={WISH_LIST_CARD_TEST_ID}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      sx={{
        display: "block",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        textAlign: "left",
        cursor: "pointer",
        p: 0,
        color: "inherit",
        font: "inherit",
        border: 1,
        borderColor: "divider",
        bgcolor: "background.paper",
        "&:hover": {
          borderColor: "primary.light",
        },
        "&:focus-visible": {
          outline: "2px solid",
          outlineColor: "primary.main",
          outlineOffset: 2,
        },
      }}
    >
      <Box
        data-testid="wish-list-card-image-frame"
        data-aspect-ratio={DEFAULT_RESOURCE_CARD_IMAGE_ASPECT_RATIO}
        sx={{
          aspectRatio: DEFAULT_RESOURCE_CARD_IMAGE_ASPECT_RATIO,
          overflow: "hidden",
        }}
      >
        <ResourceImage
          imageUrl={getWishImageUrl(wish)}
          alt={wish.name}
          fallbackLabel={copy.photoFallback}
          FallbackIcon={CheckroomOutlined}
        />
      </Box>
      <Stack spacing={0.5} sx={{ p: 1.5 }}>
        <Typography id={titleId} variant="h3" component="p">
          {wish.name}
        </Typography>
        {priceLabel ? (
          <Typography variant="body2" color="text.secondary">
            {priceLabel}
          </Typography>
        ) : null}
      </Stack>
    </Paper>
  );
};
